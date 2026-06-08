"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import {
  damageReports,
  assets,
  assetMovements,
} from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import {
  createDamageReportSchema,
  updateDamageReportSchema,
} from "./schemas"
import type { AssetStatus, MovementType } from "@/features/assets/statuses"

export async function createDamageReport(
  input: FormData | Record<string, unknown>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = createDamageReportSchema.parse(raw)
  const db = getDatabase()

  const [report] = await db
    .insert(damageReports)
    .values({
      tenantId: session.user.tenantId,
      assetId: parsed.assetId,
      bookingId: parsed.bookingId ?? null,
      clientId: parsed.clientId ?? null,
      photoUrl: parsed.photoUrl,
      description: parsed.description ?? null,
      repairCost: parsed.repairCost != null ? String(parsed.repairCost) : null,
      status: "pending",
      reportedBy: session.user.name ?? session.user.email ?? "system",
    })
    .returning()

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.id, parsed.assetId), eq(assets.tenantId, session.user.tenantId))
    )
    .limit(1)

  if (asset && asset.status !== "damaged") {
    const fromStatus = asset.status as AssetStatus
    await db
      .update(assets)
      .set({ status: "damaged", updatedAt: new Date() })
      .where(eq(assets.id, parsed.assetId))

    await db.insert(assetMovements).values({
      tenantId: session.user.tenantId,
      assetId: parsed.assetId,
      bookingId: parsed.bookingId ?? null,
      movementType: "damage_reported" as MovementType,
      fromStatus,
      toStatus: "damaged" as AssetStatus,
      performedBy: session.user.name ?? session.user.email ?? "system",
      notes: `Damage report #${report.id}: ${parsed.description ?? ""}`,
    })
  }

  revalidatePath("/damage")
  revalidatePath(`/assets/${parsed.assetId}`)
  revalidatePath("/")
  return report
}

export async function resolveDamageReport(
  id: number,
  input: FormData | Record<string, unknown>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = updateDamageReportSchema.parse(raw)
  const db = getDatabase()

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }
  if (parsed.status !== undefined) updateData.status = parsed.status
  if (parsed.repairCost !== undefined) updateData.repairCost = String(parsed.repairCost)
  if (parsed.depositImpact !== undefined) updateData.depositImpact = parsed.depositImpact
  if (parsed.description !== undefined) updateData.description = parsed.description

  if (parsed.status === "repaired" || parsed.status === "written_off") {
    updateData.resolvedAt = new Date()
  }

  const [report] = await db
    .update(damageReports)
    .set(updateData)
    .where(
      and(
        eq(damageReports.id, id),
        eq(damageReports.tenantId, session.user.tenantId)
      )
    )
    .returning()

  if (parsed.status === "repaired" || parsed.status === "written_off") {
    const [damagedAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, report.assetId))
      .limit(1)

    if (damagedAsset) {
      const newStatus: AssetStatus =
        parsed.status === "repaired" ? "available" : "retired"
      await db
        .update(assets)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(assets.id, report.assetId))

      await db.insert(assetMovements).values({
        tenantId: session.user.tenantId,
        assetId: report.assetId,
        movementType:
          parsed.status === "repaired" ? "repair_completed" : "retired",
        fromStatus: "damaged" as AssetStatus,
        toStatus: newStatus,
        performedBy: session.user.name ?? session.user.email ?? "system",
        notes: `Damage report #${report.id} ${
          parsed.status === "repaired" ? "repaired" : "written off"
        }`,
      })
    }
  }

  revalidatePath("/damage")
  revalidatePath(`/assets/${report.assetId}`)
  revalidatePath("/")
  return report
}

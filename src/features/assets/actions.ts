"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, assetMovements } from "@/lib/db/schema"
import { eq, and, or, ilike } from "drizzle-orm"
import { createAssetSchema, updateAssetSchema } from "./schemas"
import { canTransition } from "./statuses"
import type { AssetStatus, MovementType } from "./statuses"

export async function createAsset(input: FormData | Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = createAssetSchema.parse(raw)
  const db = getDatabase()

  const qrToken = randomUUID()
  const [asset] = await db
    .insert(assets)
    .values({
      tenantId: session.user.tenantId,
      name: parsed.name,
      categoryId: parsed.categoryId ?? null,
      locationId: parsed.locationId ?? null,
      serialNumber: parsed.serialNumber ?? null,
      existingCode: parsed.existingCode ?? null,
      qrToken,
      value: parsed.value != null ? String(parsed.value) : null,
      status: "available",
      photoUrl: parsed.photoUrl ?? null,
      isBulk: parsed.isBulk,
      quantity: parsed.quantity,
      condition: parsed.condition ?? null,
      notes: parsed.notes ?? null,
    })
    .returning()

  await db.insert(assetMovements).values({
    tenantId: session.user.tenantId,
    assetId: asset.id,
    movementType: "created" as MovementType,
    toStatus: "available" as AssetStatus,
    quantity: parsed.quantity,
    performedBy: session.user.name ?? session.user.email ?? "system",
  })

  revalidatePath("/assets")
  return asset
}

export async function updateAsset(
  id: number,
  input: FormData | Record<string, unknown>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = updateAssetSchema.parse(raw)
  const db = getDatabase()

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.categoryId !== undefined) updateData.categoryId = parsed.categoryId
  if (parsed.locationId !== undefined) updateData.locationId = parsed.locationId
  if (parsed.serialNumber !== undefined) updateData.serialNumber = parsed.serialNumber
  if (parsed.existingCode !== undefined) updateData.existingCode = parsed.existingCode
  if (parsed.value !== undefined) updateData.value = String(parsed.value)
  if (parsed.condition !== undefined) updateData.condition = parsed.condition
  if (parsed.notes !== undefined) updateData.notes = parsed.notes
  if (parsed.photoUrl !== undefined) updateData.photoUrl = parsed.photoUrl

  const [asset] = await db
    .update(assets)
    .set({ ...updateData, updatedAt: new Date() })
    .where(
      and(eq(assets.id, id), eq(assets.tenantId, session.user.tenantId))
    )
    .returning()

  revalidatePath("/assets")
  revalidatePath(`/assets/${id}`)
  return asset
}

export async function updateAssetStatus(
  id: number,
  newStatus: AssetStatus,
  options?: {
    movementType?: MovementType
    performedBy?: string
    notes?: string
    bookingId?: number
    locationId?: number
    quantity?: number
  }
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.tenantId, session.user.tenantId)))
    .limit(1)

  if (!asset) throw new Error("Asset not found")

  const currentStatus = asset.status as AssetStatus
  if (!canTransition(currentStatus, newStatus)) {
    throw new Error(
      `Invalid status transition: ${currentStatus} → ${newStatus}`
    )
  }

  const [updated] = await db
    .update(assets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(and(eq(assets.id, id), eq(assets.tenantId, session.user.tenantId)))
    .returning()

  await db.insert(assetMovements).values({
    tenantId: session.user.tenantId,
    assetId: id,
    bookingId: options?.bookingId ?? null,
    locationId: options?.locationId ?? null,
    movementType: options?.movementType ?? ("available" as MovementType),
    fromStatus: currentStatus,
    toStatus: newStatus,
    quantity: options?.quantity ?? 1,
    performedBy: options?.performedBy ?? session.user.name ?? session.user.email ?? "system",
    notes: options?.notes ?? null,
  })

  revalidatePath("/assets")
  revalidatePath(`/assets/${id}`)
  return updated
}

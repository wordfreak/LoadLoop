"use server"

import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, assetMovements } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createAssetSchema, updateAssetSchema } from "./schemas"
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

"use server"

import { randomUUID } from "crypto"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, assetMovements, clients } from "@/lib/db/schema"

export async function importAssets(
  rows: Array<Record<string, unknown>>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  for (const row of rows) {
    const name = (row.name as string) ?? ""
    const quantity = (row.quantity as number) ?? 1
    const isBulk = quantity > 1
    const qrToken = randomUUID()

    const [asset] = await db
      .insert(assets)
      .values({
        tenantId,
        name,
        serialNumber: (row.serialNumber as string) ?? null,
        existingCode: (row.existingCode as string) ?? null,
        qrToken,
        value: row.value != null ? String(row.value) : null,
        status: "available",
        isBulk,
        quantity,
        condition: (row.condition as string) ?? null,
        notes: (row.notes as string) ?? null,
      })
      .returning()

    await db.insert(assetMovements).values({
      tenantId,
      assetId: asset.id,
      movementType: "created",
      toStatus: "available",
      quantity,
      performedBy: session.user.name ?? session.user.email ?? "import",
    })
  }

  return { count: rows.length }
}

export async function importClients(
  rows: Array<{ name: string; email?: string; phone?: string; notes?: string }>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  for (const row of rows) {
    await db.insert(clients).values({
      tenantId,
      name: row.name,
      email: row.email ?? null,
      phone: row.phone ?? null,
      notes: row.notes ?? null,
    })
  }

  return { count: rows.length }
}

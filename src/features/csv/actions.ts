"use server"

import { randomUUID } from "crypto"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, assetMovements, clients, categories } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function importAssets(
  rows: Array<Record<string, unknown>>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const existingCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.tenantId, tenantId))

  const categoryMap = new Map<string, number>()
  for (const cat of existingCategories) {
    categoryMap.set(cat.name.toLowerCase(), cat.id)
  }

  for (const row of rows) {
    const name = (row.name as string) ?? ""
    const quantity = (row.quantity as number) ?? 1
    const isBulk = quantity > 1
    const qrToken = randomUUID()

    let categoryId: number | null = null
    const categoryName = (row.category as string)?.trim()
    if (categoryName) {
      const lowerName = categoryName.toLowerCase()
      if (categoryMap.has(lowerName)) {
        categoryId = categoryMap.get(lowerName)!
      }
    }

    const [asset] = await db
      .insert(assets)
      .values({
        tenantId,
        name,
        categoryId,
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

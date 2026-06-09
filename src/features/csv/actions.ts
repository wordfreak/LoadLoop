"use server"

import { randomUUID } from "crypto"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, assetMovements, categories } from "@/lib/db/schema"
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

  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const name = (row.name as string) ?? ""
    if (!name.trim()) continue

    const [existingByName] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(
        and(eq(assets.name, name), eq(assets.tenantId, tenantId))
      )
      .limit(1)

    let duplicate = !!existingByName

    const code = (row.existingCode as string)?.trim()
    if (code && !duplicate) {
      const [byCode] = await db
        .select({ id: assets.id })
        .from(assets)
        .where(
          and(
            eq(assets.existingCode, code),
            eq(assets.tenantId, tenantId)
          )
        )
        .limit(1)
      if (byCode) duplicate = true
    }

    const serial = (row.serialNumber as string)?.trim()
    if (serial && !duplicate) {
      const [bySerial] = await db
        .select({ id: assets.id })
        .from(assets)
        .where(
          and(
            eq(assets.serialNumber, serial),
            eq(assets.tenantId, tenantId)
          )
        )
        .limit(1)
      if (bySerial) duplicate = true
    }

    if (duplicate) {
      skipped++
      continue
    }

    const quantity = (row.quantity as number) ?? 1
    const isBulk = quantity > 1
    const qrToken = randomUUID()

    let categoryId: number | null = null
    const categoryName = (row.category as string)?.trim()
    if (categoryName) {
      const lowerName = categoryName.toLowerCase()
      if (categoryMap.has(lowerName)) {
        categoryId = categoryMap.get(lowerName)!
      } else {
        const [newCat] = await db
          .insert(categories)
          .values({
            tenantId,
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
          })
          .returning()
        categoryMap.set(lowerName, newCat.id)
        categoryId = newCat.id
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

    imported++
  }

  return { count: imported, skipped }
}

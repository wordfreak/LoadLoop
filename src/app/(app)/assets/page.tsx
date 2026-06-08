import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, categories, locations, assetMovements } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import AssetTable from "@/features/assets/table"
import type { AssetRow } from "@/features/assets/table"

export default async function AssetsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()

  let assetRows: AssetRow[] = []
  let categoryNames: string[] = []

  try {
    const assetList = await db
      .select({
        id: assets.id,
        name: assets.name,
        categoryName: categories.name,
        status: assets.status,
        locationName: locations.name,
        value: assets.value,
        photoUrl: assets.photoUrl,
        serialNumber: assets.serialNumber,
      })
      .from(assets)
      .leftJoin(categories, eq(assets.categoryId, categories.id))
      .leftJoin(locations, eq(assets.locationId, locations.id))
      .where(eq(assets.tenantId, session.user.tenantId))
      .orderBy(desc(assets.updatedAt))
      .limit(200)

    const assetIds = assetList.map((a) => a.id)
    const movements =
      assetIds.length > 0
        ? await db
            .select({
              assetId: assetMovements.assetId,
              timestamp: assetMovements.timestamp,
            })
            .from(assetMovements)
            .where(
              eq(assetMovements.tenantId, session.user.tenantId)
              // Note: in() with empty array causes SQL error, handled above
            )
        : []

    const lastMovementMap = new Map<number, string>()
    for (const m of movements) {
      if (!lastMovementMap.has(m.assetId)) {
        const date = new Date(m.timestamp)
        lastMovementMap.set(m.assetId, date.toLocaleDateString())
      }
    }

    assetRows = assetList.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.categoryName ?? "-",
      status: a.status,
      location: a.locationName ?? "-",
      value: a.value ? Number(a.value) : null,
      photoUrl: a.photoUrl,
      serialNumber: a.serialNumber,
      lastMovement: lastMovementMap.get(a.id) ?? "-",
    }))

    categoryNames = [
      ...new Set(assetList.map((a) => a.categoryName).filter(Boolean)),
    ] as string[]
  } catch {
    assetRows = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Assets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {assetRows.length} items in your equipment register
        </p>
      </div>
      <AssetTable data={assetRows} categories={categoryNames} />
    </div>
  )
}

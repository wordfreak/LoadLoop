import { eq } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { assets, tenants } from "@/lib/db/schema"
import { notFound } from "next/navigation"
import { Package } from "lucide-react"

export default async function PublicAssetPage({
  params,
}: {
  params: Promise<{ qrToken: string }>
}) {
  const { qrToken } = await params
  const db = getDatabase()

  const [asset] = await db
    .select({
      name: assets.name,
      tenantId: assets.tenantId,
    })
    .from(assets)
    .where(eq(assets.qrToken, qrToken))
    .limit(1)

  if (!asset) notFound()

  const [tenant] = await db
    .select({
      name: tenants.name,
    })
    .from(tenants)
    .where(eq(tenants.id, asset.tenantId))
    .limit(1)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto h-14 w-14 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            This equipment belongs to
          </p>
          <p className="text-xl font-bold mt-2">
            {tenant?.name ?? "a LoadLoop company"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          If found, please contact the company to arrange return.
        </p>
      </div>
    </div>
  )
}

import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import {
  assets,
  categories,
  locations,
  assetMovements,
  damageReports,
  bookingItems,
  bookings,
} from "@/lib/db/schema"
import { eq, and, desc, ne } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { OwnerAssetActions } from "@/features/assets/owner-asset-actions"
import Link from "next/link"

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  checked_out: "bg-amber-100 text-amber-700",
  returned: "bg-green-100 text-green-700",
  damaged: "bg-red-100 text-red-700",
  missing: "bg-orange-100 text-orange-700",
  needs_inspection: "bg-yellow-100 text-yellow-700",
  retired: "bg-gray-100 text-gray-500",
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()
  const assetId = parseInt(id, 10)

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.id, assetId), eq(assets.tenantId, session.user.tenantId))
    )
    .limit(1)

  if (!asset) notFound()

  const [category] = asset.categoryId
    ? await db
        .select()
        .from(categories)
        .where(eq(categories.id, asset.categoryId))
        .limit(1)
    : [null]

  const [location] = asset.locationId
    ? await db
        .select()
        .from(locations)
        .where(eq(locations.id, asset.locationId))
        .limit(1)
    : [null]

  const movements = await db
    .select()
    .from(assetMovements)
    .where(eq(assetMovements.assetId, assetId))
    .orderBy(desc(assetMovements.timestamp))
    .limit(50)

  const damages = await db
    .select()
    .from(damageReports)
    .where(eq(damageReports.assetId, assetId))
    .orderBy(desc(damageReports.createdAt))

  const currentBooking = asset.status === "checked_out" || asset.status === "reserved"
    ? await db
        .select({
          id: bookings.id,
          eventName: bookings.eventName,
        })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(
          and(
            eq(bookingItems.assetId, assetId),
            ne(bookings.status, "cancelled"),
            asset.status === "checked_out"
              ? eq(bookings.status, "out")
              : ne(bookings.status, "returned")
          )
        )
        .limit(1)
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{asset.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {asset.serialNumber && `SN: ${asset.serialNumber}`}
            {asset.existingCode && ` | Code: ${asset.existingCode}`}
          </p>
        </div>
        <Badge className={statusColors[asset.status] ?? ""}>
          {asset.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardContent className="p-4">
              {asset.photoUrl ? (
                <img
                  src={asset.photoUrl}
                  alt={asset.name}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    No photo added
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Category" value={category?.name} />
              <DetailRow label="Location" value={location?.name} />
              <DetailRow
                label="Value"
                value={
                  asset.value ? `$${Number(asset.value).toLocaleString()}` : null
                }
              />
              <DetailRow
                label="Quantity"
                value={asset.isBulk ? String(asset.quantity) : null}
              />
              <DetailRow label="Condition" value={asset.condition} />
              <DetailRow label="QR Token" value={asset.qrToken} />
            </CardContent>
          </Card>

          {currentBooking.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Current Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/bookings/${currentBooking[0].id}`} className="text-sm font-medium hover:underline">
                  {currentBooking[0].eventName}
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Movement History</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movements recorded</p>
              ) : (
                <div className="space-y-3">
                  {movements.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      <div>
                        <p>
                          <span className="font-medium">
                            {m.movementType.replace(/_/g, " ")}
                          </span>
                          {m.fromStatus && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({m.fromStatus} → {m.toStatus})
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(m.timestamp).toLocaleString()} by{" "}
                          {m.performedBy}
                          {m.notes && ` — ${m.notes}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <OwnerAssetActions assetId={assetId} currentStatus={asset.status} />

          {damages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Damage Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {damages.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge>{d.status.replace(/_/g, " ")}</Badge>
                      {d.repairCost && (
                        <span className="text-sm text-muted-foreground">
                          ${Number(d.repairCost).toLocaleString()} repair
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-sm mt-2">{d.description}</p>
                    )}
                    {d.photoUrl && (
                      <img
                        src={d.photoUrl}
                        alt="Damage"
                        className="mt-2 rounded max-h-48 object-cover"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Reported {new Date(d.createdAt).toLocaleDateString()} by{" "}
                      {d.reportedBy}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {asset.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{asset.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  if (!value) return null
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
    </div>
  )
}

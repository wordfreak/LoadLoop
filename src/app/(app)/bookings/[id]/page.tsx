import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import {
  bookings,
  clients,
  bookingItems,
  assets,
  bookingLinks,
  damageReports,
} from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { generateBookingLinks } from "@/features/bookings/links"
import { CopyLinkButton } from "./copy-link-button"

const bookingStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  out: "bg-amber-100 text-amber-700",
  returned: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()
  const bookingId = parseInt(id, 10)

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.tenantId, session.user.tenantId)
      )
    )
    .limit(1)

  if (!booking) notFound()

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1)

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      assetName: assets.name,
      assetPhotoUrl: assets.photoUrl,
      assetStatus: assets.status,
      quantityBooked: bookingItems.quantityBooked,
      quantityPacked: bookingItems.quantityPacked,
      quantityCheckedOut: bookingItems.quantityCheckedOut,
      quantityReturned: bookingItems.quantityReturned,
      quantityDamaged: bookingItems.quantityDamaged,
      quantityMissing: bookingItems.quantityMissing,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  const existingLinks = await db
    .select()
    .from(bookingLinks)
    .where(eq(bookingLinks.bookingId, bookingId))

  let pickLink = existingLinks.find((l) => l.linkType === "pick")
  let returnLink = existingLinks.find((l) => l.linkType === "return")

  if (!pickLink || !returnLink) {
    try {
      const generated = await generateBookingLinks(
        bookingId,
        session.user.tenantId
      )
      pickLink = pickLink ?? generated.pickLink
      returnLink = returnLink ?? generated.returnLink
    } catch {}
  }

  const bookingDamages = await db
    .select()
    .from(damageReports)
    .where(eq(damageReports.bookingId, bookingId))

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const totalItems = items.length
  const packedItems = items.filter((i) => i.quantityPacked > 0).length
  const returnedItems = items.filter((i) => i.quantityReturned > 0).length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{booking.eventName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {client?.name} · {booking.startDate} to {booking.endDate}
          </p>
        </div>
        <Badge className={bookingStatusColors[booking.status] ?? ""}>
          {booking.status}
        </Badge>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg bg-muted p-4 text-center">
          <p className="text-2xl font-bold">{totalItems}</p>
          <p className="text-xs text-muted-foreground">Total Items</p>
        </div>
        <div className="rounded-lg bg-indigo-50 p-4 text-center">
          <p className="text-2xl font-bold text-indigo-700">{packedItems}</p>
          <p className="text-xs text-indigo-600">Packed</p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{returnedItems}</p>
          <p className="text-xs text-green-600">Returned</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">
            {bookingDamages.length}
          </p>
          <p className="text-xs text-amber-600">Damage Reports</p>
        </div>
      </div>

      {booking.depositAmount && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Deposit</p>
              <p className="text-2xl font-bold">
                ${Number(booking.depositAmount).toLocaleString()}
              </p>
            </div>
            <Badge>{booking.depositStatus ?? "pending"}</Badge>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        {pickLink && (
          <CopyLinkButton
            url={`${appUrl}/j/${pickLink.token}/pick`}
            label="Copy Pick Link"
          />
        )}
        {returnLink && (
          <CopyLinkButton
            url={`${appUrl}/j/${returnLink.token}/return`}
            label="Copy Return Link"
          />
        )}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Asset List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-lg border p-3"
              >
                <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                  {item.assetPhotoUrl ? (
                    <img
                      src={item.assetPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                      -
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.assetName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantityBooked}
                    {item.quantityPacked > 0 &&
                      ` · Packed: ${item.quantityPacked}`}
                    {item.quantityCheckedOut > 0 &&
                      ` · Out: ${item.quantityCheckedOut}`}
                    {item.quantityReturned > 0 &&
                      ` · Returned: ${item.quantityReturned}`}
                  </p>
                </div>
                {item.quantityDamaged > 0 && (
                  <Badge className="bg-red-100 text-red-700">Damaged</Badge>
                )}
                {item.quantityMissing > 0 && (
                  <Badge className="bg-red-100 text-red-700">Missing</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {booking.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{booking.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { bookings, clients } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus } from "lucide-react"

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const bookingStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  out: "bg-amber-100 text-amber-700",
  returned: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

export default async function BookingsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()

  let bookingRows: Array<{
    id: number
    eventName: string
    clientName: string
    startDate: string
    endDate: string
    returnDate: string | null
    status: string
  }> = []

  try {
    const bookingList = await db
      .select({
        id: bookings.id,
        eventName: bookings.eventName,
        clientName: clients.name,
        startDate: bookings.startDate,
        endDate: bookings.endDate,
        returnDate: bookings.returnDate,
        status: bookings.status,
      })
      .from(bookings)
      .innerJoin(clients, eq(bookings.clientId, clients.id))
      .where(eq(bookings.tenantId, session.user.tenantId))
      .orderBy(desc(bookings.startDate))
      .limit(100)

    bookingRows = bookingList.map((b) => ({
      id: b.id,
      eventName: b.eventName,
      clientName: b.clientName,
      startDate: b.startDate,
      endDate: b.endDate,
      returnDate: b.returnDate,
      status: b.status,
    }))
  } catch {
    bookingRows = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {bookingRows.length} bookings
          </p>
        </div>
        <Link href="/bookings/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Event</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Dates</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookingRows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No bookings yet. Create your first booking to get started.
                </td>
              </tr>
            ) : (
              bookingRows.map((b) => (
                <tr
                  key={b.id}
                  className="border-b hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/bookings/${b.id}`}
                      className="font-medium hover:underline"
                    >
                      {b.eventName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{b.clientName}</td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(b.startDate)} – {formatDate(b.returnDate ?? b.endDate)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={bookingStatusColors[b.status] ?? ""}>
                      {b.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

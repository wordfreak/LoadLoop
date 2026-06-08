import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { damageReports, assets, bookings } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"

const damageStatusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  charged_to_client: "bg-blue-100 text-blue-700",
  repair_in_progress: "bg-indigo-100 text-indigo-700",
  repaired: "bg-green-100 text-green-700",
  written_off: "bg-red-100 text-red-700",
  disputed: "bg-red-100 text-red-700",
}

export default async function DamagePage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()

  let rows: Array<{
    id: number
    assetName: string
    eventName: string | null
    description: string | null
    repairCost: number | null
    status: string
    photoUrl: string | null
    createdAt: Date
  }> = []

  try {
    const damageList = await db
      .select({
        id: damageReports.id,
        assetName: assets.name,
        eventName: bookings.eventName,
        description: damageReports.description,
        repairCost: damageReports.repairCost,
        status: damageReports.status,
        photoUrl: damageReports.photoUrl,
        createdAt: damageReports.createdAt,
      })
      .from(damageReports)
      .innerJoin(assets, eq(assets.id, damageReports.assetId))
      .leftJoin(bookings, eq(bookings.id, damageReports.bookingId))
      .where(eq(damageReports.tenantId, session.user.tenantId))
      .orderBy(desc(damageReports.createdAt))

    rows = damageList.map((d) => ({
      id: d.id,
      assetName: d.assetName,
      eventName: d.eventName,
      description: d.description,
      repairCost: d.repairCost ? Number(d.repairCost) : null,
      status: d.status,
      photoUrl: d.photoUrl,
      createdAt: d.createdAt,
    }))
  } catch {
    rows = []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Damage & Missing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {rows.length} reports
        </p>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Asset</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Booking</th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Description
              </th>
              <th className="px-2 py-3 text-left text-sm font-medium w-12">
                Photo
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">
                Repair Cost
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No damage reports
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{r.assetName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {r.eventName ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.description ?? "-"}
                  </td>
                  <td className="px-2 py-3">
                    {r.photoUrl ? (
                      <img
                        src={r.photoUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {r.repairCost != null
                      ? `$${r.repairCost.toLocaleString()}`
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={damageStatusColors[r.status] ?? ""}>
                      {r.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
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

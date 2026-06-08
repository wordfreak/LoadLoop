import { auth } from "@/lib/auth/config"
import { getDashboardData } from "@/features/dashboard/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  let dashboardData
  try {
    dashboardData = await getDashboardData(session.user.tenantId)
  } catch {
    dashboardData = null
  }

  const counters = dashboardData?.counters ?? {
    assetsAvailable: 0,
    assetsCurrentlyOut: 0,
    overdueReturns: 0,
    damagedBlocked: 0,
    returnsDueThisWeek: 0,
    valueAtRisk: 0,
  }

  const needsAction = dashboardData?.needsAction ?? []
  const goingOutThisWeek = dashboardData?.goingOutThisWeek ?? []

  const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "secondary",
    confirmed: "default",
    packed: "default",
    out: "default",
    returned: "secondary",
    cancelled: "destructive",
    damaged: "destructive",
    missing: "destructive",
    needs_inspection: "secondary",
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Equipment overview
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Available" value={counters.assetsAvailable} />
        <StatCard label="Out" value={counters.assetsCurrentlyOut} />
        <StatCard
          label="Overdue"
          value={counters.overdueReturns}
          alert
        />
        <StatCard
          label="Damaged / Missing"
          value={counters.damagedBlocked}
          alert
        />
        <StatCard label="Due this week" value={counters.returnsDueThisWeek} />
        <StatCard label="Value at risk" value={`$${counters.valueAtRisk.toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-sm font-semibold">Needs Action</h2>
            <span className="text-xs text-muted-foreground">
              {needsAction.length} items
            </span>
          </div>
          <CardContent className="px-0 pb-0">
            {needsAction.length === 0 ? (
              <div className="px-6 pb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Nothing needs attention
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {needsAction.slice(0, 8).map((item) => {
                  const isProblem =
                    item.status === "damaged" ||
                    item.status === "missing" ||
                    item.status === "needs_inspection"
                  return (
                    <div
                      key={`${item.status}-${item.id}`}
                      className={`flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors ${
                        isProblem
                          ? "border-l-2 border-l-destructive/60 pl-4"
                          : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {item.eventName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.context}
                        </p>
                      </div>
                      <Badge
                        variant={
                          statusBadgeVariant[item.status] ?? "secondary"
                        }
                        className="ml-3 flex-shrink-0"
                      >
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-sm font-semibold">Going Out This Week</h2>
            <Link
              href="/bookings"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <CardContent className="px-0 pb-0">
            {goingOutThisWeek.length === 0 ? (
              <div className="px-6 pb-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No bookings this week
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Link
                    href="/bookings/new"
                    className="text-primary hover:underline"
                  >
                    Create a booking
                  </Link>{" "}
                  to get started
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {goingOutThisWeek.map((item) => (
                  <Link
                    key={item.id}
                    href={`/bookings/${item.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {item.eventName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.context}
                      </p>
                    </div>
                    <Badge
                      variant={
                        statusBadgeVariant[item.status] ?? "secondary"
                      }
                      className="ml-3 flex-shrink-0"
                    >
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  alert,
}: {
  label: string
  value: string | number
  alert?: boolean
}) {
  return (
    <Card
      className={
        alert
          ? "border-l-2 border-l-destructive/70 bg-destructive/5"
          : "bg-card"
      }
    >
      <CardContent className="p-4">
        <p
          className={`text-2xl font-bold tracking-tight ${
            alert ? "text-destructive" : "text-foreground"
          }`}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}

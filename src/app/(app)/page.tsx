import { auth } from "@/lib/auth/config"
import { getDashboardData } from "@/features/dashboard/queries"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Truck,
  AlertTriangle,
  Wrench,
  DollarSign,
  Calendar,
  ArrowRight,
} from "lucide-react"
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
        <StatCard
          label="Available"
          value={counters.assetsAvailable}
          icon={Package}
          color="emerald"
        />
        <StatCard
          label="Out"
          value={counters.assetsCurrentlyOut}
          icon={Truck}
          color="blue"
        />
        <StatCard
          label="Overdue"
          value={counters.overdueReturns}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Damaged"
          value={counters.damagedBlocked}
          icon={Wrench}
          color="amber"
        />
        <StatCard
          label="Due this week"
          value={counters.returnsDueThisWeek}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          label="Value at risk"
          value={`$${counters.valueAtRisk.toLocaleString()}`}
          icon={DollarSign}
          color="slate"
        />
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
                <p className="text-xs text-muted-foreground mt-0.5">
                  All equipment is in order
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {needsAction.slice(0, 8).map((item) => (
                  <div
                    key={`${item.status}-${item.id}`}
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
                      variant={statusBadgeVariant[item.status] ?? "secondary"}
                      className="ml-3 flex-shrink-0"
                    >
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h2 className="text-sm font-semibold">Going Out This Week</h2>
            <Link
              href="/bookings"
              className="text-xs text-primary hover:underline flex items-center gap-1"
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
                  <Link href="/bookings/new" className="text-primary hover:underline">
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
                      variant={statusBadgeVariant[item.status] ?? "secondary"}
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
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: "emerald" | "blue" | "red" | "amber" | "purple" | "slate"
}) {
  const borderColors = {
    emerald: "border-l-emerald-500",
    blue: "border-l-blue-500",
    red: "border-l-red-500",
    amber: "border-l-amber-500",
    purple: "border-l-violet-500",
    slate: "border-l-slate-400",
  }
  const iconColors = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    red: "text-red-600",
    amber: "text-amber-600",
    purple: "text-violet-600",
    slate: "text-slate-500",
  }
  const valueColors = {
    emerald: "text-emerald-700",
    blue: "text-blue-700",
    red: "text-red-700",
    amber: "text-amber-700",
    purple: "text-violet-700",
    slate: "text-slate-700",
  }
  const backgrounds = {
    emerald: "bg-emerald-50/50",
    blue: "bg-blue-50/40",
    red: "bg-red-50/40",
    amber: "bg-amber-50/40",
    purple: "bg-violet-50/40",
    slate: "bg-slate-50/50",
  }

  return (
    <Card
      className={`border-l-4 ${borderColors[color]} ${backgrounds[color]} hover:shadow-sm transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className={`text-2xl font-bold tracking-tight ${valueColors[color]}`}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
          <Icon className={`h-4 w-4 ${iconColors[color]} mt-0.5`} />
        </div>
      </CardContent>
    </Card>
  )
}

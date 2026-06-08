import { auth } from "@/lib/auth/config"
import { getDashboardData } from "@/features/dashboard/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  Truck,
  AlertTriangle,
  Wrench,
  DollarSign,
  Calendar,
} from "lucide-react"

const statusBadges: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  out: "bg-amber-100 text-amber-700",
  returned: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Equipment overview at a glance
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <CounterCard
          title="Assets Available"
          value={counters.assetsAvailable}
          icon={Package}
          variant="green"
        />
        <CounterCard
          title="Currently Out"
          value={counters.assetsCurrentlyOut}
          icon={Truck}
          variant="blue"
        />
        <CounterCard
          title="Overdue Returns"
          value={counters.overdueReturns}
          icon={AlertTriangle}
          variant="red"
        />
        <CounterCard
          title="Damaged / Blocked"
          value={counters.damagedBlocked}
          icon={Wrench}
          variant="amber"
        />
        <CounterCard
          title="Returns Due This Week"
          value={counters.returnsDueThisWeek}
          icon={Calendar}
          variant="purple"
        />
        <CounterCard
          title="Value At Risk"
          value={`$${counters.valueAtRisk.toLocaleString()}`}
          icon={DollarSign}
          variant="slate"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsAction.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention</p>
            ) : (
              needsAction.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.eventName}</p>
                    <p className="text-xs text-muted-foreground">{item.context}</p>
                  </div>
                  <Badge className={statusBadges[item.status] ?? ""}>
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Going Out This Week</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {goingOutThisWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings this week</p>
            ) : (
              goingOutThisWeek.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.eventName}</p>
                    <p className="text-xs text-muted-foreground">{item.context}</p>
                  </div>
                  <Badge className={statusBadges[item.status] ?? ""}>
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CounterCard({
  title,
  value,
  icon: Icon,
  variant,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  variant: "green" | "blue" | "red" | "amber" | "purple" | "slate"
}) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  }

  return (
    <Card className={`border ${colors[variant]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">{title}</p>
          <Icon className="h-4 w-4 opacity-70" />
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}

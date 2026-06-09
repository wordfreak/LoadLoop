import { auth } from "@/lib/auth/config"
import { getDashboardData } from "@/features/dashboard/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
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
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/assets"><CounterCard title="Assets Available" value={counters.assetsAvailable} icon={Package} variant="blue" /></Link>
        <Link href="/bookings"><CounterCard title="Currently Out" value={counters.assetsCurrentlyOut} icon={Truck} variant="blue" /></Link>
        <Link href="/bookings"><CounterCard title="Overdue Returns" value={counters.overdueReturns} icon={AlertTriangle} variant="red" /></Link>
        <Link href="/damage"><CounterCard title="Damaged / Missing" value={counters.damagedBlocked} icon={Wrench} variant="red" /></Link>
        <Link href="/bookings"><CounterCard title="Returns Due This Week" value={counters.returnsDueThisWeek} icon={Calendar} variant="grey" /></Link>
        <CounterCard title="Value At Risk" value={`$${counters.valueAtRisk.toLocaleString()}`} icon={DollarSign} variant="grey" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {needsAction.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing needs attention</p>
            ) : (
              needsAction.map((item) => {
                const assetStatuses = ["damaged", "missing", "needs_inspection"]
                const link = assetStatuses.includes(item.status)
                  ? `/assets/${item.id}`
                  : `/bookings/${item.id}`
                return (
                  <Link
                    key={`${item.status}-${item.id}`}
                    href={link}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.eventName}</p>
                      <p className="text-xs text-muted-foreground">{item.context}</p>
                    </div>
                    <Badge className={statusBadges[item.status] ?? ""}>
                      {item.status}
                    </Badge>
                  </Link>
                )
              })
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
  variant: "blue" | "grey" | "red"
}) {
  const accent = {
    blue: "border-l-blue-500 text-blue-700",
    grey: "border-l-slate-300 text-slate-700",
    red: "border-l-red-500 text-red-700",
  }

  const iconColor = {
    blue: "text-blue-600/50",
    grey: "text-slate-400/50",
    red: "text-red-600/50",
  }

  return (
    <Card className={`border-l-4 ${accent[variant]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-2xl font-bold ${accent[variant]}`}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{title}</p>
          </div>
          <Icon className={`h-4 w-4 ${iconColor[variant]} mt-0.5`} />
        </div>
      </CardContent>
    </Card>
  )
}

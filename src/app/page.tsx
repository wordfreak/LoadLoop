import { auth, signOut } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getDashboardData } from "@/features/dashboard/queries"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Package,
  Calendar as CalendarIcon,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
} from "lucide-react"
import LandingPage from "./landing-page"

async function getTenant(tenantId: number) {
  const db = getDatabase()
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1)
  return tenant
}

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Bookings", href: "/bookings", icon: CalendarIcon },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Damage & Missing", href: "/damage", icon: AlertTriangle },
  { label: "Settings", href: "/settings", icon: Settings },
]

export default async function RootPage() {
  const session = await auth()

  if (session?.user?.tenantId) {
    const tenant = await getTenant(session.user.tenantId)

    let dashboardData
    try { dashboardData = await getDashboardData(session.user.tenantId) } catch { dashboardData = null }

    const counters = dashboardData?.counters ?? { assetsAvailable: 0, assetsCurrentlyOut: 0, overdueReturns: 0, damagedBlocked: 0, returnsDueThisWeek: 0, valueAtRisk: 0 }
    const needsAction = dashboardData?.needsAction ?? []
    const goingOutThisWeek = dashboardData?.goingOutThisWeek ?? []

    const statusBadge: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      confirmed: "bg-blue-100 text-blue-700",
      packed: "bg-indigo-100 text-indigo-700",
      out: "bg-amber-100 text-amber-700",
      returned: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      damaged: "bg-red-100 text-red-700",
      missing: "bg-orange-100 text-orange-700",
      needs_inspection: "bg-yellow-100 text-yellow-700",
    }

    return (
      <div className="flex h-screen">
        <aside className="w-56 bg-sidebar border-r border-sidebar-border flex-col hidden md:flex">
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <Link href="/" className="font-semibold text-lg text-sidebar-foreground">LoadLoop</Link>
          </div>
          <nav className="flex-1 space-y-1 p-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-sidebar-border p-3 space-y-3">
            <div className="px-3">
              <p className="text-xs text-sidebar-foreground/50">{tenant?.name}</p>
              <p className="text-xs font-medium text-sidebar-foreground/80 truncate">{session?.user?.name}</p>
            </div>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }) }}>
              <Button type="submit" variant="ghost" className="w-full justify-start gap-3 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent">
                <LogOut className="h-4 w-4" />Sign out
              </Button>
            </form>
          </div>
        </aside>
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center border-b bg-background px-6">
            <span className="text-sm text-muted-foreground">{tenant?.name}</span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm font-medium">{session?.user?.name}</span>
              <span className="text-xs bg-muted rounded-full px-2.5 py-0.5 text-muted-foreground">{session?.user?.role}</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="p-6">
              <div className="space-y-8">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                  <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Link href="/assets"><div className="rounded-xl border bg-card p-4 border-l-4 border-l-blue-500"><p className="text-2xl font-bold text-blue-700">{counters.assetsAvailable}</p><p className="text-xs text-muted-foreground mt-0.5">Assets Available</p></div></Link>
                  <Link href="/bookings"><div className="rounded-xl border bg-card p-4 border-l-4 border-l-blue-500"><p className="text-2xl font-bold text-blue-700">{counters.assetsCurrentlyOut}</p><p className="text-xs text-muted-foreground mt-0.5">Currently Out</p></div></Link>
                  <Link href="/bookings"><div className="rounded-xl border bg-card p-4 border-l-4 border-l-red-500"><p className="text-2xl font-bold text-red-700">{counters.overdueReturns}</p><p className="text-xs text-muted-foreground mt-0.5">Overdue Returns</p></div></Link>
                  <Link href="/damage"><div className="rounded-xl border bg-card p-4 border-l-4 border-l-red-500"><p className="text-2xl font-bold text-red-700">{counters.damagedBlocked}</p><p className="text-xs text-muted-foreground mt-0.5">Damaged / Missing</p></div></Link>
                  <Link href="/bookings"><div className="rounded-xl border bg-card p-4 border-l-4 border-l-slate-300"><p className="text-2xl font-bold text-slate-700">{counters.returnsDueThisWeek}</p><p className="text-xs text-muted-foreground mt-0.5">Returns Due This Week</p></div></Link>
                  <div className="rounded-xl border bg-card p-4 border-l-4 border-l-slate-300"><p className="text-2xl font-bold text-slate-700">${counters.valueAtRisk.toLocaleString()}</p><p className="text-xs text-muted-foreground mt-0.5">Value At Risk</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Needs Action</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {needsAction.length === 0 ? <p className="text-sm text-muted-foreground">Nothing needs attention</p> : needsAction.slice(0, 6).map((item) => {
                        const assetStatuses = ["damaged", "missing", "needs_inspection"]
                        const link = assetStatuses.includes(item.status) ? `/assets/${item.id}` : `/bookings/${item.id}`
                        return <Link key={`${item.status}-${item.id}`} href={link} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium truncate">{item.eventName}</p><p className="text-xs text-muted-foreground">{item.context}</p></div><Badge className={statusBadge[item.status] ?? ""}>{item.status.replace(/_/g, " ")}</Badge></Link>
                      })}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Going Out This Week</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {goingOutThisWeek.length === 0 ? <p className="text-sm text-muted-foreground">No bookings this week</p> : goingOutThisWeek.map((item) => (
                        <Link key={item.id} href={`/bookings/${item.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium truncate">{item.eventName}</p><p className="text-xs text-muted-foreground">{item.context}</p></div><Badge className={statusBadge[item.status] ?? ""}>{item.status.replace(/_/g, " ")}</Badge></Link>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  } else {
    return <LandingPage />
  }
}

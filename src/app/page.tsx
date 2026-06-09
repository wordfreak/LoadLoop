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
  ArrowRight,
  Package,
  Truck,
  Camera,
  Shield,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
  Wrench,
  DollarSign,
} from "lucide-react"

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

    const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "secondary", confirmed: "default", packed: "default", out: "default",
      returned: "secondary", cancelled: "destructive", damaged: "destructive",
      missing: "destructive", needs_inspection: "secondary",
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
                        return <Link key={`${item.status}-${item.id}`} href={link} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium truncate">{item.eventName}</p><p className="text-xs text-muted-foreground">{item.context}</p></div><Badge variant={statusBadgeVariant[item.status] ?? "secondary"}>{item.status.replace(/_/g, " ")}</Badge></Link>
                      })}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">Going Out This Week</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {goingOutThisWeek.length === 0 ? <p className="text-sm text-muted-foreground">No bookings this week</p> : goingOutThisWeek.map((item) => (
                        <Link key={item.id} href={`/bookings/${item.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"><div><p className="text-sm font-medium truncate">{item.eventName}</p><p className="text-xs text-muted-foreground">{item.context}</p></div><Badge variant={statusBadgeVariant[item.status] ?? "secondary"}>{item.status.replace(/_/g, " ")}</Badge></Link>
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
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <span className="text-xl font-bold tracking-tight">LoadLoop</span>
          <Link href="/login" className="text-sm font-medium bg-foreground text-background rounded-full px-5 py-2 hover:opacity-90 transition-opacity">Sign in</Link>
        </div>
      </header>
      <main>
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium mb-8">Equipment control for rental teams</div>
          <h1 className="text-5xl font-bold tracking-tight leading-tight max-w-3xl mx-auto">Know what&apos;s out, what&apos;s damaged, and what&apos;s coming back</h1>
          <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto leading-relaxed">LoadLoop turns your equipment spreadsheet into a simple mobile workflow for packing, returns, and damage proof. No staff logins needed.</p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href="/login" className="inline-flex items-center gap-2 bg-foreground text-background rounded-full px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">Try the demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium border hover:bg-muted/50 transition-colors">Sign in</Link>
          </div>
        </section>
        <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-xl border p-6 hover:shadow-sm transition-shadow"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4"><Package className="h-5 w-5 text-foreground/70" /></div><h3 className="font-semibold text-sm mb-2">One dashboard</h3><p className="text-sm text-muted-foreground leading-relaxed">See what&apos;s available, out, overdue, damaged, or missing in 10 seconds.</p></div>
          <div className="rounded-xl border p-6 hover:shadow-sm transition-shadow"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4"><Truck className="h-5 w-5 text-foreground/70" /></div><h3 className="font-semibold text-sm mb-2">Staff phone links</h3><p className="text-sm text-muted-foreground leading-relaxed">Send packing lists via WhatsApp. Staff tap items — no accounts, no training.</p></div>
          <div className="rounded-xl border p-6 hover:shadow-sm transition-shadow"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4"><Camera className="h-5 w-5 text-foreground/70" /></div><h3 className="font-semibold text-sm mb-2">Damage proof</h3><p className="text-sm text-muted-foreground leading-relaxed">Staff upload photos on return. Evidence stored with repair estimates.</p></div>
          <div className="rounded-xl border p-6 hover:shadow-sm transition-shadow"><div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4"><Shield className="h-5 w-5 text-foreground/70" /></div><h3 className="font-semibold text-sm mb-2">48-hour setup</h3><p className="text-sm text-muted-foreground leading-relaxed">Send us your spreadsheet. We import it, you&apos;re live the next day.</p></div>
        </section>
        <section className="border-t bg-muted/30"><div className="max-w-4xl mx-auto px-6 py-16 text-center"><h2 className="text-2xl font-bold">Built for small AV, event, and rental teams</h2><p className="text-muted-foreground mt-3 max-w-lg mx-auto">If you currently use spreadsheets, WhatsApp, and paper packing lists to track equipment — LoadLoop replaces all of that.</p></div></section>
      </main>
      <footer className="border-t"><div className="max-w-6xl mx-auto px-6 py-8 text-center text-xs text-muted-foreground">LoadLoop — Equipment control for rental teams</div></footer>
    </div>
  )
}

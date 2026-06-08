import Link from "next/link"
import { auth, signOut } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
} from "lucide-react"

async function getTenant(tenantId: number) {
  const db = getDatabase()
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)
  return tenant
}

const navigation = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Package },
  { label: "Bookings", href: "/bookings", icon: Calendar },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Damage & Missing", href: "/damage", icon: AlertTriangle },
  { label: "Settings", href: "/settings", icon: Settings },
]

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const tenant = await getTenant(session!.user.tenantId)

  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-background border-r flex flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="font-semibold text-lg">
            LoadLoop
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3 space-y-3">
          <div className="px-3">
            <p className="text-xs text-muted-foreground">{tenant?.name}</p>
            <p className="text-xs font-medium truncate">
              {session?.user?.name}
            </p>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start gap-3 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center border-b bg-background px-6">
          <span className="text-sm text-muted-foreground">{tenant?.name}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium">{session?.user?.name}</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5">
              {session?.user?.role}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

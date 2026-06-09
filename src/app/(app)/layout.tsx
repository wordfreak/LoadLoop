import Link from "next/link"
import { auth, signOut } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Button } from "@/components/ui/button"
import NavLinks from "./nav-links"
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
      <aside className="w-56 bg-sidebar border-r border-sidebar-border flex-col hidden md:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Link href="/" className="font-semibold text-lg">
            LoadLoop
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          <NavLinks items={navigation} />
        </nav>
        <div className="border-t border-sidebar-border p-2">
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
          <span className="text-sm text-muted-foreground">
            {tenant?.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm font-medium">{session?.user?.name}</span>
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
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

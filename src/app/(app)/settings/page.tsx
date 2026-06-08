import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CsvImport } from "@/features/csv/import"
import { CsvTemplate } from "@/features/csv/template"
import Link from "next/link"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, session.user.tenantId))
    .limit(1)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Company and system configuration
        </p>
      </div>

      <CsvImport />

      <CsvTemplate />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">CSV Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Download your data as CSV files for backup or analysis.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/api/csv?table=assets">
              <Button variant="outline">Assets</Button>
            </Link>
            <Link href="/api/csv?table=bookings">
              <Button variant="outline">Bookings</Button>
            </Link>
            <Link href="/api/csv?table=clients">
              <Button variant="outline">Clients</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Company Name</p>
              <p className="font-medium">{tenant?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Slug</p>
              <p className="font-medium">{tenant?.slug ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p className="font-medium">{tenant?.currency ?? "USD"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {tenant?.createdAt
                  ? new Date(tenant.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

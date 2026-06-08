import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { tenants } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import & Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">CSV Import</p>
            <p className="text-xs text-muted-foreground">
              Upload a CSV file to bulk import assets. The system will preview
              your data before importing.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">CSV Export</p>
            <p className="text-xs text-muted-foreground">
              Download all your data as CSV files for backup or analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

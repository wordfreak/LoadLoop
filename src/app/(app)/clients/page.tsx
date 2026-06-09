import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { clients } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export default async function ClientsPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()

  let clientRows: Array<{
    id: number
    name: string
    email: string | null
    phone: string | null
  }> = []

  try {
    const clientList = await db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, session.user.tenantId))
      .orderBy(desc(clients.createdAt))

    clientRows = clientList.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
    }))
  } catch {
    clientRows = []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clientRows.length} clients
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
            </tr>
          </thead>
          <tbody>
            {clientRows.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  No clients yet
                </td>
              </tr>
            ) : (
              clientRows.map((c) => (
                <tr key={c.id} className="border-b hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <span className="font-medium">{c.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {c.email ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {c.phone ?? "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

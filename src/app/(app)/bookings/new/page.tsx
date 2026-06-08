import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { clients, assets } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { NewBookingForm } from "@/features/bookings/booking-form"

export default async function NewBookingPage() {
  const session = await auth()
  if (!session?.user?.tenantId) return null

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const clientList = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.tenantId, tenantId))

  const assetList = await db
    .select({
      id: assets.id,
      name: assets.name,
      isBulk: assets.isBulk,
    })
    .from(assets)
    .where(eq(assets.tenantId, tenantId))

  return (
    <NewBookingForm
      tenantId={tenantId}
      clients={clientList}
      assets={assetList}
    />
  )
}

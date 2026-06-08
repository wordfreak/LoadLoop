import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, bookings, clients, damageReports, bookingItems } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  if (table === "assets") {
    const rows = await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId))

    const csv = [
      "name,serial_number,existing_code,value,quantity,condition,status,notes",
      ...rows.map((r) =>
        [
          `"${r.name}"`,
          r.serialNumber ?? "",
          r.existingCode ?? "",
          r.value ?? "",
          r.quantity,
          r.condition ?? "",
          r.status,
          r.notes ?? "",
        ].join(",")
      ),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=assets.csv",
      },
    })
  }

  if (table === "bookings") {
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId))

    const csv = [
      "event_name,client_id,start_date,end_date,delivery_date,return_date,status,deposit_amount,notes",
      ...rows.map((r) =>
        [
          `"${r.eventName}"`,
          r.clientId,
          r.startDate,
          r.endDate,
          r.deliveryDate ?? "",
          r.returnDate ?? "",
          r.status,
          r.depositAmount ?? "",
          r.notes ?? "",
        ].join(",")
      ),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=bookings.csv",
      },
    })
  }

  if (table === "clients") {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, tenantId))

    const csv = [
      "name,email,phone,notes",
      ...rows.map((r) =>
        [`"${r.name}"`, r.email ?? "", r.phone ?? "", r.notes ?? ""].join(",")
      ),
    ].join("\n")

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=clients.csv",
      },
    })
  }

  return new Response("Invalid table", { status: 400 })
}

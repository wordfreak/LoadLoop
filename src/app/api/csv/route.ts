import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, bookings, clients } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import Papa from "papaparse"

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return Papa.unparse({
    fields: headers,
    data: rows,
  })
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get("table")

  const db = getDatabase()
  const tenantId = session.user.tenantId
  let filename = ""
  let csv = ""

  if (table === "assets") {
    const rows = await db
      .select()
      .from(assets)
      .where(eq(assets.tenantId, tenantId))

    csv = toCsv(
      ["name", "serial_number", "existing_code", "value", "quantity", "condition", "status", "notes"],
      rows.map((r) => ({
        name: r.name,
        serial_number: r.serialNumber ?? "",
        existing_code: r.existingCode ?? "",
        value: r.value ?? "",
        quantity: r.quantity,
        condition: r.condition ?? "",
        status: r.status,
        notes: r.notes ?? "",
      }))
    )
    filename = "assets.csv"
  }

  if (table === "bookings") {
    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.tenantId, tenantId))

    csv = toCsv(
      ["event_name", "client_id", "start_date", "end_date", "delivery_date", "return_date", "status", "deposit_amount", "notes"],
      rows.map((r) => ({
        event_name: r.eventName,
        client_id: r.clientId,
        start_date: r.startDate,
        end_date: r.endDate,
        delivery_date: r.deliveryDate ?? "",
        return_date: r.returnDate ?? "",
        status: r.status,
        deposit_amount: r.depositAmount ?? "",
        notes: r.notes ?? "",
      }))
    )
    filename = "bookings.csv"
  }

  if (table === "clients") {
    const rows = await db
      .select()
      .from(clients)
      .where(eq(clients.tenantId, tenantId))

    csv = toCsv(
      ["name", "email", "phone", "notes"],
      rows.map((r) => ({
        name: r.name,
        email: r.email ?? "",
        phone: r.phone ?? "",
        notes: r.notes ?? "",
      }))
    )
    filename = "clients.csv"
  }

  if (!filename) {
    return new Response("Invalid table", { status: 400 })
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=${filename}`,
    },
  })
}

import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { assets, bookings, clients, damageReports, bookingItems } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
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

  if (table === "damage_reports") {
    const rows = await db
      .select()
      .from(damageReports)
      .where(eq(damageReports.tenantId, tenantId))

    csv = toCsv(
      ["id", "asset_id", "booking_id", "description", "repair_cost", "status", "reported_by", "created_at"],
      rows.map((r) => ({
        id: r.id,
        asset_id: r.assetId,
        booking_id: r.bookingId ?? "",
        description: r.description ?? "",
        repair_cost: r.repairCost ?? "",
        status: r.status,
        reported_by: r.reportedBy,
        created_at: r.createdAt.toISOString(),
      }))
    )
    filename = "damage_reports.csv"
  }

  if (table === "booking_items") {
    const rows = await db
      .select()
      .from(bookingItems)
      .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
      .where(eq(bookings.tenantId, tenantId))

    csv = toCsv(
      ["id", "booking_id", "asset_id", "qty_booked", "qty_packed", "qty_checked_out", "qty_returned", "qty_damaged", "qty_missing"],
      rows.map((r) => ({
        id: r.booking_items.id,
        booking_id: r.booking_items.bookingId,
        asset_id: r.booking_items.assetId,
        qty_booked: r.booking_items.quantityBooked,
        qty_packed: r.booking_items.quantityPacked,
        qty_checked_out: r.booking_items.quantityCheckedOut,
        qty_returned: r.booking_items.quantityReturned,
        qty_damaged: r.booking_items.quantityDamaged,
        qty_missing: r.booking_items.quantityMissing,
      }))
    )
    filename = "booking_items.csv"
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

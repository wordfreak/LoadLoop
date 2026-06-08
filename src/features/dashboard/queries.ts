import { sql, eq, and, or, lt, gte, lte, ne, desc } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { assets, bookings, damageReports } from "@/lib/db/schema"

export type DashboardCounters = {
  assetsAvailable: number
  assetsCurrentlyOut: number
  overdueReturns: number
  damagedBlocked: number
  returnsDueThisWeek: number
  valueAtRisk: number
}

export type DashboardActionItem = {
  id: number
  eventName: string
  status: string
  startDate: string
  returnDate: string | null
  context: string
}

export type DashboardData = {
  counters: DashboardCounters
  needsAction: DashboardActionItem[]
  goingOutThisWeek: DashboardActionItem[]
}

export async function getDashboardData(tenantId: number): Promise<DashboardData> {
  const db = getDatabase()
  const today = new Date().toISOString().split("T")[0]
  const endOfWeek = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0]

  const [counters] = await db
    .select({
      assetsAvailable: sql<number>`count(*) filter (where ${assets.status} = 'available')`.mapWith(Number),
      assetsCurrentlyOut: sql<number>`count(*) filter (where ${assets.status} = 'checked_out')`.mapWith(Number),
      damagedBlocked: sql<number>`count(*) filter (where ${assets.status} IN ('damaged', 'missing', 'needs_inspection'))`.mapWith(Number),
      valueAtRisk: sql<number>`COALESCE(sum(${assets.value}::numeric) filter (where ${assets.status} = 'checked_out'), 0)`.mapWith(Number),
    })
    .from(assets)
    .where(eq(assets.tenantId, tenantId))

  const [overdueResult] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        lt(bookings.returnDate, today),
        ne(bookings.status, "returned"),
        ne(bookings.status, "cancelled")
      )
    )

  const [returnsDueResult] = await db
    .select({
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        gte(bookings.returnDate, today),
        lte(bookings.returnDate, endOfWeek),
        ne(bookings.status, "returned"),
        ne(bookings.status, "cancelled")
      )
    )

  const needsActionRows = await db
    .select({
      id: bookings.id,
      eventName: bookings.eventName,
      status: bookings.status,
      startDate: bookings.startDate,
      returnDate: bookings.returnDate,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        or(
          and(
            lt(bookings.returnDate, today),
            ne(bookings.status, "returned"),
            ne(bookings.status, "cancelled")
          ),
          eq(bookings.status, "draft")
        )
      )
    )
    .orderBy(desc(bookings.startDate))
    .limit(5)

  const pendingDamageRows = await db
    .select({
      id: damageReports.id,
      assetName: assets.name,
      description: damageReports.description,
      status: damageReports.status,
      createdAt: damageReports.createdAt,
    })
    .from(damageReports)
    .innerJoin(assets, eq(assets.id, damageReports.assetId))
    .where(
      and(
        eq(damageReports.tenantId, tenantId),
        eq(damageReports.status, "pending")
      )
    )
    .orderBy(desc(damageReports.createdAt))
    .limit(5)

  const problemAssets = await db
    .select({
      id: assets.id,
      name: assets.name,
      status: assets.status,
    })
    .from(assets)
    .where(
      and(
        eq(assets.tenantId, tenantId),
        or(
          eq(assets.status, "missing"),
          eq(assets.status, "needs_inspection")
        )
      )
    )
    .limit(5)

  const goingOutRows = await db
    .select({
      id: bookings.id,
      eventName: bookings.eventName,
      status: bookings.status,
      startDate: bookings.startDate,
      returnDate: bookings.returnDate,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.tenantId, tenantId),
        gte(bookings.startDate, today),
        lte(bookings.startDate, endOfWeek),
        ne(bookings.status, "cancelled")
      )
    )
    .orderBy(desc(bookings.startDate))
    .limit(10)

  return {
    counters: {
      assetsAvailable: counters?.assetsAvailable ?? 0,
      assetsCurrentlyOut: counters?.assetsCurrentlyOut ?? 0,
      overdueReturns: overdueResult?.count ?? 0,
      damagedBlocked: counters?.damagedBlocked ?? 0,
      returnsDueThisWeek: returnsDueResult?.count ?? 0,
      valueAtRisk: counters?.valueAtRisk ?? 0,
    },
    needsAction: [
      ...needsActionRows.map((row) => ({
        id: row.id,
        eventName: row.eventName,
        status: row.status,
        startDate: row.startDate,
        returnDate: row.returnDate,
        context:
          row.status === "draft"
            ? "Draft booking"
            : `Overdue — was due ${row.returnDate}`,
      })),
      ...pendingDamageRows.map((row) => ({
        id: row.id,
        eventName: row.assetName,
        status: "damaged",
        startDate: new Date(row.createdAt).toISOString().split("T")[0],
        returnDate: null,
        context: row.description
          ? `Damage — ${row.description.slice(0, 60)}`
          : "Pending damage report",
      })),
      ...problemAssets.map((row) => ({
        id: row.id,
        eventName: row.name,
        status: row.status,
        startDate: new Date().toISOString().split("T")[0],
        returnDate: null,
        context:
          row.status === "missing"
            ? "Missing — needs investigation"
            : "Needs inspection",
      })),
    ],
    goingOutThisWeek: goingOutRows.map((row) => ({
      id: row.id,
      eventName: row.eventName,
      status: row.status,
      startDate: row.startDate,
      returnDate: row.returnDate,
      context: `Starts ${row.startDate}`,
    })),
  }
}

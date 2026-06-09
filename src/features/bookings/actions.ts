"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { bookings, bookingItems, assets, clients } from "@/lib/db/schema"
import { eq, and, inArray, lte, gte, not, ne, sql } from "drizzle-orm"
import { createBookingSchema, createClientSchema, updateClientSchema } from "./schemas"

type BookingConflict = {
  assetId: number
  assetName: string
  conflictBookingId: number
  conflictEventName: string
  conflictStartDate: string
  conflictEndDate: string
}

type BulkShortage = {
  assetId: number
  assetName: string
  totalQuantity: number
  alreadyBooked: number
  requested: number
  available: number
}

export async function detectBookingConflicts(
  assetIds: number[],
  startDate: string,
  endDate: string,
  tenantId: number,
  quantities?: Map<number, number>,
  excludeBookingId?: number
): Promise<{ conflicts: BookingConflict[]; shortages: BulkShortage[] }> {
  const db = getDatabase()

  if (assetIds.length === 0) return { conflicts: [], shortages: [] }

  const conditions = [
    inArray(bookingItems.assetId, assetIds),
    eq(assets.isBulk, false),
    eq(bookings.tenantId, tenantId),
    gte(bookings.endDate, startDate),
    lte(bookings.startDate, endDate),
    not(eq(bookings.status, "cancelled")),
    not(eq(bookings.status, "returned")),
  ]

  if (excludeBookingId) {
    conditions.push(ne(bookings.id, excludeBookingId))
  }

  const rows = await db
    .select({
      assetId: assets.id,
      assetName: assets.name,
      bookingId: bookings.id,
      eventName: bookings.eventName,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
    .where(and(...conditions))

  const conflicts = rows.map((row) => ({
    assetId: row.assetId,
    assetName: row.assetName,
    conflictBookingId: row.bookingId,
    conflictEventName: row.eventName,
    conflictStartDate: row.startDate,
    conflictEndDate: row.endDate,
  }))

  const shortages: BulkShortage[] = []

  if (quantities && quantities.size > 0) {
    const bulkAssetIds = Array.from(quantities.keys())

    const bulkAssets = await db
      .select({ id: assets.id, name: assets.name, totalQuantity: assets.quantity })
      .from(assets)
      .where(and(inArray(assets.id, bulkAssetIds), eq(assets.isBulk, true), eq(assets.tenantId, tenantId)))

    if (bulkAssets.length > 0) {
      const bookedQuantities = await db
        .select({
          assetId: bookingItems.assetId,
          totalBooked: sql<number>`COALESCE(SUM(${bookingItems.quantityBooked}), 0)`.mapWith(Number),
        })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(
          and(
            inArray(bookingItems.assetId, bulkAssets.map((a) => a.id)),
            eq(bookings.tenantId, tenantId),
            gte(sql`COALESCE(${bookings.returnDate}, ${bookings.endDate})`, startDate),
            lte(bookings.startDate, endDate),
            not(eq(bookings.status, "cancelled")),
            not(eq(bookings.status, "returned"))
          )
        )
        .groupBy(bookingItems.assetId)

      const bookedMap = new Map(bookedQuantities.map((r) => [r.assetId, r.totalBooked]))

      for (const asset of bulkAssets) {
        const requested = quantities.get(asset.id) ?? 0
        const alreadyBooked = bookedMap.get(asset.id) ?? 0
        const available = asset.totalQuantity - alreadyBooked

        if (requested > available) {
          shortages.push({
            assetId: asset.id,
            assetName: asset.name,
            totalQuantity: asset.totalQuantity,
            alreadyBooked,
            requested,
            available,
          })
        }
      }
    }
  }

  return { conflicts, shortages }
}

export async function createBooking(input: FormData | Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = createBookingSchema.parse(raw)
  const db = getDatabase()
  const tenantId = session.user.tenantId

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, parsed.clientId), eq(clients.tenantId, tenantId)))
    .limit(1)

  if (!client) throw new Error("Client not found")

  const requestedStart = parsed.startDate
  const requestedEnd = parsed.returnDate ?? parsed.endDate

  const merged = new Map<number, number>()
  for (const item of parsed.items) {
    merged.set(item.assetId, (merged.get(item.assetId) ?? 0) + item.quantityBooked)
  }

  if (parsed.items.length > 0) {

    const assetIds = Array.from(merged.keys())
    const tenantAssets = await db
      .select({
        id: assets.id,
        status: assets.status,
        isBulk: assets.isBulk,
        totalQuantity: assets.quantity,
      })
      .from(assets)
      .where(
        and(inArray(assets.id, assetIds), eq(assets.tenantId, tenantId))
      )

    const blockedStatuses = ["damaged", "missing", "needs_inspection", "retired"]
    const tenantAssetMap = new Map(tenantAssets.map((a) => [a.id, a]))

    for (const [assetId, quantity] of merged.entries()) {
      const asset = tenantAssetMap.get(assetId)
      if (!asset) {
        throw new Error(`Asset ${assetId} does not belong to your company`)
      }
      if (blockedStatuses.includes(asset.status)) {
        throw new Error(
          `Asset ${assetId} is ${asset.status.replace(/_/g, " ")} and cannot be booked`
        )
      }
      if (!asset.isBulk && quantity !== 1) {
        throw new Error(
          `Asset ${assetId} is not a bulk item — quantity must be 1`
        )
      }
      if (asset.isBulk && quantity > asset.totalQuantity) {
        throw new Error(
          `Only ${asset.totalQuantity} available for ${assetId}, requested ${quantity}`
        )
      }
    }

    const bulkItems = Array.from(merged.entries()).filter(([assetId]) => {
      const asset = tenantAssetMap.get(assetId)
      return asset?.isBulk
    })

    if (bulkItems.length > 0) {
      const bulkAssetIds = bulkItems.map(([id]) => id)

      const overlappingBooked = await db
        .select({
          assetId: bookingItems.assetId,
          totalBooked: sql<number>`COALESCE(SUM(${bookingItems.quantityBooked}), 0)`.mapWith(Number),
        })
        .from(bookingItems)
        .innerJoin(bookings, eq(bookings.id, bookingItems.bookingId))
        .where(
          and(
            inArray(bookingItems.assetId, bulkAssetIds),
            eq(bookings.tenantId, tenantId),
            gte(sql`COALESCE(${bookings.returnDate}, ${bookings.endDate})`, parsed.startDate),
            lte(bookings.startDate, requestedEnd),
            not(eq(bookings.status, "cancelled")),
            not(eq(bookings.status, "returned"))
          )
        )
        .groupBy(bookingItems.assetId)

      const bookedMap = new Map(overlappingBooked.map((r) => [r.assetId, r.totalBooked]))

      for (const [assetId, qty] of bulkItems) {
        const asset = tenantAssetMap.get(assetId)!
        const alreadyBooked = bookedMap.get(assetId) ?? 0
        const available = asset.totalQuantity - alreadyBooked

        if (qty > available) {
          throw new Error(
            `Only ${available} available for asset ${assetId} on these dates (${alreadyBooked} already booked, ${qty} requested)`
          )
        }
      }
    }
  }

  const { conflicts, shortages } = await detectBookingConflicts(
    Array.from(merged.keys()),
    requestedStart,
    requestedEnd,
    tenantId
  )

  if (conflicts.length > 0) {
    return { error: "conflict", conflicts }
  }

  const result = await db.transaction(async (tx) => {
    const [booking] = await tx
      .insert(bookings)
      .values({
        tenantId: session.user.tenantId,
        clientId: parsed.clientId,
        eventName: parsed.eventName,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        deliveryDate: parsed.deliveryDate ?? null,
        returnDate: parsed.returnDate ?? null,
        status: "confirmed",
        depositAmount: parsed.depositAmount != null ? String(parsed.depositAmount) : null,
        notes: parsed.notes ?? null,
      })
      .returning()

    for (const [assetId, qty] of merged.entries()) {
      await tx.insert(bookingItems).values({
        bookingId: booking.id,
        assetId,
        quantityBooked: qty,
      })
    }

    return booking
  })

  revalidatePath("/bookings")
  revalidatePath("/")
  return { booking: result }
}

export async function createClient(input: FormData | Record<string, unknown>) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = createClientSchema.parse(raw)
  const db = getDatabase()

  const [client] = await db
    .insert(clients)
    .values({
      tenantId: session.user.tenantId,
      name: parsed.name,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      notes: parsed.notes ?? null,
    })
    .returning()

  revalidatePath("/clients")
  return client
}

export async function updateClient(
  id: number,
  input: FormData | Record<string, unknown>
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const raw = input instanceof FormData ? Object.fromEntries(input) : input
  const parsed = updateClientSchema.parse(raw)
  const db = getDatabase()

  const updateData: Record<string, unknown> = {}
  if (parsed.name !== undefined) updateData.name = parsed.name
  if (parsed.email !== undefined) updateData.email = parsed.email
  if (parsed.phone !== undefined) updateData.phone = parsed.phone
  if (parsed.notes !== undefined) updateData.notes = parsed.notes

  const [client] = await db
    .update(clients)
    .set(updateData)
    .where(
      and(eq(clients.id, id), eq(clients.tenantId, session.user.tenantId))
    )
    .returning()

  revalidatePath(`/clients`)
  return client
}

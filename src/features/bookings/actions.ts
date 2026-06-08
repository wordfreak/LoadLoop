"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import { bookings, bookingItems, assets, clients } from "@/lib/db/schema"
import { eq, and, inArray, lte, gte, not, ne } from "drizzle-orm"
import { createBookingSchema, createClientSchema, updateClientSchema } from "./schemas"

type BookingConflict = {
  assetId: number
  assetName: string
  conflictBookingId: number
  conflictEventName: string
  conflictStartDate: string
  conflictEndDate: string
}

export async function detectBookingConflicts(
  assetIds: number[],
  startDate: string,
  endDate: string,
  tenantId: number,
  excludeBookingId?: number
): Promise<BookingConflict[]> {
  const db = getDatabase()

  if (assetIds.length === 0) return []

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

  return rows.map((row) => ({
    assetId: row.assetId,
    assetName: row.assetName,
    conflictBookingId: row.bookingId,
    conflictEventName: row.eventName,
    conflictStartDate: row.startDate,
    conflictEndDate: row.endDate,
  }))
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

  if (parsed.items.length > 0) {
    const assetIds = parsed.items.map((i) => i.assetId)
    const tenantAssets = await db
      .select({ id: assets.id })
      .from(assets)
      .where(
        and(inArray(assets.id, assetIds), eq(assets.tenantId, tenantId))
      )

    const tenantAssetIds = new Set(tenantAssets.map((a) => a.id))
    for (const item of parsed.items) {
      if (!tenantAssetIds.has(item.assetId)) {
        throw new Error(`Asset ${item.assetId} does not belong to your company`)
      }
    }
  }

  const conflicts = await detectBookingConflicts(
    parsed.items.map((i) => i.assetId),
    parsed.startDate,
    parsed.endDate,
    tenantId
  )

  if (conflicts.length > 0) {
    return { error: "conflict", conflicts }
  }

  const [booking] = await db
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

  for (const item of parsed.items) {
    await db.insert(bookingItems).values({
      bookingId: booking.id,
      assetId: item.assetId,
      quantityBooked: item.quantityBooked,
    })
  }

  for (const item of parsed.items) {
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.id, item.assetId))
      .limit(1)

    if (asset?.status === "available") {
      await db
        .update(assets)
        .set({ status: "reserved", updatedAt: new Date() })
        .where(eq(assets.id, item.assetId))
    }
  }

  revalidatePath("/bookings")
  revalidatePath("/")
  return { booking }
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

"use server"

import { revalidatePath } from "next/cache"
import { eq, and, inArray } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import {
  bookingItems,
  bookings,
  assets,
  assetMovements,
  damageReports,
} from "@/lib/db/schema"
import type { AssetStatus, MovementType } from "@/features/assets/statuses"

export async function confirmPackedItems(
  bookingId: number,
  confirmedItemIds: number[],
  performedBy: string
) {
  const db = getDatabase()

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) throw new Error("Booking not found")
  if (booking.status === "cancelled" || booking.status === "returned") {
    throw new Error("Booking is not active")
  }

  if (confirmedItemIds.length > 0) {
    await db
      .update(bookingItems)
      .set({ quantityPacked: bookingItems.quantityBooked })
      .where(
        and(
          eq(bookingItems.bookingId, bookingId),
          inArray(bookingItems.id, confirmedItemIds)
        )
      )
  }

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      assetStatus: assets.status,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  for (const item of items) {
    const assetStatus = item.assetStatus as AssetStatus
    const newStatus: AssetStatus = "packed"

    await db
      .update(assets)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(assets.id, item.assetId))

    await db.insert(assetMovements).values({
      tenantId: booking.tenantId,
      assetId: item.assetId,
      bookingId,
      movementType: "packed" as MovementType,
      fromStatus: assetStatus,
      toStatus: newStatus,
      quantity: item.quantityBooked,
      performedBy,
    })
  }

  if (booking.status === "confirmed") {
    await db
      .update(bookings)
      .set({ status: "packed", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
  }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

export async function completeReturnCheckIn(
  bookingId: number,
  itemStates: Record<
    number,
    { state: "good" | "damaged" | "missing" | "needs_inspection"; note?: string }
  >,
  performedBy: string
) {
  const db = getDatabase()

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) throw new Error("Booking not found")

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      assetStatus: assets.status,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  for (const item of items) {
    const state = itemStates[item.id]
    if (!state) continue

    const assetStatus = item.assetStatus as AssetStatus

    if (state.state === "good") {
      const newStatus: AssetStatus = "available"

      await db
        .update(bookingItems)
        .set({ quantityReturned: item.quantityBooked })
        .where(eq(bookingItems.id, item.id))

      await db
        .update(assets)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(assets.id, item.assetId))

      await db.insert(assetMovements).values({
        tenantId: booking.tenantId,
        assetId: item.assetId,
        bookingId,
        movementType: "returned_good" as MovementType,
        fromStatus: assetStatus,
        toStatus: newStatus,
        quantity: item.quantityBooked,
        performedBy,
      })
    }

    if (state.state === "missing") {
      await db
        .update(bookingItems)
        .set({ quantityMissing: item.quantityBooked })
        .where(eq(bookingItems.id, item.id))

      await db
        .update(assets)
        .set({ status: "missing" as AssetStatus, updatedAt: new Date() })
        .where(eq(assets.id, item.assetId))

      await db.insert(assetMovements).values({
        tenantId: booking.tenantId,
        assetId: item.assetId,
        bookingId,
        movementType: "returned_missing" as MovementType,
        fromStatus: assetStatus,
        toStatus: "missing" as AssetStatus,
        quantity: item.quantityBooked,
        performedBy,
        notes: state.note ?? null,
      })
    }

    if (state.state === "damaged") {
      await db
        .update(bookingItems)
        .set({ quantityDamaged: item.quantityBooked })
        .where(eq(bookingItems.id, item.id))

      await db
        .update(assets)
        .set({ status: "damaged" as AssetStatus, updatedAt: new Date() })
        .where(eq(assets.id, item.assetId))

      await db.insert(assetMovements).values({
        tenantId: booking.tenantId,
        assetId: item.assetId,
        bookingId,
        movementType: "returned_damaged" as MovementType,
        fromStatus: assetStatus,
        toStatus: "damaged" as AssetStatus,
        quantity: item.quantityBooked,
        performedBy,
        notes: state.note ?? null,
      })

      await db.insert(damageReports).values({
        tenantId: booking.tenantId,
        assetId: item.assetId,
        bookingId,
        photoUrl: "",
        description: state.note ?? null,
        status: "pending",
        reportedBy: performedBy,
      })
    }

    if (state.state === "needs_inspection") {
      await db
        .update(bookingItems)
        .set({ quantityReturned: item.quantityBooked })
        .where(eq(bookingItems.id, item.id))

      await db
        .update(assets)
        .set({
          status: "needs_inspection" as AssetStatus,
          updatedAt: new Date(),
        })
        .where(eq(assets.id, item.assetId))

      await db.insert(assetMovements).values({
        tenantId: booking.tenantId,
        assetId: item.assetId,
        bookingId,
        movementType: "returned_needs_inspection" as MovementType,
        fromStatus: assetStatus,
        toStatus: "needs_inspection" as AssetStatus,
        quantity: item.quantityBooked,
        performedBy,
        notes: state.note ?? null,
      })
    }
  }

  await db
    .update(bookings)
    .set({ status: "returned", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId))

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

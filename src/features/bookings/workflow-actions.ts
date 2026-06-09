"use server"

import { revalidatePath } from "next/cache"
import { eq, and, inArray, gt } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import {
  bookingItems,
  bookings,
  assets,
  assetMovements,
  damageReports,
  bookingLinks,
} from "@/lib/db/schema"
import type { AssetStatus, MovementType } from "@/features/assets/statuses"

async function validateStaffToken(
  token: string,
  expectedType: "pick" | "return"
) {
  const db = getDatabase()
  const [link] = await db
    .select()
    .from(bookingLinks)
    .where(
      and(
        eq(bookingLinks.token, token),
        eq(bookingLinks.linkType, expectedType),
        gt(bookingLinks.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!link) throw new Error("Invalid or expired link")
  return link
}

export async function confirmPackedItems(
  token: string,
  confirmedItemIds: number[],
  performedBy: string
) {
  const link = await validateStaffToken(token, "pick")
  if (!performedBy || performedBy.trim().length === 0) {
    throw new Error("Staff name is required")
  }
  const db = getDatabase()
  const bookingId = link.bookingId

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) throw new Error("Booking not found")
  if (booking.status === "cancelled" || booking.status === "returned") {
    throw new Error("Booking is not active")
  }

  const validItems = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      quantityCheckedOut: bookingItems.quantityCheckedOut,
      assetStatus: assets.status,
      isBulk: assets.isBulk,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(
      and(
        eq(bookingItems.bookingId, bookingId),
        inArray(bookingItems.id, confirmedItemIds)
      )
    )

  const itemsToProcess = validItems.filter(
    (item) => item.quantityCheckedOut < item.quantityBooked
  )

  if (itemsToProcess.length === 0) {
    revalidatePath(`/bookings/${bookingId}`)
    revalidatePath("/")
    return
  }

  const processIds = itemsToProcess.map((item) => item.id)

  await db.transaction(async (tx) => {
    await tx
      .update(bookingItems)
      .set({
        quantityPacked: bookingItems.quantityBooked,
        quantityCheckedOut: bookingItems.quantityBooked,
      })
      .where(
        and(
          eq(bookingItems.bookingId, bookingId),
          inArray(bookingItems.id, processIds)
        )
      )

    for (const item of itemsToProcess) {
      const assetStatus = item.assetStatus as AssetStatus
      const newStatus: AssetStatus = "checked_out"

      if (assetStatus !== "checked_out") {
        if (!item.isBulk) {
          await tx
            .update(assets)
            .set({ status: newStatus, updatedAt: new Date() })
            .where(eq(assets.id, item.assetId))
        }

        await tx.insert(assetMovements).values({
          tenantId: booking.tenantId,
          assetId: item.assetId,
          bookingId,
          movementType: "checked_out" as MovementType,
          fromStatus: assetStatus,
          toStatus: newStatus,
          quantity: item.quantityBooked,
          performedBy,
        })
      }
    }

    if (booking.status === "confirmed" || booking.status === "packed") {
      await tx
        .update(bookings)
        .set({ status: "out", updatedAt: new Date() })
        .where(eq(bookings.id, bookingId))
    }
  })

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

export async function completeReturnCheckIn(
  token: string,
  itemStates: Record<
    number,
    {
      state: "good" | "damaged" | "missing" | "needs_inspection"
      note?: string
      photoUrl?: string
      repairCost?: number
    }
  >,
  performedBy: string
) {
  const link = await validateStaffToken(token, "return")
  if (!performedBy || performedBy.trim().length === 0) {
    throw new Error("Staff name is required")
  }
  const db = getDatabase()
  const bookingId = link.bookingId

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) throw new Error("Booking not found")
  if (booking.status === "returned") {
    throw new Error("Booking has already been returned")
  }
  if (booking.status === "cancelled") {
    throw new Error("Booking is cancelled")
  }

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      quantityReturned: bookingItems.quantityReturned,
      quantityDamaged: bookingItems.quantityDamaged,
      quantityMissing: bookingItems.quantityMissing,
      assetStatus: assets.status,
      isBulk: assets.isBulk,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  const validItemIds = new Set(items.map((item) => item.id))

  for (const item of items) {
    const state = itemStates[item.id]

    if (!state) {
      throw new Error(`Item ${item.id} is missing a return state`)
    }

    if (!validItemIds.has(item.id)) {
      throw new Error(`Item ${item.id} does not belong to this booking`)
    }

    if (state.state === "damaged") {
      if (!state.note || state.note.trim().length === 0) {
        throw new Error(`Damage description required for item ${item.id}`)
      }
      if (!state.photoUrl || state.photoUrl.trim().length === 0) {
        throw new Error(`Damage photo required for item ${item.id}`)
      }
    }

    if (state.state === "missing") {
      if (!state.note || state.note.trim().length === 0) {
        throw new Error(`Missing item note required for item ${item.id}`)
      }
    }

    if (item.quantityReturned > 0 || item.quantityDamaged > 0 || item.quantityMissing > 0) {
      continue
    }
  }

  const submittedIds = new Set(Object.keys(itemStates).map(Number))
  for (const item of items) {
    if (!submittedIds.has(item.id)) {
      throw new Error(`Item ${item.id} was not included in the return`)
    }
  }

  await db.transaction(async (tx) => {
    for (const item of items) {
      if (item.quantityReturned > 0 || item.quantityDamaged > 0 || item.quantityMissing > 0) {
        continue
      }

      const state = itemStates[item.id]
      const assetStatus = item.assetStatus as AssetStatus

      if (state.state === "good") {
        const newStatus: AssetStatus = "available"

        await tx
          .update(bookingItems)
          .set({ quantityReturned: item.quantityBooked })
          .where(eq(bookingItems.id, item.id))

        if (assetStatus !== "available") {
          if (!item.isBulk) {
            await tx
              .update(assets)
              .set({ status: newStatus, updatedAt: new Date() })
              .where(eq(assets.id, item.assetId))
          }

          await tx.insert(assetMovements).values({
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
      }

      if (state.state === "missing") {
        await tx
          .update(bookingItems)
          .set({ quantityMissing: item.quantityBooked })
          .where(eq(bookingItems.id, item.id))

        if (assetStatus !== "missing") {
          if (!item.isBulk) {
            await tx
              .update(assets)
              .set({ status: "missing" as AssetStatus, updatedAt: new Date() })
              .where(eq(assets.id, item.assetId))
          }

          await tx.insert(assetMovements).values({
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
      }

      if (state.state === "damaged") {
        await tx
          .update(bookingItems)
          .set({ quantityDamaged: item.quantityBooked })
          .where(eq(bookingItems.id, item.id))

        if (assetStatus !== "damaged") {
          if (!item.isBulk) {
            await tx
              .update(assets)
              .set({ status: "damaged" as AssetStatus, updatedAt: new Date() })
              .where(eq(assets.id, item.assetId))
          }

          await tx.insert(assetMovements).values({
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
        }

        const [existing] = await tx
          .select({ id: damageReports.id })
          .from(damageReports)
          .where(
            and(
              eq(damageReports.bookingId, bookingId),
              eq(damageReports.assetId, item.assetId),
              eq(damageReports.status, "pending")
            )
          )
          .limit(1)

        if (!existing) {
          await tx.insert(damageReports).values({
            tenantId: booking.tenantId,
            assetId: item.assetId,
            bookingId,
            photoUrl: state.photoUrl ?? "",
            description: state.note ?? null,
            repairCost: state.repairCost != null ? String(state.repairCost) : null,
            status: "pending",
            reportedBy: performedBy,
          })
        }
      }

      if (state.state === "needs_inspection") {
        await tx
          .update(bookingItems)
          .set({ quantityReturned: item.quantityBooked })
          .where(eq(bookingItems.id, item.id))

        if (assetStatus !== "needs_inspection") {
          if (!item.isBulk) {
            await tx
              .update(assets)
              .set({
                status: "needs_inspection" as AssetStatus,
                updatedAt: new Date(),
              })
              .where(eq(assets.id, item.assetId))
          }

          await tx.insert(assetMovements).values({
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
    }

    await tx
      .update(bookings)
      .set({ status: "returned", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))

    await tx
      .update(bookingLinks)
      .set({ usedBy: performedBy })
      .where(eq(bookingLinks.id, link.id))
  })

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

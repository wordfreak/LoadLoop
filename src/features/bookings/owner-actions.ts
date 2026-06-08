"use server"

import { revalidatePath } from "next/cache"
import { eq, and, inArray } from "drizzle-orm"
import { auth } from "@/lib/auth/config"
import { getDatabase } from "@/lib/db"
import {
  bookings,
  bookingItems,
  assets,
  assetMovements,
  damageReports,
} from "@/lib/db/schema"
import { canTransition } from "@/features/assets/statuses"
import type { AssetStatus, MovementType } from "@/features/assets/statuses"

export async function ownerMarkDispatched(bookingId: number) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId))
    )
    .limit(1)

  if (!booking) throw new Error("Booking not found")
  if (booking.status === "returned" || booking.status === "cancelled") {
    throw new Error("Booking is not active")
  }

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      quantityCheckedOut: bookingItems.quantityCheckedOut,
      assetStatus: assets.status,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  const itemsToProcess = items.filter(
    (item) => item.quantityCheckedOut < item.quantityBooked
  )

  if (itemsToProcess.length > 0) {
    const processIds = itemsToProcess.map((item) => item.id)

    await db
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
        await db
          .update(assets)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(assets.id, item.assetId))

        await db.insert(assetMovements).values({
          tenantId,
          assetId: item.assetId,
          bookingId,
          movementType: "checked_out" as MovementType,
          fromStatus: assetStatus,
          toStatus: newStatus,
          quantity: item.quantityBooked,
          performedBy: session.user.name ?? session.user.email ?? "owner",
          notes: "Owner override — marked as dispatched",
        })
      }
    }
  }

  if (booking.status !== "out") {
    await db
      .update(bookings)
      .set({ status: "out", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
  }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

export async function ownerMarkAllReturnedGood(bookingId: number) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const [booking] = await db
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.tenantId, tenantId))
    )
    .limit(1)

  if (!booking) throw new Error("Booking not found")
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
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, bookingId))

  const itemsToProcess = items.filter(
    (item) =>
      item.quantityReturned < item.quantityBooked &&
      item.quantityDamaged === 0 &&
      item.quantityMissing === 0
  )

  if (itemsToProcess.length > 0) {
    const processIds = itemsToProcess.map((item) => item.id)

    await db
      .update(bookingItems)
      .set({ quantityReturned: bookingItems.quantityBooked })
      .where(
        and(
          eq(bookingItems.bookingId, bookingId),
          inArray(bookingItems.id, processIds)
        )
      )

    for (const item of itemsToProcess) {
      const assetStatus = item.assetStatus as AssetStatus
      const newStatus: AssetStatus = "available"

      if (assetStatus !== "available" && assetStatus !== "retired") {
        await db
          .update(assets)
          .set({ status: newStatus, updatedAt: new Date() })
          .where(eq(assets.id, item.assetId))

        await db.insert(assetMovements).values({
          tenantId,
          assetId: item.assetId,
          bookingId,
          movementType: "returned_good" as MovementType,
          fromStatus: assetStatus,
          toStatus: newStatus,
          quantity: item.quantityBooked,
          performedBy: session.user.name ?? session.user.email ?? "owner",
          notes: "Owner override — marked all returned good",
        })
      }
    }
  }

  if (booking.status !== "returned") {
    await db
      .update(bookings)
      .set({ status: "returned", updatedAt: new Date() })
      .where(eq(bookings.id, bookingId))
  }

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath("/")
}

export async function ownerCorrectAssetStatus(
  assetId: number,
  newStatus: AssetStatus
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    )
    .limit(1)

  if (!asset) throw new Error("Asset not found")

  const currentStatus = asset.status as AssetStatus

  if (currentStatus === newStatus) return

  await db
    .update(assets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(assets.id, assetId))

  await db.insert(assetMovements).values({
    tenantId,
    assetId,
    movementType: "available" as MovementType,
    fromStatus: currentStatus,
    toStatus: newStatus,
    performedBy: session.user.name ?? session.user.email ?? "owner",
    notes: `Owner correction: ${currentStatus} → ${newStatus}`,
  })

  revalidatePath(`/assets/${assetId}`)
  revalidatePath("/")
}

export async function ownerAddLateDamageReport(
  assetId: number,
  bookingId: number | null,
  description: string,
  photoUrl?: string,
  repairCost?: number
) {
  const session = await auth()
  if (!session?.user?.tenantId) throw new Error("Unauthorized")

  const db = getDatabase()
  const tenantId = session.user.tenantId

  const [asset] = await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.id, assetId), eq(assets.tenantId, tenantId))
    )
    .limit(1)

  if (!asset) throw new Error("Asset not found")

  const [report] = await db
    .insert(damageReports)
    .values({
      tenantId,
      assetId,
      bookingId,
      photoUrl: photoUrl ?? "",
      description,
      repairCost: repairCost != null ? String(repairCost) : null,
      status: "pending",
      reportedBy: session.user.name ?? session.user.email ?? "owner",
    })
    .returning()

  if (asset.status !== "damaged") {
    const currentStatus = asset.status as AssetStatus

    await db
      .update(assets)
      .set({ status: "damaged", updatedAt: new Date() })
      .where(eq(assets.id, assetId))

    await db.insert(assetMovements).values({
      tenantId,
      assetId,
      bookingId,
      movementType: "damage_reported" as MovementType,
      fromStatus: currentStatus,
      toStatus: "damaged",
      performedBy: session.user.name ?? session.user.email ?? "owner",
      notes: `Late damage report #${report.id}: ${description}`,
    })
  }

  revalidatePath(`/assets/${assetId}`)
  revalidatePath("/")
  return report
}

import { randomUUID } from "crypto"
import { eq, and, gt } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import {
  bookingLinks,
  bookings,
  bookingItems,
  assets,
  clients,
} from "@/lib/db/schema"

type LinkType = "pick" | "return"

export async function createBookingLink(
  bookingId: number,
  type: LinkType,
  tenantId: number,
  expiresAt: Date
) {
  const db = getDatabase()
  const token = randomUUID()

  const [link] = await db
    .insert(bookingLinks)
    .values({
      tenantId,
      bookingId,
      linkType: type,
      token,
      expiresAt,
    })
    .returning()

  return link
}

export async function validateBookingLink(token: string) {
  const db = getDatabase()
  const [link] = await db
    .select()
    .from(bookingLinks)
    .where(
      and(
        eq(bookingLinks.token, token),
        gt(bookingLinks.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!link) return null
  return link
}

export async function getBookingForLink(token: string) {
  const db = getDatabase()
  const link = await validateBookingLink(token)
  if (!link) return null

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, link.bookingId))
    .limit(1)

  if (!booking) return null

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, booking.clientId))
    .limit(1)

  const items = await db
    .select({
      id: bookingItems.id,
      assetId: bookingItems.assetId,
      quantityBooked: bookingItems.quantityBooked,
      quantityPacked: bookingItems.quantityPacked,
      quantityCheckedOut: bookingItems.quantityCheckedOut,
      quantityReturned: bookingItems.quantityReturned,
      quantityDamaged: bookingItems.quantityDamaged,
      quantityMissing: bookingItems.quantityMissing,
      assetName: assets.name,
      assetPhotoUrl: assets.photoUrl,
      assetQrToken: assets.qrToken,
      assetStatus: assets.status,
      assetValue: assets.value,
      assetIsBulk: assets.isBulk,
    })
    .from(bookingItems)
    .innerJoin(assets, eq(assets.id, bookingItems.assetId))
    .where(eq(bookingItems.bookingId, booking.id))

  return {
    link,
    booking,
    client,
    items,
  }
}

export async function generateBookingLinks(bookingId: number, tenantId: number) {
  const db = getDatabase()
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1)

  if (!booking) throw new Error("Booking not found")

  const returnDate = booking.returnDate ?? booking.endDate
  const expiresAt = new Date(returnDate)
  expiresAt.setDate(expiresAt.getDate() + 3)

  const pickLink = await createBookingLink(
    bookingId,
    "pick",
    tenantId,
    expiresAt
  )
  const returnLink = await createBookingLink(
    bookingId,
    "return",
    tenantId,
    expiresAt
  )

  return { pickLink, returnLink }
}

import {
  pgTable,
  serial,
  integer,
  text,
  index,
} from "drizzle-orm/pg-core"
import { bookings } from "./bookings"
import { assets } from "./assets"

export const bookingItems = pgTable(
  "booking_items",
  {
    id: serial("id").primaryKey(),
    bookingId: integer("booking_id")
      .references(() => bookings.id)
      .notNull(),
    assetId: integer("asset_id")
      .references(() => assets.id)
      .notNull(),
    quantityBooked: integer("quantity_booked").default(1).notNull(),
    quantityPacked: integer("quantity_packed").default(0).notNull(),
    quantityCheckedOut: integer("quantity_checked_out").default(0).notNull(),
    quantityReturned: integer("quantity_returned").default(0).notNull(),
    quantityDamaged: integer("quantity_damaged").default(0).notNull(),
    quantityMissing: integer("quantity_missing").default(0).notNull(),
    notes: text("notes"),
  },
  (table) => [
    index("booking_items_booking_id_idx").on(table.bookingId),
    index("booking_items_asset_id_idx").on(table.bookingId, table.assetId),
  ]
)

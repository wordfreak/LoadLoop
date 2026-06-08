import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { assets } from "./assets"
import { bookings } from "./bookings"
import { locations } from "./locations"

export const assetMovements = pgTable(
  "asset_movements",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    assetId: integer("asset_id")
      .references(() => assets.id)
      .notNull(),
    bookingId: integer("booking_id").references(() => bookings.id),
    locationId: integer("location_id").references(() => locations.id),
    movementType: text("movement_type").notNull(),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    performedBy: text("performed_by").notNull(),
    notes: text("notes"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("asset_movements_asset_id_idx").on(table.assetId, table.timestamp),
    index("asset_movements_booking_id_idx").on(table.bookingId),
    index("asset_movements_tenant_id_idx").on(table.tenantId),
  ]
)

import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { bookings } from "./bookings"

export const bookingLinks = pgTable(
  "booking_links",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    bookingId: integer("booking_id")
      .references(() => bookings.id)
      .notNull(),
    linkType: text("link_type").notNull(),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedBy: text("used_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("booking_links_token_idx").on(table.token)]
)

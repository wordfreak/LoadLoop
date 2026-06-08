import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { assets } from "./assets"
import { bookings } from "./bookings"
import { clients } from "./clients"

export const damageReports = pgTable(
  "damage_reports",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    assetId: integer("asset_id")
      .references(() => assets.id)
      .notNull(),
    bookingId: integer("booking_id").references(() => bookings.id),
    clientId: integer("client_id").references(() => clients.id),
    photoUrl: text("photo_url").notNull(),
    description: text("description"),
    repairCost: numeric("repair_cost", { precision: 10, scale: 2 }),
    depositImpact: text("deposit_impact"),
    status: text("status").default("pending").notNull(),
    reportedBy: text("reported_by").notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("damage_reports_asset_id_idx").on(table.assetId),
    index("damage_reports_booking_id_idx").on(table.bookingId),
    index("damage_reports_tenant_id_idx").on(table.tenantId),
  ]
)

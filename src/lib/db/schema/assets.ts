import {
  pgTable,
  serial,
  integer,
  text,
  numeric,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { categories } from "./categories"
import { locations } from "./locations"

export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    locationId: integer("location_id").references(() => locations.id),
    name: text("name").notNull(),
    serialNumber: text("serial_number"),
    existingCode: text("existing_code"),
    qrToken: text("qr_token").unique().notNull(),
    value: numeric("value", { precision: 10, scale: 2 }),
    status: text("status").default("available").notNull(),
    photoUrl: text("photo_url"),
    isBulk: boolean("is_bulk").default(false).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    condition: text("condition"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("assets_tenant_id_idx").on(table.tenantId),
    index("assets_status_idx").on(table.tenantId, table.status),
    index("assets_category_idx").on(table.tenantId, table.categoryId),
    uniqueIndex("qr_token_idx").on(table.qrToken),
  ]
)

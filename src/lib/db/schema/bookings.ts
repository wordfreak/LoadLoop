import {
  pgTable,
  serial,
  integer,
  text,
  date,
  numeric,
  timestamp,
  index,
} from "drizzle-orm/pg-core"
import { tenants } from "./tenants"
import { clients } from "./clients"

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    tenantId: integer("tenant_id")
      .references(() => tenants.id)
      .notNull(),
    clientId: integer("client_id")
      .references(() => clients.id)
      .notNull(),
    eventName: text("event_name").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    deliveryDate: date("delivery_date"),
    returnDate: date("return_date"),
    status: text("status").default("draft").notNull(),
    depositAmount: numeric("deposit_amount", { precision: 10, scale: 2 }),
    depositStatus: text("deposit_status"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("bookings_tenant_id_idx").on(table.tenantId),
    index("bookings_status_idx").on(table.tenantId, table.status),
    index("bookings_date_range_idx").on(
      table.tenantId,
      table.startDate,
      table.endDate
    ),
  ]
)

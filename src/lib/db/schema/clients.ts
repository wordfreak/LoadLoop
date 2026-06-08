import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

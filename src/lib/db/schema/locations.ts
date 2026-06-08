import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

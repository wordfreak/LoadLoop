import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core"
import { tenants } from "./tenants"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id).notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").default("owner").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

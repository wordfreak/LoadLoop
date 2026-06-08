import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core"

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  slug: text("slug").unique().notNull(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  currency: text("currency").default("USD").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

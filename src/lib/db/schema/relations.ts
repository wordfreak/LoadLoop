import { relations } from "drizzle-orm"
import { tenants } from "./tenants"
import { users } from "./users"
import { assets } from "./assets"
import { categories } from "./categories"
import { locations } from "./locations"
import { bookings } from "./bookings"
import { clients } from "./clients"
import { bookingItems } from "./booking-items"
import { assetMovements } from "./asset-movements"
import { damageReports } from "./damage-reports"
import { bookingLinks } from "./booking-links"

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  assets: many(assets),
  bookings: many(bookings),
  clients: many(clients),
}))

export const assetsRelations = relations(assets, ({ one, many }) => ({
  category: one(categories, {
    fields: [assets.categoryId],
    references: [categories.id],
  }),
  location: one(locations, {
    fields: [assets.locationId],
    references: [locations.id],
  }),
  movements: many(assetMovements),
  damageReports: many(damageReports),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(clients, {
    fields: [bookings.clientId],
    references: [clients.id],
  }),
  items: many(bookingItems),
  movements: many(assetMovements),
  damageReports: many(damageReports),
  links: many(bookingLinks),
}))

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  asset: one(assets, {
    fields: [bookingItems.assetId],
    references: [assets.id],
  }),
}))

export const assetMovementsRelations = relations(assetMovements, ({ one }) => ({
  asset: one(assets, {
    fields: [assetMovements.assetId],
    references: [assets.id],
  }),
  booking: one(bookings, {
    fields: [assetMovements.bookingId],
    references: [bookings.id],
  }),
  location: one(locations, {
    fields: [assetMovements.locationId],
    references: [locations.id],
  }),
}))

export const damageReportsRelations = relations(damageReports, ({ one }) => ({
  asset: one(assets, {
    fields: [damageReports.assetId],
    references: [assets.id],
  }),
  booking: one(bookings, {
    fields: [damageReports.bookingId],
    references: [bookings.id],
  }),
  client: one(clients, {
    fields: [damageReports.clientId],
    references: [clients.id],
  }),
}))

export const bookingLinksRelations = relations(bookingLinks, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingLinks.bookingId],
    references: [bookings.id],
  }),
}))

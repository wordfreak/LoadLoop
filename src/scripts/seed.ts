import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { randomUUID } from "crypto"
import { hash } from "bcryptjs"
import { eq, inArray } from "drizzle-orm"
import * as schema from "../lib/db/schema"

const damagePhoto = (label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"><rect width="900" height="600" fill="#f4f1ec"/><rect x="60" y="60" width="780" height="420" rx="20" fill="#ddd8cf" stroke="#333" stroke-width="8"/><path d="M620 80 L570 190 L650 275 L590 410 L700 480" fill="none" stroke="#b42318" stroke-width="14" stroke-linecap="round"/><text x="80" y="535" font-family="Arial" font-size="42" fill="#222">${label}</text><text x="80" y="570" font-family="Arial" font-size="24" fill="#555">Demo photo evidence</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  const [existingTenant] = await db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.slug, "apex-av")).limit(1)

  if (existingTenant) {
    const tenantBookings = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.tenantId, existingTenant.id))
    const bookingIds = tenantBookings.map((b) => b.id)
    await db.delete(schema.bookingLinks).where(eq(schema.bookingLinks.tenantId, existingTenant.id))
    await db.delete(schema.damageReports).where(eq(schema.damageReports.tenantId, existingTenant.id))
    await db.delete(schema.assetMovements).where(eq(schema.assetMovements.tenantId, existingTenant.id))
    if (bookingIds.length > 0) await db.delete(schema.bookingItems).where(inArray(schema.bookingItems.bookingId, bookingIds))
    await db.delete(schema.bookings).where(eq(schema.bookings.tenantId, existingTenant.id))
    await db.delete(schema.assets).where(eq(schema.assets.tenantId, existingTenant.id))
    await db.delete(schema.locations).where(eq(schema.locations.tenantId, existingTenant.id))
    await db.delete(schema.categories).where(eq(schema.categories.tenantId, existingTenant.id))
    await db.delete(schema.clients).where(eq(schema.clients.tenantId, existingTenant.id))
    await db.delete(schema.users).where(eq(schema.users.tenantId, existingTenant.id))
    await db.delete(schema.tenants).where(eq(schema.tenants.id, existingTenant.id))
  }

  const [tenant] = await db.insert(schema.tenants).values({ slug: "apex-av", name: "Apex AV Rentals", currency: "USD" }).returning()
  const passwordHash = await hash("Demo1234!", 12)
  await db.insert(schema.users).values({ tenantId: tenant.id, email: "demo@apexav.com", passwordHash, name: "Marcus Reeves", role: "owner" })

  const categoryNames = ["Projectors", "Screens", "Audio", "Lighting", "Cables", "Cases", "Staging", "Furniture", "Video"]
  const categoryMap: Record<string, number> = {}
  for (const name of categoryNames) {
    const [row] = await db.insert(schema.categories).values({ tenantId: tenant.id, name, slug: name.toLowerCase().replace(/\s+/g, "-") }).returning()
    categoryMap[name] = row.id
  }

  const locations = [
    { name: "Main Warehouse", type: "warehouse" },
    { name: "Van 1", type: "vehicle" },
    { name: "Van 2", type: "vehicle" },
    { name: "Repair Bench", type: "repair" },
  ]
  const locationMap: Record<string, number> = {}
  for (const loc of locations) {
    const [row] = await db.insert(schema.locations).values({ tenantId: tenant.id, name: loc.name, type: loc.type }).returning()
    locationMap[loc.name] = row.id
  }

  const assetDefs = [
    { key: "sony", name: "Sony VPL-PHZ10 Projector", cat: "Projectors", value: 3500, serial: "APX-PJ-001", code: "QR-PJ-001", status: "available", qty: 1 },
    { key: "epson", name: "Epson PowerLite L610U Projector", cat: "Projectors", value: 2400, serial: "APX-PJ-002", code: "QR-PJ-002", status: "available", qty: 1 },
    { key: "panasonic", name: "Panasonic PT-RZ570 Projector", cat: "Projectors", value: 4800, serial: "APX-PJ-003", code: "QR-PJ-003", status: "checked_out", qty: 1 },
    { key: "screen10", name: "Da-Lite 10ft Fast-Fold Screen", cat: "Screens", value: 850, serial: "APX-SCR-001", code: "QR-SCR-001", status: "damaged", qty: 1 },
    { key: "screen8", name: "Da-Lite 8ft Fast-Fold Screen", cat: "Screens", value: 620, serial: "APX-SCR-002", code: "QR-SCR-002", status: "available", qty: 1 },
    { key: "elite120", name: "Elite Screens 120 Portable", cat: "Screens", value: 450, serial: "APX-SCR-003", code: "QR-SCR-003", status: "checked_out", qty: 1 },
    { key: "jbl1", name: "JBL EON615 Speaker 1", cat: "Audio", value: 600, serial: "APX-AUD-001", code: "QR-AUD-001", status: "available", qty: 1 },
    { key: "jbl2", name: "JBL EON615 Speaker 2", cat: "Audio", value: 600, serial: "APX-AUD-002", code: "QR-AUD-002", status: "available", qty: 1 },
    { key: "jbl3", name: "JBL EON615 Speaker 3", cat: "Audio", value: 600, serial: "APX-AUD-003", code: "QR-AUD-003", status: "checked_out", qty: 1 },
    { key: "jbl4", name: "JBL EON615 Speaker 4", cat: "Audio", value: 600, serial: "APX-AUD-004", code: "QR-AUD-004", status: "checked_out", qty: 1 },
    { key: "mic1", name: "Shure ULXD24 Wireless Mic Kit 1", cat: "Audio", value: 1800, serial: "APX-MIC-001", code: "QR-MIC-001", status: "available", qty: 1 },
    { key: "mic2", name: "Shure ULXD24 Wireless Mic Kit 2", cat: "Audio", value: 1800, serial: "APX-MIC-002", code: "QR-MIC-002", status: "checked_out", qty: 1 },
    { key: "lav", name: "Sennheiser EW-D Lavalier Kit", cat: "Audio", value: 750, serial: "APX-MIC-003", code: "QR-MIC-003", status: "available", qty: 1 },
    { key: "mixer1", name: "Yamaha MG10XU Mixer 1", cat: "Audio", value: 280, serial: "APX-MIX-001", code: "QR-MIX-001", status: "available", qty: 1 },
    { key: "mixer2", name: "Yamaha MG10XU Mixer 2", cat: "Audio", value: 280, serial: "APX-MIX-002", code: "QR-MIX-002", status: "checked_out", qty: 1 },
    { key: "r2a", name: "Chauvet Rogue R2 Spot 1", cat: "Lighting", value: 1200, serial: "APX-LGT-001", code: "QR-LGT-001", status: "available", qty: 1 },
    { key: "r2b", name: "Chauvet Rogue R2 Spot 2", cat: "Lighting", value: 1200, serial: "APX-LGT-002", code: "QR-LGT-002", status: "available", qty: 1 },
    { key: "adj1", name: "ADJ Focus Spot 4Z 1", cat: "Lighting", value: 380, serial: "APX-LGT-003", code: "QR-LGT-003", status: "damaged", qty: 1 },
    { key: "adj2", name: "ADJ Focus Spot 4Z 2", cat: "Lighting", value: 380, serial: "APX-LGT-004", code: "QR-LGT-004", status: "available", qty: 1 },
    { key: "colorado1", name: "Chauvet COLORado 1-Quad 1", cat: "Lighting", value: 450, serial: "APX-LGT-005", code: "QR-LGT-005", status: "available", qty: 1 },
    { key: "colorado2", name: "Chauvet COLORado 1-Quad 2", cat: "Lighting", value: 450, serial: "APX-LGT-006", code: "QR-LGT-006", status: "available", qty: 1 },
    { key: "casepj1", name: "Road Case - Projector 1", cat: "Cases", value: 320, serial: "APX-CASE-001", code: "QR-CASE-001", status: "available", qty: 1 },
    { key: "casepj2", name: "Road Case - Projector 2", cat: "Cases", value: 320, serial: "APX-CASE-002", code: "QR-CASE-002", status: "checked_out", qty: 1 },
    { key: "pelican1", name: "Pelican 1550 Case - Mic Kit 1", cat: "Cases", value: 180, serial: "APX-CASE-003", code: "QR-CASE-003", status: "available", qty: 1 },
    { key: "pelican2", name: "Pelican 1550 Case - Mic Kit 2", cat: "Cases", value: 180, serial: "APX-CASE-004", code: "QR-CASE-004", status: "checked_out", qty: 1 },
    { key: "display1", name: "Samsung 55in Commercial Display 1", cat: "Video", value: 1200, serial: "APX-VID-001", code: "QR-VID-001", status: "available", qty: 1 },
    { key: "display2", name: "Samsung 55in Commercial Display 2", cat: "Video", value: 1200, serial: "APX-VID-002", code: "QR-VID-002", status: "checked_out", qty: 1 },
    { key: "chairs", name: "Black Folding Chairs", cat: "Furniture", value: 22, serial: null, code: "BULK-CHAIRS-BLK", status: "available", qty: 80 },
    { key: "tables", name: "6ft Banquet Tables", cat: "Furniture", value: 75, serial: null, code: "BULK-TABLES-6FT", status: "available", qty: 18 },
    { key: "xlr", name: "XLR Cable 25ft", cat: "Cables", value: 25, serial: null, code: "BULK-XLR-25", status: "available", qty: 40 },
    { key: "hdmi", name: "HDMI Cable 50ft", cat: "Cables", value: 45, serial: null, code: "BULK-HDMI-50", status: "available", qty: 18 },
    { key: "power", name: "Power Extension 25ft", cat: "Cables", value: 30, serial: null, code: "BULK-POWER-25", status: "available", qty: 30 },
    { key: "stands", name: "Speaker Stands", cat: "Audio", value: 85, serial: null, code: "BULK-SPK-STAND", status: "available", qty: 8 },
    { key: "tbar", name: "Lighting Stand T-Bar", cat: "Lighting", value: 110, serial: null, code: "BULK-LGT-STAND", status: "available", qty: 6 },
    { key: "uprights", name: "Pipe and Drape Uprights", cat: "Staging", value: 45, serial: null, code: "BULK-PD-UPRIGHT", status: "available", qty: 24 },
    { key: "crossbars", name: "Pipe and Drape Crossbars", cat: "Staging", value: 35, serial: null, code: "BULK-PD-CROSS", status: "available", qty: 20 },
    { key: "tripods", name: "Projector Tripod Stands", cat: "Projectors", value: 95, serial: null, code: "BULK-PJ-STAND", status: "available", qty: 5 },
  ]

  const assets: Record<string, typeof schema.assets.$inferSelect> = {}
  for (const a of assetDefs) {
    const [row] = await db.insert(schema.assets).values({
      tenantId: tenant.id,
      categoryId: categoryMap[a.cat],
      locationId: locationMap["Main Warehouse"],
      name: a.name,
      serialNumber: a.serial,
      existingCode: a.code,
      qrToken: randomUUID(),
      value: String(a.value),
      status: a.status,
      quantity: a.qty,
      isBulk: a.qty > 1,
      condition: a.status === "damaged" ? "Damaged" : "Good",
      notes: a.qty > 1 ? "Bulk demo asset. Use quantity when booking." : "Demo asset for recorded LoadLoop walkthrough.",
    }).returning()
    assets[a.key] = row
    await db.insert(schema.assetMovements).values({ tenantId: tenant.id, assetId: row.id, movementType: "created", toStatus: a.status, quantity: a.qty, performedBy: "Marcus Reeves" })
  }

  const clientDefs = [
    { key: "meridian", name: "Meridian Events", email: "events@meridian.example", phone: "415-555-0202", notes: "Wedding and corporate planner. Good for damage/return demo." },
    { key: "techconf", name: "TechConf Inc.", email: "ops@techconf.example", phone: "415-555-0101", notes: "Annual tech conference client. Books projectors, displays, microphones." },
    { key: "bayside", name: "Bayside Productions", email: "hello@bayside.example", phone: "415-555-0303", notes: "Production company. Frequently rents lighting and audio." },
    { key: "nova", name: "Nova Weddings", email: "bookings@novaweddings.example", phone: "415-555-0404", notes: "Wedding decor and AV setup client." },
    { key: "brighthall", name: "BrightHall Conference Centre", email: "events@brighthall.example", phone: "415-555-0505", notes: "Venue partner. Often books bulk chairs/tables and audio." },
  ]
  const clients: Record<string, typeof schema.clients.$inferSelect> = {}
  for (const c of clientDefs) {
    const [row] = await db.insert(schema.clients).values({ tenantId: tenant.id, name: c.name, email: c.email, phone: c.phone, notes: c.notes }).returning()
    clients[c.key] = row
  }

  const today = new Date()
  const addDays = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d.toISOString().split("T")[0]
  }
  const plusDaysDate = (n: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + n)
    return d
  }

  const bookings = [
    {
      key: "meridianGala",
      client: clients.meridian,
      eventName: "Meridian Gala",
      startDate: addDays(-1),
      endDate: addDays(1),
      deliveryDate: addDays(-1),
      returnDate: addDays(1),
      status: "out",
      depositAmount: "1500",
      depositStatus: "held",
      notes: "Main demo booking. Show staff packing link and current value at risk.",
      items: [
        ["panasonic", 1, 1, 1, 0, 0, 0],
        ["elite120", 1, 1, 1, 0, 0, 0],
        ["jbl3", 1, 1, 1, 0, 0, 0],
        ["jbl4", 1, 1, 1, 0, 0, 0],
        ["mic2", 1, 1, 1, 0, 0, 0],
        ["casepj2", 1, 1, 1, 0, 0, 0],
        ["pelican2", 1, 1, 1, 0, 0, 0],
        ["chairs", 24, 24, 24, 0, 0, 0],
        ["tables", 6, 6, 6, 0, 0, 0],
      ],
    },
    {
      key: "techSummit",
      client: clients.techconf,
      eventName: "TechConf Annual Summit",
      startDate: addDays(3),
      endDate: addDays(5),
      deliveryDate: addDays(3),
      returnDate: addDays(5),
      status: "confirmed",
      depositAmount: "2200",
      depositStatus: "paid",
      notes: "Future booking to show confirmed jobs and conflict prevention.",
      items: [["sony", 1, 0, 0, 0, 0, 0], ["display1", 1, 0, 0, 0, 0, 0], ["mic1", 1, 0, 0, 0, 0, 0], ["xlr", 12, 0, 0, 0, 0, 0], ["hdmi", 3, 0, 0, 0, 0, 0]],
    },
    {
      key: "baysideLaunch",
      client: clients.bayside,
      eventName: "Bayside Product Launch",
      startDate: addDays(-4),
      endDate: addDays(-2),
      deliveryDate: addDays(-4),
      returnDate: addDays(-2),
      status: "returned",
      depositAmount: "900",
      depositStatus: "review",
      notes: "Returned booking with damage, missing item, and inspection issue.",
      items: [["screen10", 1, 1, 1, 0, 1, 0], ["adj1", 1, 1, 1, 0, 1, 0], ["mixer2", 1, 1, 1, 0, 0, 1], ["power", 8, 8, 8, 7, 0, 1]],
    },
    {
      key: "novaWedding",
      client: clients.nova,
      eventName: "Nova Wedding Reception",
      startDate: addDays(7),
      endDate: addDays(8),
      deliveryDate: addDays(7),
      returnDate: addDays(8),
      status: "draft",
      depositAmount: "600",
      depositStatus: "not paid",
      notes: "Draft booking to show setup/planning.",
      items: [["chairs", 40, 0, 0, 0, 0, 0], ["tables", 10, 0, 0, 0, 0, 0], ["uprights", 12, 0, 0, 0, 0, 0], ["crossbars", 10, 0, 0, 0, 0, 0], ["colorado1", 1, 0, 0, 0, 0, 0]],
    },
    {
      key: "brightHallAwards",
      client: clients.brighthall,
      eventName: "BrightHall Awards Night",
      startDate: addDays(-5),
      endDate: addDays(-1),
      deliveryDate: addDays(-5),
      returnDate: addDays(-1),
      status: "out",
      depositAmount: "1300",
      depositStatus: "held",
      notes: "Overdue return demo booking.",
      items: [["display2", 1, 1, 1, 0, 0, 0], ["jbl3", 1, 1, 1, 0, 0, 0], ["jbl4", 1, 1, 1, 0, 0, 0], ["mixer2", 1, 1, 1, 0, 0, 0], ["hdmi", 4, 4, 4, 0, 0, 0]],
    },
  ] as const

  const bookingRecords: Record<string, typeof schema.bookings.$inferSelect> = {}
  for (const b of bookings) {
    const [booking] = await db.insert(schema.bookings).values({ tenantId: tenant.id, clientId: b.client.id, eventName: b.eventName, startDate: b.startDate, endDate: b.endDate, deliveryDate: b.deliveryDate, returnDate: b.returnDate, status: b.status, depositAmount: b.depositAmount, depositStatus: b.depositStatus, notes: b.notes }).returning()
    bookingRecords[b.key] = booking
    for (const item of b.items) {
      const [assetKey, booked, packed, checkedOut, returned, damaged, missing] = item
      await db.insert(schema.bookingItems).values({ bookingId: booking.id, assetId: assets[assetKey].id, quantityBooked: booked, quantityPacked: packed, quantityCheckedOut: checkedOut, quantityReturned: returned, quantityDamaged: damaged, quantityMissing: missing })
      if (checkedOut > 0) {
        await db.insert(schema.assetMovements).values({ tenantId: tenant.id, assetId: assets[assetKey].id, bookingId: booking.id, movementType: "checked_out", fromStatus: "available", toStatus: "checked_out", quantity: checkedOut, performedBy: "Tom Wallace", notes: `Packed and dispatched for ${b.eventName}` })
      }
      if (returned > 0) {
        await db.insert(schema.assetMovements).values({ tenantId: tenant.id, assetId: assets[assetKey].id, bookingId: booking.id, movementType: "returned_good", fromStatus: "checked_out", toStatus: "available", quantity: returned, performedBy: "Nina Brooks", notes: `Returned good from ${b.eventName}` })
      }
      if (damaged > 0) {
        await db.insert(schema.assetMovements).values({ tenantId: tenant.id, assetId: assets[assetKey].id, bookingId: booking.id, movementType: "returned_damaged", fromStatus: "checked_out", toStatus: "damaged", quantity: damaged, performedBy: "Nina Brooks", notes: `Reported damaged after ${b.eventName}` })
      }
      if (missing > 0) {
        await db.insert(schema.assetMovements).values({ tenantId: tenant.id, assetId: assets[assetKey].id, bookingId: booking.id, movementType: "returned_missing", fromStatus: "checked_out", toStatus: "missing", quantity: missing, performedBy: "Nina Brooks", notes: `Reported missing after ${b.eventName}` })
      }
    }
    await db.insert(schema.bookingLinks).values({ tenantId: tenant.id, bookingId: booking.id, linkType: "pick", token: randomUUID(), expiresAt: plusDaysDate(14) })
    await db.insert(schema.bookingLinks).values({ tenantId: tenant.id, bookingId: booking.id, linkType: "return", token: randomUUID(), expiresAt: plusDaysDate(14) })
  }

  await db.insert(schema.damageReports).values([
    { tenantId: tenant.id, assetId: assets.screen10.id, bookingId: bookingRecords.baysideLaunch.id, clientId: clients.bayside.id, photoUrl: damagePhoto("Cracked screen corner"), description: "Cracked lower corner found during return check. Screen should stay blocked until repaired.", repairCost: "180", depositImpact: "Deduct from held deposit if client accepts report.", status: "pending", reportedBy: "Nina Brooks" },
    { tenantId: tenant.id, assetId: assets.adj1.id, bookingId: bookingRecords.baysideLaunch.id, clientId: clients.bayside.id, photoUrl: damagePhoto("Bent light bracket"), description: "Mounting bracket bent. Needs repair bench inspection before next job.", repairCost: "95", depositImpact: "Owner to review before client refund.", status: "pending", reportedBy: "Nina Brooks" },
  ])

  console.log("LoadLoop demo data created")
  console.log("Login: demo@apexav.com / Demo1234!")
  console.log("Tenant: Apex AV Rentals")
  console.log(`Assets: ${Object.keys(assets).length}`)
  console.log(`Clients: ${Object.keys(clients).length}`)
  console.log(`Bookings: ${Object.keys(bookingRecords).length}`)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})

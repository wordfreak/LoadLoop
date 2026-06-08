import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { randomUUID } from "crypto"
import { hash } from "bcryptjs"
import * as schema from "../lib/db/schema"

async function seed() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set")
    process.exit(1)
  }

  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema })

  console.log("Creating tenant...")
  const [tenant] = await db
    .insert(schema.tenants)
    .values({
      slug: "apex-av",
      name: "Apex AV Rentals",
      currency: "USD",
    })
    .returning()

  console.log("Creating admin user...")
  const passwordHash = await hash("Demo1234!", 12)
  const [user] = await db
    .insert(schema.users)
    .values({
      tenantId: tenant.id,
      email: "demo@apexav.com",
      passwordHash,
      name: "Marcus Reeves",
      role: "owner",
    })
    .returning()

  console.log("Creating categories...")
  const categoryNames = [
    "Projectors",
    "Screens",
    "Audio",
    "Lighting",
    "Cables",
    "Cases",
    "Staging",
    "Furniture",
    "Video",
  ]
  const categoryMap: Record<string, number> = {}
  for (const name of categoryNames) {
    const [cat] = await db
      .insert(schema.categories)
      .values({ tenantId: tenant.id, name, slug: name.toLowerCase().replace(/\s+/g, "-") })
      .returning()
    categoryMap[name] = cat.id
  }

  console.log("Creating locations...")
  const locationNames = [
    { name: "Main Warehouse", type: "warehouse" },
    { name: "Van 1", type: "vehicle" },
    { name: "Van 2", type: "vehicle" },
    { name: "Repair Bench", type: "repair" },
  ]
  const locationMap: Record<string, number> = {}
  for (const loc of locationNames) {
    const [l] = await db
      .insert(schema.locations)
      .values({ tenantId: tenant.id, name: loc.name, type: loc.type })
      .returning()
    locationMap[loc.name] = l.id
  }

  console.log("Creating assets...")
  const assetList = [
    { name: "Sony VPL-PHZ10 Projector", category: "Projectors", location: "Main Warehouse", value: 3500, serial: "SN-PHZ10-001", status: "available", qty: 1 },
    { name: "Epson PowerLite L610U Projector", category: "Projectors", location: "Main Warehouse", value: 2400, serial: "SN-L610U-002", status: "available", qty: 1 },
    { name: "Panasonic PT-RZ570 Projector", category: "Projectors", location: "Main Warehouse", value: 4800, serial: "SN-RZ570-003", status: "checked_out", qty: 1 },
    { name: "Da-Lite 10' Fast-Fold Screen", category: "Screens", location: "Main Warehouse", value: 850, serial: "SN-DL10-001", status: "damaged", qty: 1 },
    { name: "Da-Lite 8' Fast-Fold Screen", category: "Screens", location: "Main Warehouse", value: 620, serial: "SN-DL8-002", status: "available", qty: 1 },
    { name: "Elite Screens 120\" Portable", category: "Screens", location: "Main Warehouse", value: 450, serial: "SN-EL120-001", status: "checked_out", qty: 1 },
    { name: "JBL EON615 Speaker", category: "Audio", location: "Main Warehouse", value: 600, serial: "SN-EON615-001", status: "available", qty: 1 },
    { name: "JBL EON615 Speaker", category: "Audio", location: "Main Warehouse", value: 600, serial: "SN-EON615-002", status: "available", qty: 1 },
    { name: "JBL EON615 Speaker", category: "Audio", location: "Main Warehouse", value: 600, serial: "SN-EON615-003", status: "checked_out", qty: 1 },
    { name: "JBL EON615 Speaker", category: "Audio", location: "Main Warehouse", value: 600, serial: "SN-EON615-004", status: "checked_out", qty: 1 },
    { name: "Shure ULXD24 Wireless Mic Kit", category: "Audio", location: "Main Warehouse", value: 1800, serial: "SN-ULXD24-001", status: "available", qty: 1 },
    { name: "Shure ULXD24 Wireless Mic Kit", category: "Audio", location: "Main Warehouse", value: 1800, serial: "SN-ULXD24-002", status: "checked_out", qty: 1 },
    { name: "Sennheiser EW-D Lavalier Kit", category: "Audio", location: "Main Warehouse", value: 750, serial: "SN-EWD-001", status: "available", qty: 1 },
    { name: "Yamaha MG10XU Mixer", category: "Audio", location: "Main Warehouse", value: 280, serial: "SN-MG10XU-001", status: "available", qty: 1 },
    { name: "Yamaha MG10XU Mixer", category: "Audio", location: "Main Warehouse", value: 280, serial: "SN-MG10XU-002", status: "checked_out", qty: 1 },
    { name: "Chauvet Rogue R2 Spot", category: "Lighting", location: "Main Warehouse", value: 1200, serial: "SN-R2-001", status: "available", qty: 1 },
    { name: "Chauvet Rogue R2 Spot", category: "Lighting", location: "Main Warehouse", value: 1200, serial: "SN-R2-002", status: "available", qty: 1 },
    { name: "ADJ Focus Spot 4Z", category: "Lighting", location: "Main Warehouse", value: 380, serial: "SN-FS4Z-001", status: "damaged", qty: 1 },
    { name: "ADJ Focus Spot 4Z", category: "Lighting", location: "Main Warehouse", value: 380, serial: "SN-FS4Z-002", status: "available", qty: 1 },
    { name: "Chauvet COLORado 1-Quad", category: "Lighting", location: "Main Warehouse", value: 450, serial: "SN-COL1Q-001", status: "available", qty: 1 },
    { name: "Chauvet COLORado 1-Quad", category: "Lighting", location: "Main Warehouse", value: 450, serial: "SN-COL1Q-002", status: "available", qty: 1 },
    { name: "Road Case - Projector", category: "Cases", location: "Main Warehouse", value: 320, serial: "SN-CASE-PJ-001", status: "available", qty: 1 },
    { name: "Road Case - Projector", category: "Cases", location: "Main Warehouse", value: 320, serial: "SN-CASE-PJ-002", status: "checked_out", qty: 1 },
    { name: "Pelican 1550 Case - Mic Kit", category: "Cases", location: "Main Warehouse", value: 180, serial: "SN-PEL-001", status: "available", qty: 1 },
    { name: "Pelican 1550 Case - Mic Kit", category: "Cases", location: "Main Warehouse", value: 180, serial: "SN-PEL-002", status: "checked_out", qty: 1 },
    { name: "Pipe and Drape Upright", category: "Staging", location: "Main Warehouse", value: 45, serial: null, status: "available", qty: 12 },
    { name: "Pipe and Drape Crossbar", category: "Staging", location: "Main Warehouse", value: 35, serial: null, status: "available", qty: 10 },
    { name: "6ft Banquet Table", category: "Furniture", location: "Main Warehouse", value: 75, serial: null, status: "available", qty: 8 },
    { name: "Folding Chair (Black)", category: "Furniture", location: "Main Warehouse", value: 22, serial: null, status: "available", qty: 40 },
    { name: "XLR Cable 25ft", category: "Cables", location: "Main Warehouse", value: 25, serial: null, status: "available", qty: 30 },
    { name: "HDMI Cable 50ft", category: "Cables", location: "Main Warehouse", value: 45, serial: null, status: "available", qty: 15 },
    { name: "Power Extension 25ft", category: "Cables", location: "Main Warehouse", value: 30, serial: null, status: "available", qty: 20 },
    { name: "Speaker Stand", category: "Audio", location: "Main Warehouse", value: 85, serial: null, status: "available", qty: 4 },
    { name: "Lighting Stand T-Bar", category: "Lighting", location: "Main Warehouse", value: 110, serial: null, status: "available", qty: 3 },
    { name: "Projector Tripod Stand", category: "Projectors", location: "Main Warehouse", value: 95, serial: null, status: "available", qty: 3 },
    { name: "Cable Case A", category: "Cases", location: "Main Warehouse", value: 150, serial: "SN-CASE-CA-001", status: "available", qty: 1 },
    { name: "Cable Case B", category: "Cases", location: "Main Warehouse", value: 150, serial: "SN-CASE-CB-001", status: "available", qty: 1 },
    { name: "Lighting Accessories Tub", category: "Cases", location: "Main Warehouse", value: 200, serial: "SN-CASE-LA-001", status: "available", qty: 1 },
    { name: "Samsung 55\" Commercial Display", category: "Video", location: "Main Warehouse", value: 1200, serial: "SN-SAM55-001", status: "available", qty: 1 },
    { name: "Samsung 55\" Commercial Display", category: "Video", location: "Main Warehouse", value: 1200, serial: "SN-SAM55-002", status: "checked_out", qty: 1 },
  ]

  const assetRecords: Array<{ id: number; qrToken: string; name: string; value: number | null; status: string }> = []
  for (const a of assetList) {
    const qrToken = randomUUID()
    const [asset] = await db
      .insert(schema.assets)
      .values({
        tenantId: tenant.id,
        categoryId: categoryMap[a.category] ?? null,
        locationId: locationMap[a.location] ?? null,
        name: a.name,
        serialNumber: a.serial,
        qrToken,
        value: a.value != null ? String(a.value) : null,
        status: a.status,
        quantity: a.qty,
        isBulk: a.qty > 1,
      })
      .returning()
    assetRecords.push({ id: asset.id, qrToken, name: a.name, value: a.value, status: a.status })

    await db.insert(schema.assetMovements).values({
      tenantId: tenant.id,
      assetId: asset.id,
      movementType: "created",
      toStatus: a.status as typeof schema.assets.$inferSelect.status,
      quantity: a.qty,
      performedBy: "Marcus Reeves",
    })
  }

  console.log(`Created ${assetRecords.length} assets`)

  console.log("Creating clients...")
  const clientList = [
    { name: "TechConf Inc.", email: "events@techconf.io", phone: "415-555-0101", notes: "Annual tech conference. Good payer, always books 2-3 weeks ahead." },
    { name: "Meridian Events", email: "info@meridian.co", phone: "415-555-0202", notes: "Wedding and corporate events. Sometimes slow on returns." },
    { name: "Bayside Productions", email: "hello@bayside.media", phone: "415-555-0303", notes: "Video production company. Frequently rents lighting and audio." },
  ]
  const clientRecords: Array<{ id: number; name: string }> = []
  for (const c of clientList) {
    const [client] = await db
      .insert(schema.clients)
      .values({
        tenantId: tenant.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        notes: c.notes,
      })
      .returning()
    clientRecords.push(client)
  }

  console.log("Creating bookings...")
  const today = new Date()
  const addDays = (d: Date, n: number) => {
    const r = new Date(d)
    r.setDate(r.getDate() + n)
    return r.toISOString().split("T")[0]
  }
  const todayStr = today.toISOString().split("T")[0]

  const bookingDefs = [
    {
      clientId: clientRecords[0].id,
      eventName: "TechConf 2026",
      startDate: addDays(today, -3),
      endDate: addDays(today, 2),
      deliveryDate: addDays(today, -3),
      returnDate: addDays(today, -1),
      status: "out",
      depositAmount: 2000,
      depositStatus: "held",
      notes: "Main stage AV. Overdue — call client.",
      assetItems: [
        { name: "Panasonic PT-RZ570 Projector", qty: 1 },
        { name: "Elite Screens 120\" Portable", qty: 1 },
        { name: "JBL EON615 Speaker", qty: 1, idx: 3 },
        { name: "JBL EON615 Speaker", qty: 1, idx: 4 },
        { name: "Shure ULXD24 Wireless Mic Kit", qty: 1, idx: 2 },
        { name: "Yamaha MG10XU Mixer", qty: 1, idx: 2 },
        { name: "Road Case - Projector", qty: 1, idx: 2 },
        { name: "Pelican 1550 Case - Mic Kit", qty: 1, idx: 2 },
        { name: "Samsung 55\" Commercial Display", qty: 1, idx: 2 },
        { name: "XLR Cable 25ft", qty: 10 },
        { name: "HDMI Cable 50ft", qty: 4 },
        { name: "Power Extension 25ft", qty: 6 },
      ],
    },
    {
      clientId: clientRecords[1].id,
      eventName: "Meridian Gala Dinner",
      startDate: addDays(today, -6),
      endDate: addDays(today, -4),
      deliveryDate: addDays(today, -7),
      returnDate: addDays(today, -5),
      status: "returned",
      depositAmount: 1500,
      depositStatus: "refunded",
      notes: "Screen returned with crack. Damage report filed.",
      assetItems: [
        { name: "Da-Lite 10' Fast-Fold Screen", qty: 1 },
        { name: "Sony VPL-PHZ10 Projector", qty: 1 },
        { name: "JBL EON615 Speaker", qty: 2 },
        { name: "ADJ Focus Spot 4Z", qty: 1 },
        { name: "XLR Cable 25ft", qty: 8 },
      ],
    },
    {
      clientId: clientRecords[2].id,
      eventName: "Bayside Video Shoot",
      startDate: addDays(today, 1),
      endDate: addDays(today, 1),
      deliveryDate: todayStr,
      returnDate: addDays(today, 1),
      status: "confirmed",
      depositAmount: 800,
      depositStatus: "pending",
      notes: "Single-day shoot. Needs projector and lighting.",
      assetItems: [
        { name: "Epson PowerLite L610U Projector", qty: 1 },
        { name: "Chauvet Rogue R2 Spot", qty: 2 },
        { name: "Chauvet COLORado 1-Quad", qty: 2 },
        { name: "Projector Tripod Stand", qty: 1 },
        { name: "Lighting Stand T-Bar", qty: 2 },
        { name: "XLR Cable 25ft", qty: 4 },
        { name: "Power Extension 25ft", qty: 3 },
      ],
    },
    {
      clientId: clientRecords[0].id,
      eventName: "TechConf Workshop Day",
      startDate: addDays(today, 4),
      endDate: addDays(today, 5),
      deliveryDate: addDays(today, 3),
      returnDate: addDays(today, 5),
      status: "confirmed",
      depositAmount: 1000,
      depositStatus: "pending",
      notes: "Breakout rooms. 2 rooms, 2 setups.",
      assetItems: [
        { name: "Samsung 55\" Commercial Display", qty: 1 },
        { name: "JBL EON615 Speaker", qty: 2 },
        { name: "Shure ULXD24 Wireless Mic Kit", qty: 1 },
        { name: "Sennheiser EW-D Lavalier Kit", qty: 1 },
        { name: "6ft Banquet Table", qty: 4 },
        { name: "Folding Chair (Black)", qty: 16 },
        { name: "Pipe and Drape Upright", qty: 6 },
        { name: "Pipe and Drape Crossbar", qty: 4 },
      ],
    },
    {
      clientId: clientRecords[1].id,
      eventName: "Meridian Summer Party",
      startDate: addDays(today, 10),
      endDate: addDays(today, 10),
      deliveryDate: addDays(today, 9),
      returnDate: addDays(today, 11),
      status: "draft",
      depositAmount: 500,
      depositStatus: "pending",
      notes: "Outdoor party. Still finalizing equipment needs.",
      assetItems: [
        { name: "JBL EON615 Speaker", qty: 4 },
        { name: "Yamaha MG10XU Mixer", qty: 1 },
        { name: "Speaker Stand", qty: 4 },
        { name: "XLR Cable 25ft", qty: 8 },
        { name: "Power Extension 25ft", qty: 4 },
      ],
    },
  ]

  const nameCounter = new Map<string, number>()

  function pickAsset(name: string): typeof assetRecords[number] | undefined {
    const count = nameCounter.get(name) ?? 0
    const matching = assetRecords.filter((a) => a.name === name)
    const asset = matching[count]
    if (asset) {
      nameCounter.set(name, count + 1)
    }
    return asset
  }

  const bookingRecords = []
  for (const bDef of bookingDefs) {
    const [booking] = await db
      .insert(schema.bookings)
      .values({
        tenantId: tenant.id,
        clientId: bDef.clientId,
        eventName: bDef.eventName,
        startDate: bDef.startDate,
        endDate: bDef.endDate,
        deliveryDate: bDef.deliveryDate,
        returnDate: bDef.returnDate,
        status: bDef.status as typeof schema.bookings.$inferSelect.status,
        depositAmount: bDef.depositAmount != null ? String(bDef.depositAmount) : null,
        depositStatus: bDef.depositStatus,
        notes: bDef.notes,
      })
      .returning()
    bookingRecords.push(booking)

    for (const item of bDef.assetItems) {
      const asset = pickAsset(item.name)
      if (!asset) {
        console.warn(`Asset not found: ${item.name}`)
        continue
      }

      await db.insert(schema.bookingItems).values({
        bookingId: booking.id,
        assetId: asset.id,
        quantityBooked: item.qty,
      })
    }
  }

  console.log(`Created ${bookingRecords.length} bookings`)

  console.log("Creating damage reports...")
  const damagedScreen = assetRecords.find((a) => a.name === "Da-Lite 10' Fast-Fold Screen")
  const damagedLight = assetRecords.find((a) => a.name === "ADJ Focus Spot 4Z")

  if (damagedScreen) {
    await db.insert(schema.damageReports).values({
      tenantId: tenant.id,
      assetId: damagedScreen.id,
      bookingId: bookingRecords[1].id,
      clientId: clientRecords[1].id,
      photoUrl: "https://picsum.photos/seed/damage1/600/400",
      description: "Cracked corner panel on the 10' Fast-Fold screen. Approximately 3-inch crack on bottom right.",
      repairCost: "180",
      depositImpact: "charged_to_client",
      status: "charged_to_client",
      reportedBy: "Marcus Reeves",
    })
  }

  if (damagedLight) {
    await db.insert(schema.damageReports).values({
      tenantId: tenant.id,
      assetId: damagedLight.id,
      photoUrl: "https://picsum.photos/seed/damage2/600/400",
      description: "Housing dented. Internal optics may be misaligned. Needs bench inspection.",
      repairCost: "95",
      status: "repair_in_progress",
      reportedBy: "Tom",
    })
  }

  console.log("Creating booking links...")
  for (let i = 0; i < bookingRecords.length; i++) {
    const booking = bookingRecords[i]
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 14)

    await db.insert(schema.bookingLinks).values({
      tenantId: tenant.id,
      bookingId: booking.id,
      linkType: "pick",
      token: randomUUID(),
      expiresAt,
    })

    await db.insert(schema.bookingLinks).values({
      tenantId: tenant.id,
      bookingId: booking.id,
      linkType: "return",
      token: randomUUID(),
      expiresAt,
    })
  }

  console.log("\nSeed complete!")
  console.log("=" .repeat(40))
  console.log("Login: demo@apexav.com / Demo1234!")
  console.log(`Assets: ${assetRecords.length}`)
  console.log(`Clients: ${clientRecords.length}`)
  console.log(`Bookings: ${bookingRecords.length}`)
  console.log(`Overdue bookings: 1 (TechConf 2026)`)
  console.log(`Damaged items: 2 (Da-Lite 10' Screen, ADJ Focus Spot)`)
  console.log(`Value at risk: ~$14,200`)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})

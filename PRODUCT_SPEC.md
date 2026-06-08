# LoadLoop — Product Specification

**LoadLoop is a 48-hour done-for-you equipment control system, not SaaS rental software.**

## Positioning

"Send me your equipment list. In 48 hours, I'll give you a working system where your team can pack jobs from a phone link, check items out, check them back in, report damage with photos, and you can see what is out, overdue, damaged, and blocked."

## Target Customer

- 1–15 staff event / AV / trade show / party rental companies
- $100k–$800k annual revenue
- $50k–$500k inventory value
- Currently using: spreadsheets + WhatsApp + memory + paper packing lists
- They decline work every season because of chaos, not lack of demand

## The Real Pain Points

1. Owner doesn't know what went out, came back, or is damaged
2. Warehouse staff waste 25+ minutes hunting for missing gear
3. Double-bookings discovered too late
4. Damage disputes lost because there's no photo evidence
5. Deposits refunded to avoid arguments — real loss
6. Staff won't use systems that require accounts and passwords

## Non-Negotiable Week 1 Features

1. **Owner Dashboard** — 6 counters + needs-action + going-out-this-week
2. **Asset Register** — searchable, filterable, photo + QR + movement timeline
3. **Booking Creation** — client, dates, assets with conflict detection
4. **Booking Conflict Detection** — date-range overlap check on serialized assets
5. **Mobile Picking List** — tap items (high-value / bulk), QR labels generated and ready for future scanning
6. **WhatsApp Booking Links** — no-login links for staff, valid for booking duration + 3 days
7. **Check-Out Flow** — per-item confirm loaded, optional condition photo
8. **Check-In / Return Flow** — Good / Damaged / Missing / Needs Inspection
9. **Damage Report** — photo required, repair cost, linked to asset + booking
10. **Damaged Item Blocking** — automatic block from future bookings until resolved
11. **Bulk Quantity Items** — tracked by count, not individual QR codes
12. **High-Value / Case QR Logic** — individual QR on items >$150, QR on cases, no QR on sub-$30 items
13. **Seed Demo Data** — realistic company with 40 assets, 5 bookings, demo credentials
14. **End-to-End Demo Flow** — booking → picking → check-out → check-in → damage → dashboard update

## The Demo Story (2.5 minutes)

1. Owner opens dashboard, sees 4 overdue, $14.2k value at risk, 2 damaged blocked
2. Creates a booking, system catches double-booking conflict
3. Generates picking list → WhatsApp link to warehouse guy
4. Phone: tap items, tick boxes, see progress bar
5. Return day: tap Good × 3, tap Damaged on screen → photo → "cracked corner"
6. Dashboard updates: damage report, asset blocked, value at risk recalculated

## Tech Stack

- **Framework:** Next.js 14 App Router, TypeScript strict
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** Neon Postgres + Drizzle ORM
- **Auth:** NextAuth.js v5 (credentials: email/password for owners)
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **CSV:** Papa Parse
- **QR Generation:** qrcode
- **QR Scanning:** @zxing/browser
- **Images:** Cloudinary
- **PDF:** @react-pdf/renderer (v2)
- **Email:** Resend (v2)
- **Hosting:** Vercel (demo phase)

## What NOT To Build (v1)

- Invoicing / billing
- Crew scheduling
- Maintenance scheduling
- GPS tracking
- Client-facing portal
- PDF contracts
- Advanced analytics
- Multi-currency
- Complex permissions (owner vs staff is enough)
- Automated emails (except overdue notice, v2)

## Code Rules

- No comments in source code
- No forced photo flows except damage reports and missing items
- Every QR scan workflow has a manual tap fallback (scan OR tap, never scan only)
- Staff booking link flows work with zero login, zero account creation
- Multi-tenant isolation on every database query
- Environment validation at startup (app refuses to start with missing vars)
- Performance-first: dashboard loads under 1 second, O(1) QR lookups, batched CSV imports

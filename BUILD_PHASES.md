# LoadLoop — Build Phases

## Milestone 1: Foundation
- [x] .gitignore
- [x] .env.example
- [x] PRODUCT_SPEC.md
- [x] BUILD_PHASES.md
- [ ] LICENSES.md
- [ ] SECURITY.md
- [ ] Next.js 14 scaffold (App Router, TypeScript strict, Tailwind)
- [ ] Drizzle ORM + database connection + env validation
- [ ] shadcn/ui installation
- [ ] NextAuth.js v5 setup (credentials provider)
- [ ] Multi-tenant middleware
- [ ] Basic layout (sidebar + header)

## Milestone 2: Database + Auth
- [ ] Full Drizzle schema (tenants, users, clients, categories, locations, assets, bookings, booking_items, asset_movements, damage_reports, booking_links)
- [ ] Database indexes
- [ ] Authentication flow (login, logout, session)
- [ ] Tenant isolation on all queries
- [ ] Seed script structure

## Milestone 3: Core Features
- [ ] Asset CRUD with Cloudinary photo upload
- [ ] Client CRUD
- [ ] Category management
- [ ] Location management
- [ ] Booking creation with date-range conflict detection
- [ ] booking_items table (individual + bulk quantities)
- [ ] Asset movements (append-only log on every status change)
- [ ] QR token generation per asset + QR PNG endpoint

## Milestone 4: Demo Workflows
- [ ] Owner Dashboard (6 counters + needs-action + going-out-this-week)
- [ ] Asset Register (search, filter, TanStack Table)
- [ ] Booking detail page with asset list
- [ ] Booking link generation (pick + return, UUID token)
- [ ] Mobile Picking List page (public, no-login link)
- [ ] QR scanning with ZXing + manual tap fallback
- [ ] Check-Out workflow (per-item confirm, optional condition photo)
- [ ] Check-In / Return workflow (Good / Damaged / Missing / Needs Inspection)
- [ ] Damage report form (photo required, repair cost, auto-block)
- [ ] "Mark All Good" bulk action
- [ ] Asset blocking when damaged (automatic)
- [ ] Movement history timeline on asset detail

## Milestone 5: Polish + Deploy
- [ ] Seed script (40 assets, 5 bookings, realistic demo data)
- [ ] CSV asset import (preview → map → confirm)
- [ ] CSV export (ZIP download)
- [ ] Bulk item quantity tracking
- [ ] Overdue detection
- [ ] Vercel deployment
- [ ] End-to-end demo verification

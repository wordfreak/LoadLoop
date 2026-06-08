# LoadLoop — Build Phases

## Milestone 1: Foundation ✅
- [x] .gitignore
- [x] .env.example
- [x] PRODUCT_SPEC.md
- [x] BUILD_PHASES.md
- [x] LICENSES.md
- [x] SECURITY.md
- [x] Next.js 16 scaffold (App Router, TypeScript strict, Tailwind)
- [x] Drizzle ORM + database connection + env validation
- [x] shadcn/ui installation
- [x] NextAuth.js v5 setup (credentials provider)
- [x] Multi-tenant middleware
- [x] Basic layout (sidebar + header)

## Milestone 2: Database + Auth ✅
- [x] Full Drizzle schema (10 tables)
- [x] Database indexes on critical query paths
- [x] Authentication flow (login, logout, session)
- [x] Tenant isolation utility
- [x] Seed script structure

## Milestone 3: Core Features ✅
- [x] Asset CRUD actions (create, update, status transitions)
- [x] Client CRUD
- [x] Booking creation with date-range conflict detection
- [x] booking_items table (individual + bulk quantities)
- [x] Asset movements (append-only log, state machine validation)
- [x] QR token generation per asset + QR PNG endpoint
- [x] Damage report creation with auto-block

## Milestone 4: Demo Workflows ✅
- [x] Owner Dashboard (6 counters + needs-action + going-out-this-week)
- [x] Asset Register (search, filter, TanStack Table)
- [x] Asset Detail page (photo, fields, movement timeline, damage history)
- [x] Booking Detail page (client, items, deposit, link generation)
- [x] Booking link generation (pick + return, UUID token, WhatsApp copy)
- [x] Mobile Picking List page (public, no-login, name entry, high-value + bulk)
- [x] Check-In / Return workflow (Good / Damaged / Missing / Needs Inspection)
- [x] Damage report form (photo required, repair cost, auto-block)
- [x] "Mark All Good" / "Mark All Packed" bulk actions
- [x] Asset blocking when damaged (automatic in damage report creation)
- [x] Movement history timeline on asset detail
- [x] Booking link copy button (WhatsApp-ready)
- [x] Clients page
- [x] Damage & Missing page

## Milestone 5: Polish + Deploy 🔜
- [x] Seed script (Apex AV, 40 assets, 5 bookings, 2 damage reports)
- [ ] CSV asset import (preview → map → confirm)
- [ ] CSV export (ZIP download)
- [ ] Overdue detection cron + email
- [ ] Vercel deployment
- [ ] End-to-end demo verification

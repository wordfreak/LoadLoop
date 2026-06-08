# LoadLoop — Build Phases

## Milestone 1: Foundation ✅
- [x] .gitignore, .env.example, PRODUCT_SPEC.md, BUILD_PHASES.md, LICENSES.md, SECURITY.md
- [x] Next.js 16 scaffold (App Router, TypeScript strict, Tailwind)
- [x] Drizzle ORM + database connection + env validation
- [x] shadcn/ui installation
- [x] NextAuth.js v5 setup (credentials provider)
- [x] Multi-tenant middleware (proxy.ts)
- [x] Basic layout (sidebar + header)

## Milestone 2: Database + Auth ✅
- [x] Full Drizzle schema (10 tables with indexes)
- [x] Authentication flow (login, logout, session)
- [x] Tenant isolation utility
- [x] Seed script structure

## Milestone 3: Core Features ✅
- [x] Asset CRUD actions with state machine validation
- [x] Client CRUD
- [x] Booking creation with date-range conflict detection
- [x] booking_items table (individual + bulk quantities)
- [x] Asset movements (append-only log)
- [x] QR token generation + PNG endpoint
- [x] Damage report creation with auto-block

## Milestone 4: Demo Workflows ✅
- [x] Owner Dashboard (6 counters + needs-action + going-out-this-week)
- [x] Asset Register (search, filter, TanStack Table)
- [x] Asset Detail (photo, timeline, damage history)
- [x] Booking Detail (client, items, deposit, links)
- [x] Booking link generation (pick + return, UUID tokens)
- [x] Mobile Picking List (public, no-login, persistence via server actions)
- [x] Return Check-In (Good/Damaged/Missing/Inspect, persistence via server actions)
- [x] Damage report from return flow
- [x] "Mark All Packed" / "Mark All Good" bulk actions
- [x] Asset auto-blocking when damaged
- [x] Movement history timeline
- [x] New Booking page with conflict detection UI
- [x] Staff links: server-side data fetching, sanitized props

## Milestone 5: Polish + Deploy ✅
- [x] Seed script (Apex AV, 40 assets, 5 bookings, 2 damage reports)
- [x] Vercel deployment (loadloop-omega.vercel.app)
- [x] Neon database configured + seeded
- [x] README.md with setup instructions
- [ ] CSV asset import (preview → map → confirm)
- [ ] CSV export (ZIP download)
- [ ] QR label sheet PDF
- [ ] Overdue detection + email notifications
- [ ] Demo video recording

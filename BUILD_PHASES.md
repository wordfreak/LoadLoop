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
- [x] Owner Dashboard (6 counters + needs-action + going-out-this-week, deduplicated)
- [x] Asset Register (search, filter, TanStack Table)
- [x] Asset Detail (photo, timeline, damage history)
- [x] Booking Detail (client, items, deposit, links, owner recovery actions)
- [x] Booking link generation (pick + return, UUID tokens)
- [x] Mobile Pack & Dispatch (public, no-login, token-secured, init from DB state)
- [x] Return Check-In (Good/Damaged/Missing/Inspect, token-secured, unchecked default)
- [x] Damage report from return flow with photo upload
- [x] "Mark All Packed" / "Mark All Good" bulk actions
- [x] Asset auto-blocking when damaged
- [x] Movement history timeline
- [x] New Booking page with conflict detection (individual + bulk with quantity input)
- [x] Staff links: server-side data fetching, sanitized props
- [x] Owner recovery: mark dispatched, mark all returned, correct status, late damage
- [x] DB transactions on workflow mutations

## Milestone 5: Polish + Deploy ✅
- [x] Seed script (Apex AV, 40 assets, 5 bookings, damage reports, idempotent)
- [x] Vercel deployment (loadloop-omega.vercel.app)
- [x] Neon database configured + seeded
- [x] README.md with setup instructions
- [x] CSV/TSV asset import (drag-drop, auto-map, preview, category, duplicate detection)
- [x] CSV export (assets, bookings, clients — Papa Parse escaping)
- [x] Sample CSV template download
- [x] Staff photo upload via `/api/job/[token]/upload` (Cloudinary-ready, base64 fallback)
- [x] File sizes under 450 lines
- [x] QR scanning in mobile workflow (pick + return, camera-based)
- [ ] Production QR label/found-item URL mode
- [ ] Cloudinary production photo storage (keys needed)
- [ ] Overdue detection email notifications
- [ ] Demo video recording

## Future: LoadLoop Assistant
- [ ] Owner daily briefing (rule-based summary of risks, overdue, damaged, missing)
- [ ] Booking summary (plain-English overview of a booking's status)
- [ ] WhatsApp message drafting for client follow-ups on damage/missing items
- [ ] Risk detection (flag items needing inspection, overdue returns, availability gaps)
- [ ] CSV column mapping assistance during import
- [ ] Read-only assistant — summarizes and suggests, never silently acts

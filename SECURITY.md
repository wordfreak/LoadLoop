# LoadLoop — Security

## Multi-Tenant Isolation

Every data table has a `tenant_id` column. The tenant context is derived from the authenticated user's session. Booking links are scoped by token — the token resolves to a booking, which belongs to a tenant via `booking.tenant_id`.

Known gaps (documented, not hidden):
- Some related queries load by ID without tenant re-verification (e.g., loading a category by ID after the parent asset was tenant-checked). This is defense-in-depth, not a current exploit path.
- Dashboard aggregate queries use SQL filters with tenant scoping.

## Authentication

- Owners and admins authenticate via email/password using NextAuth.js v5 (credentials provider)
- Passwords hashed with bcrypt (salt rounds: 12)
- Sessions use JWT strategy with HTTP-only, secure, same-site cookies
- CSRF protection handled by NextAuth.js

## Booking Links (Staff Access)

- Booking links use UUID v4 tokens
- Invalid or expired links block access to both pages and server actions
- Server actions validate token + expected link type (pick/return) before writing
- Staff enter only their first name (stored in localStorage, not persisted beyond session)
- No session, no account, no password required for staff
- **Note:** Tokens are stored as raw UUIDs in the database. For production deployment, tokens should be stored as hashes (SHA-256) with raw tokens only in URLs. This is documented as a known v1 limitation.

## Damage Photos

- Staff damage photos upload via `POST /api/job/[token]/upload`, a token-scoped public endpoint
- If Cloudinary env vars are configured, photos upload to Cloudinary CDN with auto-optimization and tenant-scoped folders
- If Cloudinary is not configured, photos are stored as base64 data URLs (demo mode only)
- The authenticated `/api/upload` route serves owner/admin asset photo uploads (currently base64, Cloudinary planned)

## Environment Variables

- All secrets in environment variables
- App validates required variabless at database connection time
- `.env` files are gitignored
- `.env.example` lists all required variables with dummy values

## Known Limitations (v1 demo)

- No rate limiting on login, upload, or server actions
- No brute-force protection on credentials
- CSV import processes files without row-level sandboxing beyond tenant scope
- Excel parsing (xlsx) has a known prototype pollution advisory (CVE-2023-30533); only accessible to authenticated admins
- Staff links are reusable until expiry; no single-use enforcement
- `usedBy` on booking links is updated on return completion only, not on first open

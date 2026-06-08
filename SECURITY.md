# LoadLoop — Security

## Multi-Tenant Isolation

Every database query is scoped to the current tenant via a `tenantId` column on all data tables. The tenant context is derived from the authenticated user's session. No raw SQL queries bypass the tenant filter. Booking links are scoped by token — the token resolves to a booking, which belongs to a tenant.

## Authentication

- Owners and admins authenticate via email/password using NextAuth.js v5 with the credentials provider
- Passwords are hashed with bcrypt (salt rounds: 12)
- Sessions use JWT strategy with HTTP-only, secure, same-site cookies
- CSRF protection is handled by NextAuth.js

## Booking Links (Staff Access)

- Booking links use UUID v4 tokens, not JWTs
- Links are valid only for the booking's delivery date through return date + 3 days
- Tokens are not secrets — they grant access only to the specific booking's picking/return workflow
- Staff enter only their first name (stored in localStorage, not persisted server-side)
- No session, no account, no password

## Environment Variables

- All secrets are stored in environment variables
- App validates required environment variables at startup and refuses to start if any are missing
- `.env` files are gitignored
- `.env.example` lists all required variables with dummy values

## Data Handling

- No client data is shared between tenants
- File uploads go to Cloudinary with tenant-scoped folders
- CSV imports are processed server-side
- API routes validate input with Zod schemas before any database operation

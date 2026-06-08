# LoadLoop

48-hour equipment control system for small AV, event, and rental teams.

Turn a messy equipment spreadsheet into a working system: mobile packing lists, check-in/check-out, damage reports with photo evidence, and an owner dashboard — all in 48 hours.

## Demo

**Live:** [loadloop-omega.vercel.app](https://loadloop-omega.vercel.app)
**Login:** `demo@apexav.com` / `Demo1234!`

## Local Setup

```bash
npm install
cp .env.example .env
# Fill in your DATABASE_URL, NEXTAUTH_SECRET, etc.
npm run db:push
npm run db:seed
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Drizzle Studio |

## Environment Variables

| Variable | Required |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) |
| `NEXTAUTH_SECRET` | Session encryption key |
| `NEXTAUTH_URL` | App URL (http://localhost:3000 for dev) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `CLOUDINARY_CLOUD_NAME` | Optional — for photo uploads |
| `CLOUDINARY_API_KEY` | Optional |
| `CLOUDINARY_API_SECRET` | Optional |
| `RESEND_API_KEY` | Optional — for email notifications |

## Tech Stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4 + shadcn/ui
- Drizzle ORM + Neon Postgres
- NextAuth.js v5
- TanStack Table
- React Hook Form + Zod
- QR Code generation

## License

All dependencies are MIT, Apache-2.0, or ISC licensed. See LICENSES.md.

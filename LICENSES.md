# LoadLoop — Open Source Licenses

| Package | License | Notes |
|---|---|---|
| next | MIT | Framework |
| react / react-dom | MIT | UI library |
| typescript | Apache-2.0 | Language |
| tailwindcss | MIT | CSS framework |
| @tailwindcss/postcss | MIT | Tailwind v4 PostCSS plugin |
| drizzle-orm | Apache-2.0 | ORM |
| drizzle-kit | MIT | Schema management |
| @neondatabase/serverless | MIT | Postgres driver |
| next-auth | ISC | Authentication |
| bcryptjs | MIT | Password hashing |
| zod | MIT | Schema validation |
| react-hook-form | MIT | Form state management |
| @hookform/resolvers | MIT | Form resolver |
| @tanstack/react-table | MIT | Table component |
| papaparse | MIT | CSV parsing |
| qrcode | MIT | QR code generation |
| cloudinary | MIT | Image hosting (planned) |
| lucide-react | ISC | Icons |
| sonner | MIT | Toast notifications |
| next-themes | MIT | Theme management |
| xlsx | Apache-2.0 | Excel/Spreadsheet parsing |
| tsx | MIT | TypeScript executor (dev) |
| eslint | MIT | Linter (dev) |
| eslint-config-next | MIT | Next.js ESLint config |
| vercel | Apache-2.0 | Deployment CLI (dev tool, not runtime dep) |

## Vulnerability Notes

`xlsx` (SheetJS) v0.18.5 has a known prototype pollution advisory (CVE-2023-30533) with no fix available. This package is used for Excel/Spreadsheet file parsing during CSV import and is only accessible to authenticated admin users. The risk is limited to:
- Processing of user-uploaded Excel files by authenticated admins
- No external exposure through public pages or staff links

Mitigation: file size limits, image-only validation on upload routes, and a migration path to alternative parsers if CVE is resolved or a maintained fork becomes available.

All core dependencies (Next.js, Drizzle, NextAuth, React, Tailwind, shadcn/ui) are MIT, Apache-2.0, or ISC licensed. No GPL/AGPL code is used in the application layer.

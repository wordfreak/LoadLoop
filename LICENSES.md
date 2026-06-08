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
| tsx | MIT | TypeScript executor (dev) |
| eslint | MIT | Linter (dev) |
| eslint-config-next | MIT | Next.js ESLint config |

## Vulnerability Notes

All core dependencies (Next.js, Drizzle, NextAuth, React, Tailwind, shadcn/ui) are MIT, Apache-2.0, or ISC licensed. No GPL/AGPL code is used in the application layer.

CSV import uses Papa Parse (MIT) for parsing. Only CSV/TSV formats are supported. Excel support was removed to eliminate a known prototype pollution vulnerability in the xlsx package.

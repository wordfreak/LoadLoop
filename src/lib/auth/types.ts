import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface User {
    tenantId: number
    role: string
  }
  interface Session {
    user: {
      tenantId: number
      role: string
    } & DefaultSession["user"]
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    tenantId: number
    role: string
  }
}

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { eq } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { users } from "@/lib/db/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string
          password: string
        }
        const db = getDatabase()
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1)
        if (!user) return null
        const validPassword = await compare(password, user.passwordHash)
        if (!validPassword) return null
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenantId = user.tenantId
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.tenantId = token.tenantId
        session.user.role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})

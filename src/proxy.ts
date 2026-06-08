import { auth } from "@/lib/auth/config"
import { NextResponse } from "next/server"

const proxy = auth((req) => {
  const { pathname } = req.nextUrl

  const publicPaths = ["/login", "/j/", "/api/auth/", "/api/qr"]
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  if (req.auth && pathname === "/login") {
    const homeUrl = new URL("/", req.url)
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
})

export { proxy }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}

import { NextResponse } from "next/server"
import { eq, and, gt } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { bookingLinks } from "@/lib/db/schema"

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const db = getDatabase()

    const [link] = await db
      .select()
      .from(bookingLinks)
      .where(
        and(
          eq(bookingLinks.token, token),
          eq(bookingLinks.linkType, "return"),
          gt(bookingLinks.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!link) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and HEIC images are accepted" },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File must be under 10MB" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({ url: dataUrl })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

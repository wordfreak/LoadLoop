import { NextResponse } from "next/server"
import { eq, and, gt } from "drizzle-orm"
import { getDatabase } from "@/lib/db"
import { bookingLinks } from "@/lib/db/schema"

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

async function uploadToCloudinary(
  base64Data: string,
  tenantId: number
): Promise<string> {
  const cloudinary = (await import("cloudinary")).v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const result = await cloudinary.uploader.upload(base64Data, {
    folder: `loadloop/tenant_${tenantId}/damage`,
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  })

  return result.secure_url
}

function hasCloudinary(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

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

    if (hasCloudinary()) {
      try {
        const cloudUrl = await uploadToCloudinary(dataUrl, link.tenantId)
        return NextResponse.json({ url: cloudUrl })
      } catch {
        return NextResponse.json({ url: dataUrl })
      }
    }

    return NextResponse.json({ url: dataUrl })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

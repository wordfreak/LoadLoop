import { NextResponse } from "next/server"
import { auth } from "@/lib/auth/config"

const MAX_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]

function hasCloudinary(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

async function uploadToCloudinary(base64Data: string): Promise<string> {
  const cloudinary = (await import("cloudinary")).v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "loadloop/assets",
    resource_type: "image",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  })

  return result.secure_url
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only images accepted" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    if (hasCloudinary()) {
      const cloudUrl = await uploadToCloudinary(dataUrl)
      return NextResponse.json({ url: cloudUrl })
    }

    return NextResponse.json({ url: dataUrl })
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

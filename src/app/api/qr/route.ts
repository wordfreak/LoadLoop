import QRCode from "qrcode"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const size = parseInt(searchParams.get("size") ?? "200", 10)

  if (!token) {
    return new Response("Missing token parameter", { status: 400 })
  }

  const png = await QRCode.toBuffer(token, {
    width: Math.min(Math.max(size, 100), 600),
    margin: 2,
    type: "png",
  })

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

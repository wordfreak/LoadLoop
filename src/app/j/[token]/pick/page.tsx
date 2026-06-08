import { notFound } from "next/navigation"
import { getBookingForLink } from "@/features/bookings/links"
import { PickingListClient } from "./picking-list"

export default async function PickPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getBookingForLink(token)

  if (!data) notFound()

  const sanitizedItems = data.items.map((item) => ({
    id: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetPhotoUrl: item.assetPhotoUrl,
    assetQrToken: item.assetQrToken,
    quantityBooked: item.quantityBooked,
    quantityPacked: item.quantityPacked,
    isHighValue: item.isHighValue,
  }))

  return (
    <PickingListClient
      token={token}
      bookingEventName={data.booking.eventName}
      bookingStatus={data.booking.status}
      clientName={data.client?.name ?? null}
      items={sanitizedItems}
    />
  )
}

import { notFound } from "next/navigation"
import { getBookingForLink } from "@/features/bookings/links"
import { PickingListClient } from "./picking-list"

export default async function PickPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getBookingForLink(token, "pick")

  if (!data) notFound()

  const sanitizedItems = data.items.map((item) => ({
    id: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetPhotoUrl: item.assetPhotoUrl,
    assetQrToken: item.assetQrToken,
    quantityBooked: item.quantityBooked,
    quantityPacked: item.quantityPacked,
    quantityCheckedOut: item.quantityCheckedOut,
    isHighValue: item.isHighValue,
  }))

  const allCheckedOut = data.items.every(
    (item) => item.quantityCheckedOut >= item.quantityBooked
  )
  const someCheckedOut = data.items.some(
    (item) => item.quantityCheckedOut > 0
  )

  return (
    <PickingListClient
      token={token}
      bookingEventName={data.booking.eventName}
      bookingStatus={data.booking.status}
      bookingDeliveryDate={data.booking.deliveryDate}
      bookingReturnDate={data.booking.returnDate}
      clientName={data.client?.name ?? null}
      items={sanitizedItems}
      alreadyDispatched={allCheckedOut}
      partiallyDispatched={someCheckedOut && !allCheckedOut}
    />
  )
}

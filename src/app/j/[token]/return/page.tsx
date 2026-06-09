import { notFound } from "next/navigation"
import { getBookingForLink } from "@/features/bookings/links"
import { ReturnCheckInClient } from "./return-check-in"

export default async function ReturnPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const data = await getBookingForLink(token, "return")

  if (!data) notFound()

  const sanitizedItems = data.items.map((item) => ({
    id: item.id,
    assetId: item.assetId,
    assetName: item.assetName,
    assetQrToken: item.assetQrToken,
    quantityBooked: item.quantityBooked,
    quantityReturned: item.quantityReturned,
    quantityDamaged: item.quantityDamaged,
    quantityMissing: item.quantityMissing,
    isHighValue: item.isHighValue,
  }))

  return (
    <ReturnCheckInClient
      token={token}
      bookingEventName={data.booking.eventName}
      bookingStatus={data.booking.status}
      bookingDeliveryDate={data.booking.deliveryDate}
      bookingReturnDate={data.booking.returnDate}
      items={sanitizedItems}
    />
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ownerMarkDispatched,
  ownerMarkAllReturnedGood,
} from "@/features/bookings/owner-actions"
import { toast } from "sonner"
import { Truck, RotateCcw } from "lucide-react"

export function OwnerActions({
  bookingId,
  bookingStatus,
}: {
  bookingId: number
  bookingStatus: string
}) {
  const [dispatching, setDispatching] = useState(false)
  const [returning, setReturning] = useState(false)

  async function handleMarkDispatched() {
    setDispatching(true)
    try {
      await ownerMarkDispatched(bookingId)
      toast.success("Booking marked as dispatched")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark as dispatched"
      )
    } finally {
      setDispatching(false)
    }
  }

  async function handleMarkAllReturned() {
    setReturning(true)
    try {
      await ownerMarkAllReturnedGood(bookingId)
      toast.success("All items marked as returned good")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark as returned"
      )
    } finally {
      setReturning(false)
    }
  }

  const showDispatch =
    bookingStatus === "confirmed" || bookingStatus === "packed"
  const showReturn = bookingStatus === "out"

  if (!showDispatch && !showReturn) return null

  return (
    <div className="flex flex-wrap gap-3">
      {showDispatch && (
        <Button
          variant="outline"
          onClick={handleMarkDispatched}
          disabled={dispatching}
          className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
        >
          <Truck className="h-4 w-4" />
          {dispatching ? "Updating..." : "Mark as Dispatched"}
        </Button>
      )}
      {showReturn && (
        <Button
          variant="outline"
          onClick={handleMarkAllReturned}
          disabled={returning}
          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <RotateCcw className="h-4 w-4" />
          {returning ? "Updating..." : "Mark All Returned Good"}
        </Button>
      )}
    </div>
  )
}

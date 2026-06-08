"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, Package } from "lucide-react"
import { confirmPackedItems } from "@/features/bookings/workflow-actions"
import { toast } from "sonner"

type ItemProps = {
  id: number
  assetId: number
  assetName: string
  assetPhotoUrl: string | null
  assetQrToken: string | null
  quantityBooked: number
  quantityPacked: number
  isHighValue: boolean
}

export function PickingListClient({
  token,
  bookingEventName,
  bookingStatus,
  clientName,
  items,
}: {
  token: string
  bookingEventName: string
  bookingStatus: string
  clientName: string | null
  items: ItemProps[]
}) {
  const [staffName, setStaffName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("staff_name") ?? ""
    }
    return ""
  })
  const [nameEntered, setNameEntered] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("staff_name")
    }
    return false
  })
  const [packedItems, setPackedItems] = useState<Set<number>>(new Set())
  const [submitting, setSubmitting] = useState(false)

  const highValueItems = items.filter((i) => i.isHighValue)
  const bulkItems = items.filter((i) => !i.isHighValue)
  const totalItems = items.length
  const confirmedCount = packedItems.size

  function toggleItem(id: number) {
    setPackedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (staffName.trim()) {
      localStorage.setItem("staff_name", staffName.trim())
      setNameEntered(true)
    }
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await confirmPackedItems(
        token,
        Array.from(packedItems),
        staffName
      )
      toast.success("Items confirmed as packed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to confirm"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!nameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <form
          onSubmit={handleNameSubmit}
          className="w-full max-w-sm space-y-4"
        >
          <div className="text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground" />
            <h1 className="text-xl font-semibold mt-2">Picking List</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {bookingEventName}
            </p>
          </div>
          <Input
            placeholder="Enter your first name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="sticky top-0 bg-background border-b p-4 space-y-2 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{bookingEventName}</h1>
            <p className="text-sm text-muted-foreground">{clientName}</p>
          </div>
          <Badge>{bookingStatus}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>
            {confirmedCount} of {totalItems} confirmed
          </span>
          <span className="text-muted-foreground">{staffName}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{
              width: `${totalItems > 0 ? (confirmedCount / totalItems) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {highValueItems.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              High-Value Items
            </h2>
            <div className="space-y-2">
              {highValueItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                    packedItems.has(item.id)
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-background hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      packedItems.has(item.id)
                        ? "bg-emerald-500 text-white"
                        : "bg-muted"
                    }`}
                  >
                    {packedItems.has(item.id) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {item.quantityBooked}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.assetName}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Qty: {item.quantityBooked}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {bulkItems.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Bulk Items
            </h2>
            <div className="space-y-2">
              {bulkItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border bg-background p-3"
                >
                  <Checkbox
                    checked={packedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.assetName}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ×{item.quantityBooked}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const allIds = items.map((i) => i.id)
              setPackedItems(new Set(allIds))
            }}
          >
            Mark All Packed
          </Button>
          <Button
            className="flex-1"
            disabled={submitting || confirmedCount === 0}
            onClick={handleConfirm}
          >
            {submitting ? "Saving..." : "Confirm & Continue"}
          </Button>
        </div>
      </div>
    </div>
  )
}

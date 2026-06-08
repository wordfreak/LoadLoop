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
  quantityCheckedOut: number
  isHighValue: boolean
}

export function PickingListClient({
  token,
  bookingEventName,
  bookingStatus,
  clientName,
  items,
  alreadyDispatched,
  partiallyDispatched,
}: {
  token: string
  bookingEventName: string
  bookingStatus: string
  clientName: string | null
  items: ItemProps[]
  alreadyDispatched: boolean
  partiallyDispatched: boolean
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
  const [packedItems, setPackedItems] = useState<Set<number>>(() => {
    const initial = new Set<number>()
    for (const item of items) {
      if (item.quantityCheckedOut >= item.quantityBooked) {
        initial.add(item.id)
      }
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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
      await confirmPackedItems(token, Array.from(packedItems), staffName)
      setSubmitted(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm")
    } finally {
      setSubmitting(false)
    }
  }

  if (alreadyDispatched) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 animate-slide-up">
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Check className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-semibold text-sidebar-foreground">
            Already Dispatched
          </h1>
          <p className="text-sm text-sidebar-foreground/60">
            All items for {bookingEventName} have been packed and dispatched.
          </p>
        </div>
      </div>
    )
  }

  if (partiallyDispatched) {
    const remainingItems = items.filter(
      (item) => item.quantityCheckedOut < item.quantityBooked
    )
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-sidebar-border p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                {bookingEventName}
              </h1>
              <p className="text-sm text-sidebar-foreground/60">{clientName}</p>
            </div>
            <Badge variant="secondary">{bookingStatus}</Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-300">
              Partially Dispatched
            </p>
            <p className="text-xs text-amber-400/80 mt-1">
              Some items already checked out. Confirm the remaining items.
            </p>
          </div>
          {remainingItems.map((item) => (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all active:scale-[0.98] ${
                packedItems.has(item.id)
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-sidebar-border bg-background-accent/30 hover:bg-background-accent/50"
              }`}
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  packedItems.has(item.id)
                    ? "bg-emerald-500 text-white"
                    : "bg-background-accent text-sidebar-foreground/40"
                }`}
              >
                {packedItems.has(item.id) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-xs">{item.quantityBooked}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {item.assetName}
                </p>
              </div>
              <span className="text-xs text-sidebar-foreground/40">
                Qty: {item.quantityBooked}
              </span>
            </button>
          ))}
        </div>
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-sidebar-border p-4">
          <Button
            className="w-full h-12 rounded-xl font-medium"
            disabled={submitting || packedItems.size === 0}
            onClick={handleConfirm}
          >
            {submitting ? "Saving..." : "Confirm Remaining Packed & Out"}
          </Button>
        </div>
      </div>
    )
  }

  if (!nameEntered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form onSubmit={handleNameSubmit} className="w-full max-w-sm space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-background-primary/20 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-sidebar-primary" />
            </div>
            <h1 className="text-xl font-semibold text-sidebar-foreground">
              Pack &amp; Dispatch
            </h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1">
              {bookingEventName}
            </p>
          </div>
          <Input
            placeholder="Enter your first name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            className="h-12 bg-background-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 rounded-xl"
            required
          />
          <Button type="submit" className="w-full h-12 rounded-xl font-medium">
            Continue
          </Button>
        </form>
      </div>
    )
  }

  const renderItem = (item: ItemProps) => (
    <button
      key={item.id}
      onClick={() => toggleItem(item.id)}
      className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-all active:scale-[0.98] ${
        packedItems.has(item.id)
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-sidebar-border bg-background-accent/30 hover:bg-background-accent/50"
      }`}
    >
      <div
        className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
          packedItems.has(item.id)
            ? "bg-emerald-500 text-white"
            : "bg-background-accent text-sidebar-foreground/40"
        }`}
      >
        {packedItems.has(item.id) ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="text-xs">{item.quantityBooked}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground truncate">
          {item.assetName}
        </p>
        {item.isHighValue && (
          <p className="text-xs text-sidebar-foreground/40 mt-0.5">High value</p>
        )}
      </div>
      <span className="text-xs text-sidebar-foreground/40">
        Qty: {item.quantityBooked}
      </span>
    </button>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-sidebar-border p-4 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              {bookingEventName}
            </h1>
            <p className="text-sm text-sidebar-foreground/60">{clientName}</p>
          </div>
          <Badge variant="secondary">{bookingStatus}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-sidebar-foreground/80">
            {confirmedCount} of {totalItems} confirmed
          </span>
          <span className="text-sidebar-foreground/50">{staffName}</span>
        </div>
        <div className="h-1.5 bg-background-accent rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{
              width: `${totalItems > 0 ? (confirmedCount / totalItems) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {highValueItems.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3 px-1">
              High-Value Items
            </h2>
            <div className="space-y-2">
              {highValueItems.map(renderItem)}
            </div>
          </section>
        )}

        {bulkItems.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-3 px-1">
              Bulk Items
            </h2>
            <div className="space-y-2">
              {bulkItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-sidebar-border bg-background-accent/30 p-4"
                >
                  <Checkbox
                    checked={packedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-sidebar-foreground">
                      {item.assetName}
                    </p>
                  </div>
                  <span className="text-sm text-sidebar-foreground/40">
                    ×{item.quantityBooked}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-sidebar-border p-4 space-y-3">
        {submitted ? (
          <div className="text-center space-y-3 py-2 animate-slide-up">
            <div className="mx-auto h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-sidebar-foreground">
                Pack &amp; Dispatch Complete
              </p>
              <p className="text-sm text-sidebar-foreground/60 mt-0.5">
                {confirmedCount} items packed and out
              </p>
              <p className="text-xs text-sidebar-foreground/40 mt-1">
                Submitted by {staffName}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl border-sidebar-border text-sidebar-foreground/70 hover:bg-background-accent hover:text-sidebar-foreground"
              onClick={() => {
                const allIds = items.map((i) => i.id)
                setPackedItems(new Set(allIds))
              }}
            >
              Mark All Packed
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl font-medium"
              disabled={submitting || confirmedCount === 0}
              onClick={handleConfirm}
            >
              {submitting ? "Saving..." : "Confirm Packed & Out"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

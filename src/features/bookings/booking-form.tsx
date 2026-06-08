"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBooking, detectBookingConflicts } from "@/features/bookings/actions"
import { toast } from "sonner"
import { X, AlertTriangle } from "lucide-react"

type ClientOption = { id: number; name: string }
type AssetOption = { id: number; name: string; isBulk: boolean }
type BookingConflict = {
  assetId: number
  assetName: string
  conflictBookingId: number
  conflictEventName: string
  conflictStartDate: string
  conflictEndDate: string
}

export function NewBookingForm({
  tenantId,
  clients,
  assets,
}: {
  tenantId: number
  clients: ClientOption[]
  assets: AssetOption[]
}) {
  const router = useRouter()
  const [clientId, setClientId] = useState("")
  const [eventName, setEventName] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<number[]>([])
  const [conflicts, setConflicts] = useState<BookingConflict[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (selectedAssets.length === 0 || !startDate || !endDate) {
      return
    }

    let cancelled = false

    async function check() {
      try {
        const result = await detectBookingConflicts(
          selectedAssets,
          startDate,
          endDate,
          tenantId
        )
        if (!cancelled) setConflicts(result)
      } catch {
        if (!cancelled) setConflicts([])
      }
    }
    check()

    return () => {
      cancelled = true
    }
  }, [selectedAssets, startDate, endDate, tenantId])

  function toggleAsset(assetId: number) {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((id) => id !== assetId)
        : [...prev, assetId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const items = selectedAssets.map((assetId) => ({
        assetId,
        quantityBooked: 1,
      }))

      const result = await createBooking({
        clientId: parseInt(clientId),
        eventName,
        startDate,
        endDate,
        deliveryDate: deliveryDate || undefined,
        returnDate: returnDate || undefined,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        notes: notes || undefined,
        items,
      })

      if (result && "error" in result) {
        setConflicts(result.conflicts ?? [])
        toast.error(
          `${result.conflicts?.length ?? 0} item(s) already booked on these dates`
        )
        return
      }

      toast.success("Booking created")
      router.push("/bookings")
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create booking"
      )
    } finally {
      setSubmitting(false)
    }
  }

  const availableAssets = assets

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">New Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a new equipment booking for a client
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client & Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. TechConf 2026"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit Amount (USD)</Label>
              <Input
                id="deposit"
                type="number"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedAssets.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedAssets.map((id) => {
                  const asset = assets.find((a) => a.id === id)
                  return (
                    <Badge
                      key={id}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => toggleAsset(id)}
                    >
                      {asset?.name ?? id}
                      <X className="h-3 w-3" />
                    </Badge>
                  )
                })}
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    {conflicts.length} item(s) already booked on these dates
                  </p>
                </div>
                <div className="mt-2 space-y-1">
                  {conflicts.map((c) => (
                    <p key={c.assetId} className="text-xs text-amber-600">
                      {c.assetName} — booked for {c.conflictEventName} (
                      {c.conflictStartDate} to {c.conflictEndDate})
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-1">
              {availableAssets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => toggleAsset(asset.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedAssets.includes(asset.id)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  {asset.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={
            submitting ||
            !clientId ||
            !eventName ||
            !startDate ||
            !endDate ||
            selectedAssets.length === 0
          }
        >
          {submitting ? "Creating..." : "Create Booking"}
        </Button>
      </form>
    </div>
  )
}

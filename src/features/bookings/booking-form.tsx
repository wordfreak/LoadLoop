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
import { createBooking, detectBookingConflicts, createClient } from "@/features/bookings/actions"
import { toast } from "sonner"
import { X, AlertTriangle, Search } from "lucide-react"

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

type BulkShortage = {
  assetId: number
  assetName: string
  totalQuantity: number
  alreadyBooked: number
  requested: number
  available: number
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
  const [newClientName, setNewClientName] = useState("")
  const [addingClient, setAddingClient] = useState(false)
  const [eventName, setEventName] = useState("")
  const [deliveryDate, setDeliveryDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Map<number, number>>(new Map())
  const [conflicts, setConflicts] = useState<BookingConflict[]>([])
  const [shortages, setShortages] = useState<BulkShortage[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [assetSearch, setAssetSearch] = useState("")

  useEffect(() => {
    if (selectedAssets.size === 0 || !deliveryDate || !returnDate) return

    let cancelled = false
    const assetIds = Array.from(selectedAssets.keys())

    async function check() {
      try {
        const result = await detectBookingConflicts(assetIds, deliveryDate, returnDate, tenantId, selectedAssets)
        if (!cancelled) {
          setConflicts(result.conflicts)
          setShortages(result.shortages)
        }
      } catch {
        if (!cancelled) { setConflicts([]); setShortages([]) }
      }
    }
    check()
    return () => { cancelled = true }
  }, [selectedAssets, deliveryDate, returnDate, tenantId])

  function toggleAsset(assetId: number) {
    setSelectedAssets((prev) => {
      const next = new Map(prev)
      if (next.has(assetId)) next.delete(assetId)
      else next.set(assetId, 1)
      return next
    })
  }

  function setAssetQuantity(assetId: number, qty: number) {
    setSelectedAssets((prev) => {
      const next = new Map(prev)
      if (qty < 1) next.delete(assetId)
      else next.set(assetId, qty)
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const resolvedClientId = addingClient
        ? (await createClient({ name: newClientName.trim() })).id
        : parseInt(clientId)

      const items = Array.from(selectedAssets.entries()).map(([assetId, qty]) => ({
        assetId,
        quantityBooked: qty,
      }))

      const result = await createBooking({
        clientId: resolvedClientId,
        eventName,
        startDate: deliveryDate,
        endDate: returnDate,
        deliveryDate,
        returnDate,
        depositAmount: depositAmount ? parseFloat(depositAmount) : undefined,
        notes: notes || undefined,
        items,
      })

      if (result && "error" in result) {
        setConflicts((result as { conflicts: BookingConflict[] }).conflicts ?? [])
        toast.error(`${(result as { conflicts: BookingConflict[] }).conflicts?.length ?? 0} item(s) already booked on these dates`)
        return
      }

      toast.success("Booking created")
      router.push(`/bookings/${result.booking.id}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create booking")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAssets = assets.filter(
    (a) => !assetSearch || a.name.toLowerCase().includes(assetSearch.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">New Booking</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new equipment booking</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Client & Event</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <div className="flex gap-2">
                <Select value={clientId} onValueChange={(v) => { setClientId(v ?? ""); setAddingClient(false) }} disabled={addingClient}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => { setClientId(""); setAddingClient(true) }}>
                  + New
                </Button>
              </div>
              {addingClient && (
                <div className="flex gap-2">
                  <Input placeholder="New client name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} autoFocus />
                  <Button type="button" variant="outline" size="sm" onClick={() => setAddingClient(false)}>Cancel</Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input id="eventName" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Meridian Gala" required />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <p className="text-xs text-muted-foreground">When items leave the warehouse</p>
                <Input id="deliveryDate" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnDate">Return Date</Label>
                <p className="text-xs text-muted-foreground">When items come back</p>
                <Input id="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAssets.size > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {Array.from(selectedAssets.entries()).map(([id, qty]) => {
                  const asset = assets.find((a) => a.id === id)
                  return (
                    <div key={id} className="flex items-center gap-1">
                      <Badge variant="secondary" className="cursor-pointer gap-1 py-1.5 pl-3 pr-1.5" onClick={() => toggleAsset(id)}>
                        {asset?.name ?? id}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                      {asset?.isBulk && (
                        <input
                          type="number"
                          min="1"
                          value={qty}
                          onChange={(e) => setAssetQuantity(id, parseInt(e.target.value) || 1)}
                          className="w-16 h-7 text-xs border rounded px-1.5"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {shortages.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">{shortages.length} bulk shortage(s)</p>
                </div>
                <div className="mt-2 space-y-1">
                  {shortages.map((s) => (
                    <p key={s.assetId} className="text-xs text-red-600">
                      {s.assetName}: only {s.available} available ({s.alreadyBooked} already booked, {s.requested} requested)
                    </p>
                  ))}
                </div>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">{conflicts.length} item(s) already booked on these dates</p>
                </div>
                <div className="mt-2 space-y-1">
                  {conflicts.map((c) => (
                    <p key={c.assetId} className="text-xs text-amber-600">
                      {c.assetName} — booked for {c.conflictEventName} ({c.conflictStartDate} to {c.conflictEndDate})
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5 border rounded-md p-1">
                {filteredAssets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No equipment matches</p>
                ) : (
                  filteredAssets.map((asset) => {
                    const selected = selectedAssets.has(asset.id)
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => toggleAsset(asset.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between transition-colors ${
                          selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                        }`}
                      >
                        <span>{asset.name}</span>
                        <span className="text-xs text-muted-foreground">{asset.isBulk ? "Bulk" : selected ? "Added" : ""}</span>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (USD)</Label>
              <Input id="deposit" type="number" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requirements..." />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={
            submitting ||
            (!addingClient && !clientId) ||
            (addingClient && !newClientName.trim()) ||
            !eventName ||
            !deliveryDate ||
            !returnDate ||
            selectedAssets.size === 0
          }
        >
          {submitting ? "Creating..." : "Create Booking"}
        </Button>
      </form>
    </div>
  )
}

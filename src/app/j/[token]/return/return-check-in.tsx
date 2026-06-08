"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Check, AlertTriangle, X, HelpCircle } from "lucide-react"
import { completeReturnCheckIn } from "@/features/bookings/workflow-actions"
import { toast } from "sonner"

type ItemProps = {
  id: number
  assetId: number
  assetName: string
  quantityBooked: number
}

type ItemStateDetail = {
  state: "good" | "damaged" | "missing" | "needs_inspection"
  note?: string
  photoUrl?: string
}

type ItemStates = Record<number, ItemStateDetail>

export function ReturnCheckInClient({
  token,
  bookingEventName,
  bookingStatus,
  items,
}: {
  token: string
  bookingEventName: string
  bookingStatus: string
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
  const [itemStates, setItemStates] = useState<ItemStates>(() => {
    const initial: ItemStates = {}
    for (const item of items) {
      initial[item.id] = { state: "good" }
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)
  const [activeItem, setActiveItem] = useState<number | null>(null)
  const [damageNote, setDamageNote] = useState("")
  const [damagePhotoUrl, setDamagePhotoUrl] = useState("")

  function setItemState(
    id: number,
    state: "good" | "damaged" | "missing" | "needs_inspection"
  ) {
    if (state === "damaged" || state === "missing") {
      setActiveItem(id)
      setDamageNote("")
      setDamagePhotoUrl("")
      setItemStates((prev) => ({
        ...prev,
        [id]: { state, note: "", photoUrl: "" },
      }))
    } else {
      setActiveItem(null)
      setItemStates((prev) => ({
        ...prev,
        [id]: { state },
      }))
    }
  }

  function confirmDamage() {
    if (activeItem == null) return
    if (!damageNote.trim()) {
      toast.error("Please describe the damage")
      return
    }
    setItemStates((prev) => ({
      ...prev,
      [activeItem]: {
        state: prev[activeItem].state,
        note: damageNote.trim(),
        photoUrl: damagePhotoUrl.trim() || undefined,
      },
    }))
    setActiveItem(null)
  }

  function confirmMissing() {
    if (activeItem == null) return
    if (!damageNote.trim()) {
      toast.error("Please describe what happened")
      return
    }
    setItemStates((prev) => ({
      ...prev,
      [activeItem]: {
        state: prev[activeItem].state,
        note: damageNote.trim(),
      },
    }))
    setActiveItem(null)
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (staffName.trim()) {
      localStorage.setItem("staff_name", staffName.trim())
      setNameEntered(true)
    }
  }

  async function handleComplete() {
    setSubmitting(true)
    try {
      await completeReturnCheckIn(token, itemStates, staffName)
      toast.success("Return completed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete return"
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
            <h1 className="text-xl font-semibold">Return Check-In</h1>
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
            <p className="text-sm text-muted-foreground">Return Check-In</p>
          </div>
          <Badge>{bookingStatus}</Badge>
        </div>
        <div className="text-sm">
          {items.length} items
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {activeItem != null && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">
                {itemStates[activeItem].state === "damaged"
                  ? "Report Damage"
                  : "Report Missing"}
              </p>
              <Textarea
                placeholder={
                  itemStates[activeItem].state === "damaged"
                    ? "Describe the damage..."
                    : "Describe what happened..."
                }
                value={damageNote}
                onChange={(e) => setDamageNote(e.target.value)}
                rows={2}
              />
              {itemStates[activeItem].state === "damaged" && (
                <Input
                  placeholder="Photo URL (paste link)"
                  value={damagePhotoUrl}
                  onChange={(e) => setDamagePhotoUrl(e.target.value)}
                />
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={
                    itemStates[activeItem].state === "damaged"
                      ? confirmDamage
                      : confirmMissing
                  }
                >
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActiveItem(null)
                    setItemStates((prev) => ({
                      ...prev,
                      [activeItem]: { state: "good" },
                    }))
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {items.map((item) => {
          const itemState = itemStates[item.id]
          const isGood = itemState.state === "good"

          return (
            <Card key={item.id}>
              <CardContent className="p-3">
                <p className="text-sm font-medium mb-3">{item.assetName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={isGood ? "default" : "outline"}
                    size="sm"
                    className={`h-12 ${
                      isGood
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                    onClick={() => setItemState(item.id, "good")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Good
                  </Button>
                  <Button
                    variant={
                      itemState.state === "damaged" ? "default" : "outline"
                    }
                    size="sm"
                    className={`h-12 ${
                      itemState.state === "damaged"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                    }`}
                    onClick={() => setItemState(item.id, "damaged")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Damaged
                  </Button>
                  <Button
                    variant={
                      itemState.state === "missing" ? "default" : "outline"
                    }
                    size="sm"
                    className={`h-12 ${
                      itemState.state === "missing"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "border-red-200 text-red-700 hover:bg-red-50"
                    }`}
                    onClick={() => setItemState(item.id, "missing")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Missing
                  </Button>
                  <Button
                    variant={
                      itemState.state === "needs_inspection"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className={`h-12 ${
                      itemState.state === "needs_inspection"
                        ? "bg-gray-600 hover:bg-gray-700 text-white"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setItemState(item.id, "needs_inspection")}
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Inspect
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <Button
          className="w-full"
          disabled={submitting}
          onClick={handleComplete}
        >
          {submitting ? "Saving..." : "Complete Return"}
        </Button>
      </div>
    </div>
  )
}

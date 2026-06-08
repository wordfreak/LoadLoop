"use client"

import { useState, useEffect } from "react"
import { getBookingForLink } from "@/features/bookings/links"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Check, AlertTriangle, X, HelpCircle, Camera } from "lucide-react"

type BookingLinkData = NonNullable<
  Awaited<ReturnType<typeof getBookingForLink>>
>

type ItemState = "pending" | "good" | "damaged" | "missing" | "needs_inspection"
type ItemStates = Record<number, { state: ItemState; note?: string }>

export function ReturnCheckIn({ token }: { token: string }) {
  const [data, setData] = useState<BookingLinkData | null>(null)
  const [error, setError] = useState("")
  const [staffName, setStaffName] = useState("")
  const [nameEntered, setNameEntered] = useState(false)
  const [itemStates, setItemStates] = useState<ItemStates>({})

  useEffect(() => {
    async function load() {
      try {
        const result = await getBookingForLink(token)
        if (!result) {
          setError("Invalid or expired link")
          return
        }
        setData(result)

        const initial: ItemStates = {}
        for (const item of result.items) {
          initial[item.id] = { state: "pending" }
        }
        setItemStates(initial)
      } catch {
        setError("Failed to load booking")
      }
    }
    load()

    const savedName = localStorage.getItem("staff_name")
    if (savedName) {
      setStaffName(savedName)
      setNameEntered(true)
    }
  }, [token])

  function setItemState(id: number, state: ItemState) {
    setItemStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], state },
    }))
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (staffName.trim()) {
      localStorage.setItem("staff_name", staffName.trim())
      setNameEntered(true)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Contact your manager for a new link
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
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
              {data.booking.eventName}
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

  const { booking, items } = data
  const processed = items.filter(
    (i) => itemStates[i.id]?.state !== "pending"
  ).length

  return (
    <div className="min-h-screen bg-muted">
      <div className="sticky top-0 bg-background border-b p-4 space-y-2 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">{booking.eventName}</h1>
            <p className="text-sm text-muted-foreground">Return Check-In</p>
          </div>
          <Badge>{booking.status}</Badge>
        </div>
        <div className="text-sm">
          {processed} of {items.length} items checked
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{
              width: `${items.length > 0 ? (processed / items.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {items.map((item) => {
          const itemState = itemStates[item.id]

          if (itemState?.state !== "pending") {
            return (
              <div
                key={item.id}
                className="rounded-lg border p-3 flex items-center gap-3 opacity-60"
              >
                <div
                  className={`h-3 w-3 rounded-full flex-shrink-0 ${
                    itemState.state === "good"
                      ? "bg-emerald-500"
                      : itemState.state === "damaged"
                        ? "bg-amber-500"
                        : itemState.state === "missing"
                          ? "bg-red-500"
                          : "bg-gray-400"
                  }`}
                />
                <p className="text-sm flex-1">{item.assetName}</p>
                <span className="text-xs text-muted-foreground capitalize">
                  {itemState.state.replace(/_/g, " ")}
                </span>
              </div>
            )
          }

          return (
            <Card key={item.id}>
              <CardContent className="p-3">
                <p className="text-sm font-medium mb-3">{item.assetName}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    onClick={() => setItemState(item.id, "good")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Good
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 border-amber-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                    onClick={() => setItemState(item.id, "damaged")}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Damaged
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setItemState(item.id, "missing")}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Missing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-12 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800"
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
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const updated: ItemStates = {}
              for (const item of items) {
                updated[item.id] = itemStates[item.id]?.state === "pending"
                  ? { state: "good" }
                  : itemStates[item.id]
              }
              setItemStates(updated)
            }}
          >
            Mark All Good
          </Button>
          <Button className="flex-1">
            Complete Return
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Check,
  AlertTriangle,
  X,
  HelpCircle,
  Camera,
  Trash2,
} from "lucide-react"
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
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function setItemState(
    id: number,
    state: "good" | "damaged" | "missing" | "needs_inspection"
  ) {
    if (state === "good" || state === "needs_inspection") {
      setActiveItem(null)
      setDamageNote("")
      setDamagePhotoUrl("")
      setItemStates((prev) => ({
        ...prev,
        [id]: { state },
      }))
      return
    }

    setActiveItem(id)
    setDamageNote("")
    setDamagePhotoUrl("")
    setItemStates((prev) => ({
      ...prev,
      [id]: { state, note: "", photoUrl: "" },
    }))
  }

  async function handlePhotoUpload(file: File) {
    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", { method: "POST", body: formData })
      const result = await response.json()

      if (!response.ok) throw new Error(result.error ?? "Upload failed")
      setDamagePhotoUrl(result.url)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload photo"
      )
    } finally {
      setPhotoUploading(false)
    }
  }

  function confirmDamageOrMissing() {
    if (activeItem == null) return

    const currentState = itemStates[activeItem].state

    if (!damageNote.trim()) {
      toast.error(
        currentState === "damaged"
          ? "Please describe the damage"
          : "Please describe what happened"
      )
      return
    }

    if (currentState === "damaged" && damagePhotoUrl) {
      setItemStates((prev) => ({
        ...prev,
        [activeItem]: {
          state: "damaged",
          note: damageNote.trim(),
          photoUrl: damagePhotoUrl,
        },
      }))
      setActiveItem(null)
      setDamageNote("")
      setDamagePhotoUrl("")
    } else if (currentState === "damaged" && !damagePhotoUrl) {
      toast.error("A photo of the damage is required")
    } else {
      setItemStates((prev) => ({
        ...prev,
        [activeItem]: {
          state: "missing",
          note: damageNote.trim(),
        },
      }))
      setActiveItem(null)
      setDamageNote("")
      setDamagePhotoUrl("")
    }
  }

  function cancelDamageForm() {
    if (activeItem == null) return
    setItemStates((prev) => ({
      ...prev,
      [activeItem]: { state: "good" },
    }))
    setActiveItem(null)
    setDamageNote("")
    setDamagePhotoUrl("")
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (staffName.trim()) {
      localStorage.setItem("staff_name", staffName.trim())
      setNameEntered(true)
    }
  }

  async function handleComplete() {
    if (activeItem != null) {
      toast.error("Please confirm or cancel the damage form first")
      return
    }

    for (const item of items) {
      const state = itemStates[item.id]
      if (state.state === "damaged") {
        if (!state.note || state.note.trim().length === 0) {
          toast.error(`${item.assetName}: damage description is required`)
          return
        }
      }
      if (state.state === "missing") {
        if (!state.note || state.note.trim().length === 0) {
          toast.error(`${item.assetName}: missing item note is required`)
          return
        }
      }
    }

    setSubmitting(true)
    try {
      const cleaned = { ...itemStates }
      for (const [id, detail] of Object.entries(cleaned)) {
        if (detail.state === "damaged" && detail.photoUrl) {
          cleaned[Number(id)] = { ...detail }
        }
      }

      await completeReturnCheckIn(token, cleaned, staffName)
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
        <div className="text-sm">{items.length} items</div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {activeItem != null && (() => {
          const isDamage = itemStates[activeItem].state === "damaged"
          return (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium text-amber-800">
                  {isDamage ? "Report Damage" : "Report Missing"}
                </p>
                <Textarea
                  placeholder={
                    isDamage
                      ? "Describe the damage in detail..."
                      : "Describe what happened to this item..."
                  }
                  value={damageNote}
                  onChange={(e) => setDamageNote(e.target.value)}
                  rows={3}
                />
                {isDamage && (
                  <div className="space-y-2">
                    {damagePhotoUrl ? (
                      <div className="relative">
                        <img
                          src={damagePhotoUrl}
                          alt="Damage preview"
                          className="w-full max-h-48 rounded object-cover"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => setDamagePhotoUrl("")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-20 border-dashed gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={photoUploading}
                        >
                          <Camera className="h-5 w-5" />
                          {photoUploading ? "Uploading..." : "Take or Select Photo"}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handlePhotoUpload(file)
                          }}
                        />
                        <p className="text-xs text-muted-foreground text-center">
                          A photo is required for damage reports
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={confirmDamageOrMissing}>
                    Confirm
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelDamageForm}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        {items.map((item) => {
          const itemState = itemStates[item.id]
          const isGood = itemState.state === "good"

          return (
            <Card key={item.id}>
              <CardContent className="p-3">
                <p className="text-sm font-medium mb-3">
                  {item.assetName}
                  {itemState.state !== "good" &&
                    itemState.state !== "needs_inspection" && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {itemState.state === "damaged" &&
                          (itemState.note
                            ? `— ${itemState.note.slice(0, 40)}${itemState.note.length > 40 ? "..." : ""}`
                            : "— needs details")}
                        {itemState.state === "missing" &&
                          (itemState.note
                            ? `— ${itemState.note.slice(0, 40)}${itemState.note.length > 40 ? "..." : ""}`
                            : "— needs details")}
                      </span>
                    )}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={isGood ? "default" : "outline"}
                    size="sm"
                    className={`h-11 ${
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
                    className={`h-11 ${
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
                    className={`h-11 ${
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
                    className={`h-11 ${
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

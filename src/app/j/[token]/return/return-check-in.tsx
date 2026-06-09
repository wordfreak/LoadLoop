"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import { completeReturnCheckIn } from "@/features/bookings/workflow-actions"
import { toast } from "sonner"
import { DamageForm } from "./damage-form"
import { ReturnItemCard } from "./return-item-card"
import { QrScanner } from "@/features/qr/scanner"

type ItemProps = {
  id: number
  assetId: number
  assetName: string
  assetQrToken: string | null
  quantityBooked: number
  quantityReturned: number
  quantityDamaged: number
  quantityMissing: number
  isHighValue: boolean
}

type ItemStateDetail = {
  state: "unchecked" | "good" | "damaged" | "missing" | "needs_inspection"
  note?: string
  photoUrl?: string
  repairCost?: number
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
      if (item.quantityReturned >= item.quantityBooked) {
        initial[item.id] = { state: "good" }
      } else if (item.quantityDamaged > 0) {
        initial[item.id] = { state: "damaged" }
      } else if (item.quantityMissing > 0) {
        initial[item.id] = { state: "missing" }
      } else {
        initial[item.id] = { state: "unchecked" }
      }
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitResult, setSubmitResult] = useState({ good: 0, damaged: 0, missing: 0, inspection: 0 })
  const [scanning, setScanning] = useState(false)

  function handleQrScan(scannedToken: string) {
    const item = items.find((i) => i.assetQrToken === scannedToken)
    if (!item) {
      toast.error("QR code not found in this return")
      return
    }
    const current = itemStates[item.id]
    if (current && current.state !== "unchecked" && current.state !== "good") {
      toast.error(`${item.assetName} is already marked as ${current.state} — resolve first`)
      return
    }
    if (current?.state === "good") {
      toast(`${item.assetName} — already marked good`)
      return
    }
    setItemState(item.id, "good")
    toast.success(`${item.assetName} — marked as good`)
  }
  const [activeItem, setActiveItem] = useState<number | null>(null)
  const [damageNote, setDamageNote] = useState("")
  const [damagePhotoUrl, setDamagePhotoUrl] = useState("")
  const [repairCost, setRepairCost] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)

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
    setRepairCost("")
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

      const response = await fetch(`/api/job/${token}/upload`, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error ?? "Upload failed")
      }

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
          repairCost: repairCost ? parseFloat(repairCost) : undefined,
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
        [activeItem]: { state: "unchecked" },
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
      if (!state || state.state === "unchecked") {
        toast.error(`${item.assetName}: please mark as Good, Damaged, Missing, or Inspect`)
        return
      }
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
      const checked: Record<
        number,
        { state: "good" | "damaged" | "missing" | "needs_inspection"; note?: string; photoUrl?: string; repairCost?: number }
      > = {}

      for (const [id, detail] of Object.entries(itemStates)) {
        if (detail.state !== "unchecked") {
          checked[Number(id)] = {
            state: detail.state,
            note: detail.note,
            photoUrl: detail.photoUrl,
            repairCost: detail.repairCost,
          }
        }
      }

      await completeReturnCheckIn(token, checked, staffName)

      let good = 0
      let damaged = 0
      let missing = 0
      let inspection = 0
      for (const detail of Object.values(itemStates)) {
        if (detail.state === "good") good++
        else if (detail.state === "damaged") damaged++
        else if (detail.state === "missing") missing++
        else if (detail.state === "needs_inspection") inspection++
      }
      setSubmitResult({ good, damaged, missing, inspection })
      setSubmitted(true)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete return"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (bookingStatus === "returned") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="text-center space-y-3">
          <Check className="h-10 w-10 mx-auto text-emerald-600" />
          <h1 className="text-xl font-semibold">Return Completed</h1>
          <p className="text-sm text-muted-foreground">
            Return process completed
          </p>
        </div>
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

      <QrScanner onScan={handleQrScan} scanning={scanning} onToggle={() => setScanning((s) => !s)} />

      <div className="p-4 space-y-3 pb-24">
        {activeItem != null && (
          <DamageForm
            isDamage={itemStates[activeItem].state === "damaged"}
            note={damageNote}
            photoUrl={damagePhotoUrl}
            repairCost={repairCost}
            uploading={photoUploading}
            onNoteChange={setDamageNote}
            onRepairCostChange={setRepairCost}
            onPhotoSelect={handlePhotoUpload}
            onPhotoClear={() => setDamagePhotoUrl("")}
            onConfirm={confirmDamageOrMissing}
            onCancel={cancelDamageForm}
            assetName={
              items.find((i) => i.id === activeItem)?.assetName ?? ""
            }
          />
        )}

        {items.map((item) => (
          <ReturnItemCard
            key={item.id}
            itemId={item.id}
            assetName={item.assetName}
            itemState={
              itemStates[item.id] ?? { state: "unchecked" }
            }
            onSetState={setItemState}
          />
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <div className="flex items-center justify-center gap-3 text-emerald-700">
              <Check className="h-6 w-6" />
              <p className="text-lg font-semibold">Return Completed</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-emerald-50 p-2">Good: {submitResult.good}</div>
              <div className="rounded bg-amber-50 p-2">Damaged: {submitResult.damaged}</div>
              <div className="rounded bg-red-50 p-2">Missing: {submitResult.missing}</div>
              <div className="rounded bg-gray-100 p-2">Inspect: {submitResult.inspection}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted by {staffName}. Dashboard updated.
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const updated: ItemStates = {}
                for (const item of items) {
                  updated[item.id] = { state: "good" }
                }
                setItemStates(updated)
              }}
            >
              Mark All Good
            </Button>
            <Button
              className="flex-1"
              disabled={submitting}
              onClick={handleComplete}
            >
              {submitting ? "Saving..." : "Complete Return"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

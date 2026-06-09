"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ownerCorrectAssetStatus, ownerAddLateDamageReport } from "@/features/bookings/owner-actions"
import type { AssetStatus } from "@/features/assets/statuses"
import { toast } from "sonner"
import { Wrench, RotateCcw } from "lucide-react"

const STATUS_OPTIONS = [
  "available",
  "checked_out",
  "damaged",
  "missing",
  "needs_inspection",
  "retired",
]

export function OwnerAssetActions({
  assetId,
  currentStatus,
}: {
  assetId: number
  currentStatus: string
}) {
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [updating, setUpdating] = useState(false)
  const [showDamage, setShowDamage] = useState(false)
  const [damageDesc, setDamageDesc] = useState("")
  const [damagePhoto, setDamagePhoto] = useState("")
  const [damageCost, setDamageCost] = useState("")
  const [addingDamage, setAddingDamage] = useState(false)

  async function handleCorrect() {
    setUpdating(true)
    try {
      await ownerCorrectAssetStatus(assetId, newStatus as AssetStatus)
      toast.success("Status updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setUpdating(false)
    }
  }

  async function handleAddDamage() {
    if (!damageDesc.trim()) {
      toast.error("Description is required")
      return
    }
    setAddingDamage(true)
    try {
      await ownerAddLateDamageReport(
        assetId,
        null,
        damageDesc,
        damagePhoto || undefined,
        damageCost ? parseFloat(damageCost) : undefined
      )
      toast.success("Damage report added")
      setShowDamage(false)
      setDamageDesc("")
      setDamagePhoto("")
      setDamageCost("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add report")
    } finally {
      setAddingDamage(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <RotateCcw className="h-4 w-4" />
          Correct Status
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs">New Status</Label>
            <Select value={newStatus} onValueChange={(v) => v && setNewStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            onClick={handleCorrect}
            disabled={updating || newStatus === currentStatus}
          >
            {updating ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>

      {showDamage ? (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Wrench className="h-4 w-4" />
            Add Damage Report
          </div>
          <Textarea
            placeholder="Describe the damage..."
            value={damageDesc}
            onChange={(e) => setDamageDesc(e.target.value)}
            rows={2}
          />
          <Input
            placeholder="Photo URL (optional)"
            value={damagePhoto}
            onChange={(e) => setDamagePhoto(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Repair cost (optional)"
            value={damageCost}
            onChange={(e) => setDamageCost(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddDamage} disabled={addingDamage}>
              {addingDamage ? "Adding..." : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDamage(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDamage(true)}
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          Add Damage Report
        </Button>
      )}
    </div>
  )
}

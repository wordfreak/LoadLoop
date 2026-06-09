"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Trash2 } from "lucide-react"

type DamageFormProps = {
  isDamage: boolean
  note: string
  photoUrl: string
  repairCost: string
  uploading: boolean
  onNoteChange: (value: string) => void
  onRepairCostChange: (value: string) => void
  onPhotoSelect: (file: File) => void
  onPhotoClear: () => void
  onConfirm: () => void
  onCancel: () => void
  assetName: string
}

export function DamageForm({
  isDamage,
  note,
  photoUrl,
  repairCost,
  uploading,
  onNoteChange,
  onRepairCostChange,
  onPhotoSelect,
  onPhotoClear,
  onConfirm,
  onCancel,
  assetName,
}: DamageFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card className="border-amber-300 bg-amber-50">
      <CardContent className="p-4 space-y-3">
        <p className="text-sm font-medium text-amber-800">
          {isDamage ? `Report Damage: ${assetName}` : `Report Missing: ${assetName}`}
        </p>
        <Textarea
          placeholder={
            isDamage
              ? "Describe the damage in detail..."
              : "Describe what happened to this item..."
          }
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
        />
        {isDamage && (
          <>
            <Input
              type="number"
              min="0"
              placeholder="Estimated repair cost (optional)"
              value={repairCost}
              onChange={(e) => onRepairCostChange(e.target.value)}
            />
            <div className="space-y-2">
              {photoUrl ? (
                <div className="relative">
                  <img
                    src={photoUrl}
                    alt="Damage preview"
                    className="w-full max-h-48 rounded object-cover"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7"
                    onClick={onPhotoClear}
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
                    disabled={uploading}
                  >
                    <Camera className="h-5 w-5" />
                    {uploading ? "Uploading..." : "Take or Select Photo"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) onPhotoSelect(file)
                    }}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Take a photo of the damage
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        <div className="flex gap-2">
          <Button size="sm" onClick={onConfirm}>
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

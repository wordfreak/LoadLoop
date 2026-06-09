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
import { resolveDamageReport } from "@/features/damage/actions"
import { toast } from "sonner"

export function ResolveDamageButton({ reportId }: { reportId: number }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState("repaired")
  const [submitting, setSubmitting] = useState(false)

  async function handleResolve() {
    setSubmitting(true)
    try {
      await resolveDamageReport(reportId, { status })
      toast.success("Damage report resolved")
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve")
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Resolve
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(v) => v && setStatus(v)}>
        <SelectTrigger className="h-8 text-xs w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="repaired">Repaired</SelectItem>
          <SelectItem value="written_off">Written Off</SelectItem>
          <SelectItem value="disputed">Disputed</SelectItem>
        </SelectContent>
      </Select>
      <Button size="sm" onClick={handleResolve} disabled={submitting}>
        {submitting ? "..." : "OK"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </div>
  )
}

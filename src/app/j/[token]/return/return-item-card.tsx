"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, AlertTriangle, X, HelpCircle } from "lucide-react"

type ItemStateDetail = {
  state: "unchecked" | "good" | "damaged" | "missing" | "needs_inspection"
  note?: string
  photoUrl?: string
  repairCost?: number
}

export function ReturnItemCard({
  itemId,
  assetName,
  itemState,
  onSetState,
}: {
  itemId: number
  assetName: string
  itemState: ItemStateDetail
  onSetState: (
    id: number,
    state: "good" | "damaged" | "missing" | "needs_inspection"
  ) => void
}) {
  const isUnchecked = itemState.state === "unchecked"
  const isGood = itemState.state === "good"

  if (isUnchecked) {
    return (
      <Card>
        <CardContent className="p-3">
          <p className="text-sm font-medium mb-3">{assetName}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-11 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={() => onSetState(itemId, "good")}
            >
              <Check className="h-4 w-4 mr-1" />
              Good
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-11 border-amber-200 text-amber-700 hover:bg-amber-50"
              onClick={() => onSetState(itemId, "damaged")}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Damaged
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-11 border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => onSetState(itemId, "missing")}
            >
              <X className="h-4 w-4 mr-1" />
              Missing
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-11 border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => onSetState(itemId, "needs_inspection")}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Inspect
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-sm font-medium mb-3">
          {assetName}
          {itemState.state !== "good" &&
            itemState.state !== "needs_inspection" && (
              <span className="ml-2 text-xs text-muted-foreground">
                {itemState.state === "damaged" &&
                  (itemState.note
                    ? `${"\u2014"} ${itemState.note.slice(0, 40)}${itemState.note.length > 40 ? "..." : ""}`
                    : `${"\u2014"} needs details`)}
                {itemState.state === "missing" &&
                  (itemState.note
                    ? `${"\u2014"} ${itemState.note.slice(0, 40)}${itemState.note.length > 40 ? "..." : ""}`
                    : `${"\u2014"} needs details`)}
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
            onClick={() => onSetState(itemId, "good")}
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
            onClick={() => onSetState(itemId, "damaged")}
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
            onClick={() => onSetState(itemId, "missing")}
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
            onClick={() => onSetState(itemId, "needs_inspection")}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Inspect
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

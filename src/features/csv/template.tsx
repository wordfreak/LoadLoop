"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

function generateSampleCsv(): string {
  return [
    "Equipment Name,Category,Serial Number,Existing Code,Replacement Value ($),Quantity,Condition,Notes",
    'Sony VPL-PHZ10 Projector,Projectors,SN-001,CODE-A,3500,1,Good,Main projector for events',
    'JBL EON615 Speaker,Audio,SN-002,CODE-B,600,4,Good,Active PA speakers',
    'Shure Wireless Mic Kit,Audio,SN-003,CODE-C,1800,2,Good,Includes receivers',
    'XLR Cable 25ft,Cables,,,25,30,Good,Standard XLR cables',
    'Folding Chair,Furniture,,,22,50,Good,Black folding chairs',
    '6ft Banquet Table,Furniture,,,75,10,Good,',
  ].join("\n")
}

export function CsvTemplate() {
  function handleDownload() {
    const csv = generateSampleCsv()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "loadloop-import-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sample Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Download a sample CSV template to see the expected format. Fill in
          your equipment and import it back.
        </p>
        <p className="text-xs text-muted-foreground">
          Required: Equipment Name. Optional: Category, Serial Number, Existing
          Code, Value, Quantity, Condition, Notes. Duplicates are skipped by
          name, code, or serial number.
        </p>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </CardContent>
    </Card>
  )
}

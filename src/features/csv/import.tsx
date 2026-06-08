"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { importAssets } from "@/features/csv/actions"
import { toast } from "sonner"
import { Upload, FileSpreadsheet, Check } from "lucide-react"

type ColumnMapping = Record<string, string>

const COLUMN_DEFINITIONS = [
  { key: "name", label: "Name", required: true },
  { key: "serialNumber", label: "Serial Number", required: false },
  { key: "existingCode", label: "Existing Code", required: false },
  { key: "value", label: "Value (USD)", required: false },
  { key: "quantity", label: "Quantity", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "notes", label: "Notes", required: false },
]

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim())

  for (const def of COLUMN_DEFINITIONS) {
    const idx = lowerHeaders.findIndex(
      (h) =>
        h === def.key ||
        h === def.label.toLowerCase() ||
        h === def.key.replace(/([A-Z])/g, " $1").toLowerCase()
    )
    if (idx >= 0) {
      mapping[def.key] = headers[idx]
    }
  }

  return mapping
}

function parseValue(value: string): number | undefined {
  const cleaned = value.replace(/[$,]/g, "").trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

export function CsvImport() {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [allRows, setAllRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [importing, setImporting] = useState(false)
  const [count, setCount] = useState(0)
  const [filename, setFilename] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function parse(file: File) {
    setFilename(file.name)

    const Papa = (await import("papaparse")).default
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete(results) {
        const data = results.data as string[][]
        if (data.length < 2) {
          toast.error("CSV file appears empty")
          return
        }

        const fileHeaders = data[0].map((h: string) => h.trim())
        const bodyRows = data.slice(1)
        const autoMapping = autoMapColumns(fileHeaders)

        if (!autoMapping["name"]) {
          toast.warning(
            'Could not auto-detect "Name" column. Please map manually.'
          )
        }

        setHeaders(fileHeaders)
        setRows(bodyRows.slice(0, 10))
        setAllRows(bodyRows)
        setMapping(autoMapping)
        setStep("preview")
      },
      error() {
        toast.error("Failed to parse CSV file")
      },
    })
  }

  async function handleImport() {
    if (!mapping["name"]) {
      toast.error('"Name" column is required')
      return
    }

    setImporting(true)

    const mappedRows = allRows.map((row): Record<string, unknown> => {
      const obj: Record<string, unknown> = { name: "" }
      for (const def of COLUMN_DEFINITIONS) {
        const csvColumn = mapping[def.key]
        if (!csvColumn) continue

        const colIdx = headers.indexOf(csvColumn)
        if (colIdx < 0) continue

        const rawValue = row[colIdx]?.trim()
        if (!rawValue) continue

        if (def.key === "value") {
          obj[def.key] = parseValue(rawValue)
        } else if (def.key === "quantity") {
          obj[def.key] = parseInt(rawValue, 10) || 1
        } else {
          obj[def.key] = rawValue
        }
      }

      return obj
    })

    try {
      const result = await importAssets(mappedRows)
      setCount(result.count)
      setStep("done")
      toast.success(`Imported ${result.count} assets`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Import failed"
      )
    } finally {
      setImporting(false)
    }
  }

  if (step === "done") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-700">
            <Check className="h-5 w-5" />
            <p className="text-sm font-medium">
              Successfully imported {count} assets from {filename}
            </p>
          </div>
          <Button variant="outline" onClick={() => setStep("upload")}>
            Import Another File
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === "preview") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview & Map Columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{filename}</span>
            <Badge variant="secondary">{allRows.length} rows</Badge>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Column Mapping</p>
            <div className="grid grid-cols-2 gap-3">
              {COLUMN_DEFINITIONS.map((def) => (
                <div key={def.key} className="flex items-center gap-2">
                  <span className="text-sm w-32 text-muted-foreground">
                    {def.label}
                    {def.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </span>
                  <Select
                    value={mapping[def.key] ?? ""}
                    onValueChange={(v) =>
                      setMapping((prev) => {
                        const next = { ...prev }
                        if (v) next[def.key] = v
                        else delete next[def.key]
                        return next
                      })
                    }
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      {(mapping[def.key] && !headers.includes(mapping[def.key] ?? "")) && (
                        <SelectItem value={mapping[def.key] ?? ""}>
                          {mapping[def.key]}
                        </SelectItem>
                      )}
                      {headers.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">
              Preview (first {Math.min(rows.length, 10)} rows)
            </p>
            <div className="rounded-md border max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="text-xs">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="text-xs">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !mapping["name"]}
            >
              {importing
                ? "Importing..."
                : `Import ${allRows.length} Assets`}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">CSV Asset Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with your equipment list. The system will help you
          map columns and import everything at once.
        </p>
        <p className="text-xs text-muted-foreground">
          Accepts any delimiter (commas, tabs, semicolons). First row should
          contain column headers.
        </p>
        <div
          className="rounded-lg border-2 border-dashed p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) parse(file)
          }}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">
            Drop your CSV here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .csv files supported
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) parse(file)
          }}
        />
      </CardContent>
    </Card>
  )
}

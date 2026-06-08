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
  { key: "name", label: "Equipment Name", required: true },
  { key: "serialNumber", label: "Serial Number", required: false },
  { key: "existingCode", label: "Existing Code / Barcode", required: false },
  { key: "value", label: "Replacement Value ($)", required: false },
  { key: "quantity", label: "Quantity", required: false },
  { key: "condition", label: "Condition", required: false },
  { key: "notes", label: "Notes", required: false },
]

const NAME_PATTERNS = [
  "name", "equipment", "item", "gear", "asset", "description",
  "product", "device", "unit", "equipment name", "item name",
  "asset name", "gear name", "product name",
]

const SERIAL_PATTERNS = [
  "serial", "serial number", "serial #", "s/n", "serial no",
  "serialnumber", "serialno", "serial num",
]

const CODE_PATTERNS = [
  "existing code", "barcode", "existingcode", "existing",
  "code", "tag", "sticker", "label", "id",
]

const VALUE_PATTERNS = [
  "value", "cost", "price", "replacement", "replacement value",
  "replace value", "rrp", "msrp", "purchase price", "unit price",
  "unit cost", "amount", "$", "usd",
]

const QUANTITY_PATTERNS = [
  "quantity", "qty", "count", "units", "total", "stock",
  "on hand", "available", "qty on hand",
]

const CONDITION_PATTERNS = [
  "condition", "status", "state", "quality", "grade", "health",
]

const NOTES_PATTERNS = [
  "notes", "comments", "description", "details", "info",
  "additional", "extra", "memo",
]

const PATTERN_MAP: Record<string, string[]> = {
  name: NAME_PATTERNS,
  serialNumber: SERIAL_PATTERNS,
  existingCode: CODE_PATTERNS,
  value: VALUE_PATTERNS,
  quantity: QUANTITY_PATTERNS,
  condition: CONDITION_PATTERNS,
  notes: NOTES_PATTERNS,
}

function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9\s]/g, ""))

  for (const def of COLUMN_DEFINITIONS) {
    const patterns = PATTERN_MAP[def.key] ?? []
    const idx = lowerHeaders.findIndex((h) =>
      patterns.some((p) => h === p || h.includes(p) || p.includes(h))
    )
    if (idx >= 0) {
      mapping[def.key] = headers[idx]
    }
  }

  return mapping
}

function parseSpreadsheet(data: string[][]) {
  if (data.length < 2) return null
  const headers = data[0].map((h) => String(h).trim())
  const rows = data.slice(1).map((row) =>
    row.map((cell) => (cell != null ? String(cell).trim() : ""))
  )
  return { headers, rows }
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

  async function parseFile(file: File) {
    setFilename(file.name)
    const extension = file.name.split(".").pop()?.toLowerCase()

    if (extension === "xlsx" || extension === "xls") {
      parseExcel(file)
    } else {
      parseCsv(file)
    }
  }

  function parseExcel(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = (await import("xlsx")).default
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
        })

        const result = parseSpreadsheet(raw)
        if (!result) {
          toast.error("Spreadsheet appears empty")
          return
        }

        setHeaders(result.headers)
        setRows(result.rows.slice(0, 10))
        setAllRows(result.rows)
        setMapping(autoMapColumns(result.headers))
        setStep("preview")
      } catch {
        toast.error("Failed to read Excel file")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  function parseCsv(file: File) {
    import("papaparse").then(({ default: Papa }) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete(results) {
          const raw = results.data as string[][]
          const result = parseSpreadsheet(raw)
          if (!result) {
            toast.error("File appears empty")
            return
          }

          setHeaders(result.headers)
          setRows(result.rows.slice(0, 10))
          setAllRows(result.rows)
          setMapping(autoMapColumns(result.headers))
          setStep("preview")
        },
        error() {
          toast.error("Failed to parse file")
        },
      })
    })
  }

  async function handleImport() {
    if (!mapping["name"]) {
      toast.error('"Equipment Name" column is required')
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
          const cleaned = rawValue.replace(/[$,£€]/g, "").trim()
          const num = parseFloat(cleaned)
          if (!isNaN(num)) obj[def.key] = num
        } else if (def.key === "quantity") {
          const num = parseInt(rawValue, 10)
          obj[def.key] = isNaN(num) ? 1 : Math.max(1, num)
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
      toast.success(`Imported ${result.count} items`)
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
            <div>
              <p className="text-sm font-medium">
                {count} items imported from {filename}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Items are now in your asset register. QR codes generated automatically.
              </p>
            </div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Review Your Import</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Columns mapped automatically — adjust if needed
            </p>
          </div>
          <Badge variant="secondary">
            {allRows.length} items
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Column Mapping</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {COLUMN_DEFINITIONS.map((def) => (
                <div key={def.key} className="flex items-center gap-2">
                  <span className="text-sm w-36 text-muted-foreground flex-shrink-0">
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
                    <SelectTrigger className="flex-1 h-8 text-xs">
                      <SelectValue placeholder="Skip" />
                    </SelectTrigger>
                    <SelectContent>
                      {mapping[def.key] &&
                        !headers.includes(mapping[def.key] ?? "") && (
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
              Preview (showing first {Math.min(rows.length, 5)} of{" "}
              {allRows.length} rows)
            </p>
            <div className="rounded-md border max-h-48 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h) => (
                      <TableHead key={h} className="text-xs whitespace-nowrap">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell
                          key={j}
                          className="text-xs whitespace-nowrap max-w-32 truncate"
                        >
                          {cell || "-"}
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
              Choose Different File
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || !mapping["name"]}
            >
              {importing
                ? "Importing..."
                : `Import ${allRows.length} Items`}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Import Equipment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Drop your spreadsheet here — Excel, CSV, TSV, or tab-delimited. The
          system automatically detects columns and imports everything at once.
        </p>
        <p className="text-xs text-muted-foreground">
          Auto-detects column names like "Equipment", "Serial #", "Replacement
          Value", "Qty", etc. No manual setup needed.
        </p>
        <div
          className="rounded-lg border-2 border-dashed p-10 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) parseFile(file)
          }}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium">
            Drop your Excel or CSV file here
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            .xlsx .xls .csv .tsv supported
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) parseFile(file)
          }}
        />
      </CardContent>
    </Card>
  )
}

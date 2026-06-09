"use client"

import { useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type AssetRow = {
  id: number
  name: string
  category: string
  status: string
  location: string
  value: number | null
  photoUrl: string | null
  serialNumber: string | null
  lastMovement: string
}

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-700",
  reserved: "bg-blue-100 text-blue-700",
  packed: "bg-indigo-100 text-indigo-700",
  checked_out: "bg-amber-100 text-amber-700",
  returned: "bg-green-100 text-green-700",
  damaged: "bg-red-100 text-red-700",
  missing: "bg-orange-100 text-orange-700",
  needs_inspection: "bg-yellow-100 text-yellow-700",
  retired: "bg-gray-100 text-gray-500",
}

const columns: ColumnDef<AssetRow>[] = [
  {
    accessorKey: "photoUrl",
    header: "",
    cell: ({ row }) => (
      <div className="h-10 w-10 rounded bg-muted overflow-hidden">
        {row.original.photoUrl ? (
          <img
            src={row.original.photoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            -
          </div>
        )}
      </div>
    ),
    enableSorting: false,
    size: 48,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.serialNumber && (
          <p className="text-xs text-muted-foreground">
            {row.original.serialNumber}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={statusColors[row.original.status] ?? ""}>
        {row.original.status.replace(/_/g, " ")}
      </Badge>
    ),
  },
  {
    accessorKey: "location",
    header: "Location",
  },
  {
    accessorKey: "value",
    header: "Value",
    cell: ({ row }) =>
      row.original.value != null
        ? `$${row.original.value.toLocaleString()}`
        : "-",
    sortingFn: "basic",
  },
  {
    accessorKey: "lastMovement",
    header: "Last Movement",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.lastMovement}
      </span>
    ),
  },
]

export default function AssetTable({
  data,
}: {
  data: AssetRow[]
}) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = filterValue.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(search) ||
        (row.original.serialNumber?.toLowerCase().includes(search) ?? false)
      )
    },
  })

  const filteredByStatus =
    statusFilter === "all"
      ? table.getRowModel().rows
      : table.getRowModel().rows.filter(
          (row) => row.original.status === statusFilter
        )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name or serial..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="damaged">Damaged</SelectItem>
            <SelectItem value="needs_inspection">Needs Inspection</SelectItem>
            <SelectItem value="retired">Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {filteredByStatus.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {data.length === 0
                    ? "No assets found. Import your equipment list to get started."
                    : "No assets match the current filters."}
                </TableCell>
              </TableRow>
            ) : (
              filteredByStatus.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/assets/${row.original.id}`)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

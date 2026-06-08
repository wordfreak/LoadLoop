export const ASSET_STATUSES = [
  "available",
  "reserved",
  "packed",
  "checked_out",
  "returned",
  "damaged",
  "missing",
  "needs_inspection",
  "retired",
] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]

export const MOVEMENT_TYPES = [
  "created",
  "reserved",
  "packed",
  "checked_out",
  "returned_good",
  "returned_damaged",
  "returned_missing",
  "returned_needs_inspection",
  "damage_reported",
  "repair_started",
  "repair_completed",
  "available",
  "retired",
  "location_moved",
] as const

export type MovementType = (typeof MOVEMENT_TYPES)[number]

export const VALID_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  available: ["reserved", "retired"],
  reserved: ["packed", "available"],
  packed: ["checked_out", "available"],
  checked_out: ["returned", "damaged", "missing", "needs_inspection"],
  returned: ["available"],
  damaged: ["available", "retired"],
  missing: ["available", "retired"],
  needs_inspection: ["available", "damaged"],
  retired: [],
}

export function canTransition(from: AssetStatus, to: AssetStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export const DAMAGE_REPORT_STATUSES = [
  "pending",
  "charged_to_client",
  "repair_in_progress",
  "repaired",
  "written_off",
  "disputed",
] as const

export type DamageReportStatus = (typeof DAMAGE_REPORT_STATUSES)[number]

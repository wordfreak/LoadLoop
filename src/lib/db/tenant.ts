import { eq, type Column } from "drizzle-orm"

export function withinTenant(
  column: Column,
  tenantId: number
): ReturnType<typeof eq> {
  return eq(column, tenantId)
}

import { z } from "zod"

export const createDamageReportSchema = z.object({
  assetId: z.number(),
  bookingId: z.number().optional(),
  clientId: z.number().optional(),
  photoUrl: z.string().url(),
  description: z.string().max(2000).optional(),
  repairCost: z.number().min(0).optional(),
})

export const updateDamageReportSchema = z.object({
  status: z.string().optional(),
  repairCost: z.number().min(0).optional(),
  depositImpact: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
})

export type CreateDamageReportInput = z.infer<typeof createDamageReportSchema>
export type UpdateDamageReportInput = z.infer<typeof updateDamageReportSchema>

import { z } from "zod"

export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.number().optional(),
  locationId: z.number().optional(),
  serialNumber: z.string().max(100).optional(),
  existingCode: z.string().max(100).optional(),
  value: z.number().min(0).optional(),
  isBulk: z.boolean().default(false),
  quantity: z.number().int().min(1).default(1),
  condition: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
})

export const updateAssetSchema = createAssetSchema.partial()

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>

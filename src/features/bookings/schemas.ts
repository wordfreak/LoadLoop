import { z } from "zod"

export const createBookingSchema = z.object({
  clientId: z.number(),
  eventName: z.string().min(1).max(200),
  startDate: z.string(),
  endDate: z.string(),
  deliveryDate: z.string().optional(),
  returnDate: z.string().optional(),
  depositAmount: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(
    z.object({
      assetId: z.number(),
      quantityBooked: z.number().int().min(1).default(1),
    })
  ),
})

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
})

export const updateClientSchema = createClientSchema.partial()

export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>

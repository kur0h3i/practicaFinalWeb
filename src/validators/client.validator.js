import { z } from 'zod'

const addressSchema = z.object({
  street:   z.string().min(1),
  number:   z.string().min(1),
  postal:   z.string().min(1),
  city:     z.string().min(1),
  province: z.string().min(1),
}).partial()

export const createClientSchema = z.object({
  name:    z.string().min(1, 'Nombre requerido'),
  cif:     z.string().min(1, 'CIF requerido'),
  email:   z.string().email('Email inválido').optional(),
  phone:   z.string().optional(),
  address: addressSchema.optional(),
})

export const updateClientSchema = createClientSchema.partial()

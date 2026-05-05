import { z } from 'zod'

const addressSchema = z.object({
  street:   z.string().min(1),
  number:   z.string().min(1),
  postal:   z.string().min(1),
  city:     z.string().min(1),
  province: z.string().min(1),
}).partial()

export const createProjectSchema = z.object({
  name:        z.string().min(1, 'Nombre requerido'),
  projectCode: z.string().min(1, 'Código de proyecto requerido'),
  client:      z.string().min(1, 'Cliente requerido'),
  address:     addressSchema.optional(),
  email:       z.string().email('Email inválido').optional(),
  notes:       z.string().optional(),
  active:      z.boolean().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

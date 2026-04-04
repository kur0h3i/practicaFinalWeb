import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('email inválido').transform(v => v.toLowerCase().trim()),
  password: z.string().min(8, 'mínimo 8 caracteres')
})

export const verificationSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/, 'debe ser 6 dígitos')
})

export const loginSchema = z.object({
  email: z.string().email().transform(v => v.toLowerCase().trim()),
  password: z.string().min(1)
})

export const personalDataSchema = z.object({
  name: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  nif: z.string().trim().length(9)
})

const addressSchema = z.object({
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  postal: z.string().trim().min(1),
  city:   z.string().trim().min(1),
  province: z.string().trim().min(1),
})

export const companySchema = z.discriminatedUnion('isFreelance', [
  z.object({ isFreelance: z.literal(true) }),
  z.object({
    isFreelance: z.literal(false),
    cif:     z.string().trim().min(1),
    name:    z.string().trim().min(1),
    address: addressSchema,
  }),
])

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'La nueva contraseña debe ser diferente',
  path: ['newPassword'],
})

export const inviteSchema = z.object({
  email:    z.string().email().transform(v => v.toLowerCase().trim()),
  name:     z.string().trim().min(1),
  lastName: z.string().trim().min(1),
})

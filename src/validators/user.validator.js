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

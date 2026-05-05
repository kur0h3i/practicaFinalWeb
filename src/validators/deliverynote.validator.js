import { z } from 'zod'

const workerSchema = z.object({
  name:  z.string().min(1),
  hours: z.number().min(0),
})

export const createDeliveryNoteSchema = z.discriminatedUnion('format', [
  z.object({
    format:      z.literal('material'),
    project:     z.string().min(1, 'Proyecto requerido'),
    client:      z.string().min(1, 'Cliente requerido'),
    description: z.string().optional(),
    workDate:    z.string().datetime({ offset: true }).or(z.string().date()),
    material:    z.string().min(1, 'Material requerido'),
    quantity:    z.number().min(0, 'Cantidad requerida'),
    unit:        z.string().min(1, 'Unidad requerida'),
  }),
  z.object({
    format:      z.literal('hours'),
    project:     z.string().min(1, 'Proyecto requerido'),
    client:      z.string().min(1, 'Cliente requerido'),
    description: z.string().optional(),
    workDate:    z.string().datetime({ offset: true }).or(z.string().date()),
    hours:       z.number().min(0).optional(),
    workers:     z.array(workerSchema).optional(),
  }),
])

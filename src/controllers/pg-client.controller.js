/**
 * Controlador de Clientes — versión PostgreSQL con Prisma
 * Rutas: /api/pg/client
 *
 * Complementario a la versión MongoDB.
 * Requiere DATABASE_URL configurada y `npm run prisma:generate` ejecutado.
 */
import { getPrisma } from '../config/prisma.js'
import { AppError }  from '../utils/AppError.js'

const requirePrisma = (next) => {
  const prisma = getPrisma()
  if (!prisma) {
    next(AppError.internal('PostgreSQL no está configurado (falta DATABASE_URL)', 'PG_NOT_CONFIGURED'))
    return null
  }
  return prisma
}

// POST /api/pg/client
export const pgCreateClient = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const { name, cif, email, phone, address = {} } = req.body
    const companyId = req.user.company?.toString()
    if (!companyId) return next(AppError.badRequest('El usuario no tiene compañía asignada'))

    // Verificar CIF único en la compañía
    const existing = await prisma.pgClient.findFirst({ where: { companyId, cif, deleted: false } })
    if (existing) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'))

    const client = await prisma.pgClient.create({
      data: {
        name, cif,
        email:    email ?? null,
        phone:    phone ?? null,
        street:   address.street   ?? null,
        number:   address.number   ?? null,
        postal:   address.postal   ?? null,
        city:     address.city     ?? null,
        province: address.province ?? null,
        userId:    req.user._id.toString(),
        companyId,
      },
    })

    res.status(201).json({ ok: true, client })
  } catch (err) { next(err) }
}

// GET /api/pg/client
export const pgListClients = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const { page = 1, limit = 10, name, sort = 'createdAt' } = req.query
    const companyId = req.user.company?.toString()
    if (!companyId) return next(AppError.badRequest('El usuario no tiene compañía asignada'))

    const where = { companyId, deleted: false }
    if (name) where.name = { contains: name, mode: 'insensitive' }

    const [clients, total] = await Promise.all([
      prisma.pgClient.findMany({
        where,
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        orderBy: { [sort.replace('-', '')]: sort.startsWith('-') ? 'desc' : 'asc' },
      }),
      prisma.pgClient.count({ where }),
    ])

    res.json({
      ok: true,
      clients,
      totalItems:  total,
      totalPages:  Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    })
  } catch (err) { next(err) }
}

// GET /api/pg/client/:id
export const pgGetClient = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const companyId = req.user.company?.toString()
    const client = await prisma.pgClient.findFirst({
      where: { id: req.params.id, companyId, deleted: false },
    })
    if (!client) return next(AppError.notFound('Cliente no encontrado'))
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

// PUT /api/pg/client/:id
export const pgUpdateClient = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const companyId = req.user.company?.toString()
    const found = await prisma.pgClient.findFirst({
      where: { id: req.params.id, companyId, deleted: false },
    })
    if (!found) return next(AppError.notFound('Cliente no encontrado'))

    const { name, cif, email, phone, address = {} } = req.body
    const client = await prisma.pgClient.update({
      where: { id: req.params.id },
      data: {
        ...(name  !== undefined && { name }),
        ...(cif   !== undefined && { cif }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address.street   !== undefined && { street:   address.street }),
        ...(address.number   !== undefined && { number:   address.number }),
        ...(address.postal   !== undefined && { postal:   address.postal }),
        ...(address.city     !== undefined && { city:     address.city }),
        ...(address.province !== undefined && { province: address.province }),
      },
    })
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

// DELETE /api/pg/client/:id
export const pgDeleteClient = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const companyId = req.user.company?.toString()
    const soft      = req.query.soft !== 'false'
    const found     = await prisma.pgClient.findFirst({
      where: { id: req.params.id, companyId, deleted: false },
    })
    if (!found) return next(AppError.notFound('Cliente no encontrado'))

    if (soft) {
      await prisma.pgClient.update({ where: { id: req.params.id }, data: { deleted: true } })
      return res.json({ ok: true, message: 'Cliente archivado (PostgreSQL)' })
    }
    await prisma.pgClient.delete({ where: { id: req.params.id } })
    res.json({ ok: true, message: 'Cliente eliminado permanentemente (PostgreSQL)' })
  } catch (err) { next(err) }
}

// GET /api/pg/client/archived
export const pgListArchivedClients = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const companyId = req.user.company?.toString()
    const clients   = await prisma.pgClient.findMany({
      where:   { companyId, deleted: true },
      orderBy: { updatedAt: 'desc' },
    })
    res.json({ ok: true, clients })
  } catch (err) { next(err) }
}

// PATCH /api/pg/client/:id/restore
export const pgRestoreClient = async (req, res, next) => {
  try {
    const prisma = requirePrisma(next)
    if (!prisma) return

    const companyId = req.user.company?.toString()
    const found     = await prisma.pgClient.findFirst({
      where: { id: req.params.id, companyId, deleted: true },
    })
    if (!found) return next(AppError.notFound('Cliente archivado no encontrado'))

    const client = await prisma.pgClient.update({
      where: { id: req.params.id },
      data:  { deleted: false },
    })
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

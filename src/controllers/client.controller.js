import { Client } from '../models/Client.js'
import { AppError } from '../utils/AppError.js'

const emitToCompany = (req, event, data) => {
  const io = req.app.get('io')
  if (io && req.user.company) {
    io.to(req.user.company.toString()).emit(event, data)
  }
}

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    if (!req.user.company) return next(AppError.badRequest('El usuario no tiene compañía asignada'))

    const existing = await Client.findOne({ company: req.user.company, cif: req.body.cif })
      .setOptions({ _skipDeletedFilter: true })
    if (existing) return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'))

    const client = await Client.create({ ...req.body, user: req.user._id, company: req.user.company })
    emitToCompany(req, 'client:new', client)
    res.status(201).json({ ok: true, client })
  } catch (err) { next(err) }
}

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company })
    if (!client) return next(AppError.notFound('Cliente no encontrado'))

    if (req.body.cif && req.body.cif !== client.cif) {
      const dup = await Client.findOne({ company: req.user.company, cif: req.body.cif })
        .setOptions({ _skipDeletedFilter: true })
      if (dup) return next(AppError.conflict('Ya existe un cliente con ese CIF'))
    }

    Object.assign(client, req.body)
    await client.save()
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

// GET /api/client
export const listClients = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query
    const filter = { company: req.user.company }
    if (name) filter.name = { $regex: name, $options: 'i' }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Client.countDocuments(filter)
    const clients = await Client.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))

    res.json({
      ok: true,
      clients,
      totalItems:  total,
      totalPages:  Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    })
  } catch (err) { next(err) }
}

// GET /api/client/archived
export const listArchivedClients = async (req, res, next) => {
  try {
    const clients = await Client.find({ company: req.user.company, deleted: true })
      .setOptions({ _skipDeletedFilter: true })
      .sort('-updatedAt')
    res.json({ ok: true, clients })
  } catch (err) { next(err) }
}

// GET /api/client/:id
export const getClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company })
    if (!client) return next(AppError.notFound('Cliente no encontrado'))
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

// DELETE /api/client/:id
export const deleteClient = async (req, res, next) => {
  try {
    const soft   = req.query.soft !== 'false'
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company })
    if (!client) return next(AppError.notFound('Cliente no encontrado'))

    if (soft) {
      client.deleted = true
      await client.save()
      return res.json({ ok: true, message: 'Cliente archivado' })
    }
    await Client.deleteOne({ _id: client._id })
    res.json({ ok: true, message: 'Cliente eliminado permanentemente' })
  } catch (err) { next(err) }
}

// PATCH /api/client/:id/restore
export const restoreClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, company: req.user.company, deleted: true })
      .setOptions({ _skipDeletedFilter: true })
    if (!client) return next(AppError.notFound('Cliente archivado no encontrado'))

    client.deleted = false
    await client.save()
    res.json({ ok: true, client })
  } catch (err) { next(err) }
}

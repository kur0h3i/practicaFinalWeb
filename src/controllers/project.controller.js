import { Project } from '../models/Project.js'
import { Client }  from '../models/Client.js'
import { AppError } from '../utils/AppError.js'

const emitToCompany = (req, event, data) => {
  const io = req.app.get('io')
  if (io && req.user.company) {
    io.to(req.user.company.toString()).emit(event, data)
  }
}

// POST /api/project
export const createProject = async (req, res, next) => {
  try {
    if (!req.user.company) return next(AppError.badRequest('El usuario no tiene compañía asignada'))

    const client = await Client.findOne({ _id: req.body.client, company: req.user.company })
    if (!client) return next(AppError.notFound('Cliente no encontrado en tu compañía'))

    const existing = await Project.findOne({ company: req.user.company, projectCode: req.body.projectCode })
      .setOptions({ _skipDeletedFilter: true })
    if (existing) return next(AppError.conflict('Ya existe un proyecto con ese código en tu compañía'))

    const project = await Project.create({ ...req.body, user: req.user._id, company: req.user.company })
    emitToCompany(req, 'project:new', project)
    res.status(201).json({ ok: true, project })
  } catch (err) { next(err) }
}

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company })
    if (!project) return next(AppError.notFound('Proyecto no encontrado'))

    if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
      const dup = await Project.findOne({ company: req.user.company, projectCode: req.body.projectCode })
        .setOptions({ _skipDeletedFilter: true })
      if (dup) return next(AppError.conflict('Ya existe un proyecto con ese código'))
    }

    if (req.body.client) {
      const client = await Client.findOne({ _id: req.body.client, company: req.user.company })
      if (!client) return next(AppError.notFound('Cliente no encontrado en tu compañía'))
    }

    Object.assign(project, req.body)
    await project.save()
    res.json({ ok: true, project })
  } catch (err) { next(err) }
}

// GET /api/project
export const listProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, name, client, active, sort = '-createdAt' } = req.query
    const filter = { company: req.user.company }
    if (name)   filter.name   = { $regex: name, $options: 'i' }
    if (client) filter.client = client
    if (active !== undefined) filter.active = active === 'true'

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Project.countDocuments(filter)
    const projects = await Project.find(filter)
      .populate('client', 'name cif email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))

    res.json({
      ok: true,
      projects,
      totalItems:  total,
      totalPages:  Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    })
  } catch (err) { next(err) }
}

// GET /api/project/archived
export const listArchivedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ company: req.user.company, deleted: true })
      .setOptions({ _skipDeletedFilter: true })
      .populate('client', 'name cif')
      .sort('-updatedAt')
    res.json({ ok: true, projects })
  } catch (err) { next(err) }
}

// GET /api/project/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company })
      .populate('client', 'name cif email phone address')
    if (!project) return next(AppError.notFound('Proyecto no encontrado'))
    res.json({ ok: true, project })
  } catch (err) { next(err) }
}

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
  try {
    const soft    = req.query.soft !== 'false'
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company })
    if (!project) return next(AppError.notFound('Proyecto no encontrado'))

    if (soft) {
      project.deleted = true
      await project.save()
      return res.json({ ok: true, message: 'Proyecto archivado' })
    }
    await Project.deleteOne({ _id: project._id })
    res.json({ ok: true, message: 'Proyecto eliminado permanentemente' })
  } catch (err) { next(err) }
}

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, company: req.user.company, deleted: true })
      .setOptions({ _skipDeletedFilter: true })
    if (!project) return next(AppError.notFound('Proyecto archivado no encontrado'))

    project.deleted = false
    await project.save()
    res.json({ ok: true, project })
  } catch (err) { next(err) }
}

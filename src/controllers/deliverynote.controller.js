import sharp from 'sharp'
import { DeliveryNote }           from '../models/DeliveryNote.js'
import { Project }                from '../models/Project.js'
import { Client }                 from '../models/Client.js'
import { AppError }               from '../utils/AppError.js'
import { uploadSignature, uploadPdf } from '../services/storage.service.js'
import { generateDeliveryNotePdf }    from '../services/pdf.service.js'

const emitToCompany = (req, event, data) => {
  const io = req.app.get('io')
  if (io && req.user.company) {
    io.to(req.user.company.toString()).emit(event, data)
  }
}

export const createDeliveryNote = async (req, res, next) => {
  try {
    if (!req.user.company) return next(AppError.badRequest('El usuario no tiene compañía asignada'))

    const project = await Project.findOne({ _id: req.body.project, company: req.user.company })
    if (!project) return next(AppError.notFound('Proyecto no encontrado en tu compañía'))

    const client = await Client.findOne({ _id: req.body.client, company: req.user.company })
    if (!client) return next(AppError.notFound('Cliente no encontrado en tu compañía'))

    const note = await DeliveryNote.create({
      ...req.body,
      user:    req.user._id,
      company: req.user.company,
    })

    emitToCompany(req, 'deliverynote:new', note)
    res.status(201).json({ ok: true, note })
  } catch (err) { next(err) }
}

export const listDeliveryNotes = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10,
      project, client, format, signed,
      from, to,
      sort = '-workDate',
    } = req.query

    const filter = { company: req.user.company }
    if (project) filter.project = project
    if (client)  filter.client  = client
    if (format)  filter.format  = format
    if (signed !== undefined) filter.signed = signed === 'true'
    if (from || to) {
      filter.workDate = {}
      if (from) filter.workDate.$gte = new Date(from)
      if (to)   filter.workDate.$lte = new Date(to)
    }

    const skip  = (Number(page) - 1) * Number(limit)
    const total = await DeliveryNote.countDocuments(filter)
    const notes = await DeliveryNote.find(filter)
      .populate('user',    'name lastName email')
      .populate('client',  'name cif')
      .populate('project', 'name projectCode')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))

    res.json({
      ok: true,
      notes,
      totalItems:  total,
      totalPages:  Math.ceil(total / Number(limit)),
      currentPage: Number(page),
    })
  } catch (err) { next(err) }
}

export const getDeliveryNote = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
      .populate('user',    'name lastName email nif')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address email notes')
      .populate('company')
    if (!note) return next(AppError.notFound('Albarán no encontrado'))
    res.json({ ok: true, note })
  } catch (err) { next(err) }
}

export const downloadPdf = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
      .populate('user',    'name lastName email nif')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address')
      .populate('company', 'name cif address')
    if (!note) return next(AppError.notFound('Albarán no encontrado'))

    if (note.signed && note.pdfUrl) {
      return res.redirect(note.pdfUrl)
    }

    const pdfBuffer = await generateDeliveryNotePdf(note, {
      user:    note.user,
      company: note.company,
      client:  note.client,
      project: note.project,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="albaran-${note._id}.pdf"`)
    res.end(pdfBuffer)
  } catch (err) { next(err) }
}

export const signDeliveryNote = async (req, res, next) => {
  try {
    if (!req.file) return next(AppError.badRequest('Se requiere imagen de firma'))

    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
      .populate('user',    'name lastName email nif')
      .populate('client',  'name cif email phone address')
      .populate('project', 'name projectCode address')
      .populate('company', 'name cif address')
    if (!note) return next(AppError.notFound('Albarán no encontrado'))
    if (note.signed) return next(AppError.conflict('El albarán ya está firmado'))

    const optimized = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()

    const signatureUrl = await uploadSignature(optimized)

    note.signed       = true
    note.signedAt     = new Date()
    note.signatureUrl = signatureUrl

    const pdfBuffer = await generateDeliveryNotePdf(note, {
      user:    note.user,
      company: note.company,
      client:  note.client,
      project: note.project,
    })

    const pdfUrl = await uploadPdf(pdfBuffer)
    note.pdfUrl  = pdfUrl

    await note.save()

    emitToCompany(req, 'deliverynote:signed', { _id: note._id, signedAt: note.signedAt })
    res.json({ ok: true, note })
  } catch (err) { next(err) }
}

export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const note = await DeliveryNote.findOne({ _id: req.params.id, company: req.user.company })
    if (!note) return next(AppError.notFound('Albarán no encontrado'))
    if (note.signed) return next(AppError.conflict('No se puede borrar un albarán firmado'))

    await DeliveryNote.deleteOne({ _id: note._id })
    res.json({ ok: true, message: 'Albarán eliminado' })
  } catch (err) { next(err) }
}

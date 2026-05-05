import { DeliveryNote } from '../models/DeliveryNote.js'
import { Client }       from '../models/Client.js'
import { Project }      from '../models/Project.js'

/**
 * GET /api/dashboard
 * Aggregation-pipeline stats for the authenticated user's company.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const company = req.user.company
    if (!company) return res.json({ ok: true, message: 'Sin compañía asignada', data: {} })

    const companyId = company

    // ── 1. Summary counts ─────────────────────────────────────────────────────
    const [totalClients, totalProjects, totalNotes, signedNotes] = await Promise.all([
      Client.countDocuments({ company: companyId }),
      Project.countDocuments({ company: companyId }),
      DeliveryNote.countDocuments({ company: companyId }),
      DeliveryNote.countDocuments({ company: companyId, signed: true }),
    ])

    // ── 2. Albaranes por mes (últimos 12 meses) ───────────────────────────────
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const notesByMonth = await DeliveryNote.aggregate([
      {
        $match: {
          company:  companyId,
          workDate: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:  '$workDate' },
            month: { $month: '$workDate' },
          },
          total:         { $sum: 1 },
          totalHoras:    { $sum: { $cond: [{ $eq: ['$format', 'hours'] }, { $ifNull: ['$hours', 0] }, 0] } },
          albHoras:      { $sum: { $cond: [{ $eq: ['$format', 'hours'] }, 1, 0] } },
          albMateriales: { $sum: { $cond: [{ $eq: ['$format', 'material'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          año:          '$_id.year',
          mes:          '$_id.month',
          total:        1,
          totalHoras:   1,
          albHoras:     1,
          albMateriales: 1,
        },
      },
    ])

    // ── 3. Horas totales por proyecto ─────────────────────────────────────────
    const horasPorProyecto = await DeliveryNote.aggregate([
      { $match: { company: companyId, format: 'hours' } },
      {
        $group: {
          _id:        '$project',
          totalHoras: { $sum: { $ifNull: ['$hours', 0] } },
          numAlb:     { $sum: 1 },
        },
      },
      { $sort: { totalHoras: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'projects',
          localField:   '_id',
          foreignField: '_id',
          as:           'proyecto',
        },
      },
      { $unwind: { path: '$proyecto', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          proyectoId:   '$_id',
          nombre:       '$proyecto.name',
          codigo:       '$proyecto.projectCode',
          totalHoras:   1,
          numAlbaranes: '$numAlb',
        },
      },
    ])

    // ── 4. Materiales por cliente ──────────────────────────────────────────────
    const materialesPorCliente = await DeliveryNote.aggregate([
      { $match: { company: companyId, format: 'material' } },
      {
        $group: {
          _id:            '$client',
          numAlbaranes:   { $sum: 1 },
          totalCantidad:  { $sum: { $ifNull: ['$quantity', 0] } },
        },
      },
      { $sort: { numAlbaranes: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         'clients',
          localField:   '_id',
          foreignField: '_id',
          as:           'cliente',
        },
      },
      { $unwind: { path: '$cliente', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          clienteId:     '$_id',
          nombre:        '$cliente.name',
          cif:           '$cliente.cif',
          numAlbaranes:  1,
          totalCantidad: 1,
        },
      },
    ])

    // ── 5. Distribución por formato ───────────────────────────────────────────
    const distribucionFormato = await DeliveryNote.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id:   '$format',
          total: { $sum: 1 },
        },
      },
    ])

    res.json({
      ok: true,
      data: {
        resumen: {
          totalClientes:  totalClients,
          totalProyectos: totalProjects,
          totalAlbaranes: totalNotes,
          albFirmados:    signedNotes,
          albPendientes:  totalNotes - signedNotes,
        },
        albAranesPorMes:      notesByMonth,
        horasPorProyecto,
        materialesPorCliente,
        distribucionFormato,
      },
    })
  } catch (err) { next(err) }
}

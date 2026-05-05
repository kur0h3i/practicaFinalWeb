/**
 * @openapi
 * tags:
 *   name: Dashboard
 *   description: Estadísticas y métricas de la compañía (aggregation pipeline)
 */

/**
 * @openapi
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Estadísticas de la compañía
 *     description: |
 *       Devuelve estadísticas calculadas mediante MongoDB aggregation pipeline:
 *       - Resumen (totales de clientes, proyectos, albaranes firmados/pendientes)
 *       - Albaranes por mes (últimos 12 meses)
 *       - Horas totales por proyecto (top 10)
 *       - Materiales por cliente (top 10)
 *       - Distribución por formato (hours / material)
 *     responses:
 *       200:
 *         description: Estadísticas calculadas
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 ok: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     resumen:
 *                       type: object
 *                       properties:
 *                         totalClientes:  { type: integer }
 *                         totalProyectos: { type: integer }
 *                         totalAlbaranes: { type: integer }
 *                         albFirmados:    { type: integer }
 *                         albPendientes:  { type: integer }
 *                     albAranesPorMes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           año:           { type: integer }
 *                           mes:           { type: integer }
 *                           total:         { type: integer }
 *                           totalHoras:    { type: number }
 *                           albHoras:      { type: integer }
 *                           albMateriales: { type: integer }
 *                     horasPorProyecto:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nombre:       { type: string }
 *                           codigo:       { type: string }
 *                           totalHoras:   { type: number }
 *                           numAlbaranes: { type: integer }
 *                     materialesPorCliente:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           nombre:        { type: string }
 *                           cif:           { type: string }
 *                           numAlbaranes:  { type: integer }
 *                           totalCantidad: { type: number }
 *       401: { description: No autorizado }
 */

import { Router }       from 'express'
import { protect }      from '../middleware/auth.middleware.js'
import { getDashboard } from '../controllers/dashboard.controller.js'

const router = Router()

router.use(protect)
router.get('/', getDashboard)

export default router

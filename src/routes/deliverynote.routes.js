/**
 * @openapi
 * tags:
 *   name: DeliveryNotes
 *   description: Gestión de albaranes
 */

/**
 * @openapi
 * /deliverynote:
 *   post:
 *     tags: [DeliveryNotes]
 *     summary: Crear un albarán
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [format, project, client, workDate]
 *             properties:
 *               format:      { type: string, enum: [material, hours] }
 *               project:     { type: string, description: "ID del proyecto" }
 *               client:      { type: string, description: "ID del cliente" }
 *               workDate:    { type: string, format: date, example: "2025-06-15" }
 *               description: { type: string }
 *               material:    { type: string, description: "Solo para format=material" }
 *               quantity:    { type: number, description: "Solo para format=material" }
 *               unit:        { type: string, description: "Solo para format=material" }
 *               hours:       { type: number, description: "Solo para format=hours" }
 *               workers:     { type: array, items: { $ref: '#/components/schemas/Worker' } }
 *     responses:
 *       201: { description: Albarán creado }
 *       400: { description: Validación fallida }
 *       401: { description: No autorizado }
 *       404: { description: Proyecto o cliente no encontrado }
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Listar albaranes
 *     parameters:
 *       - { in: query, name: page,    schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,   schema: { type: integer, default: 10 } }
 *       - { in: query, name: project, schema: { type: string } }
 *       - { in: query, name: client,  schema: { type: string } }
 *       - { in: query, name: format,  schema: { type: string, enum: [material, hours] } }
 *       - { in: query, name: signed,  schema: { type: boolean } }
 *       - { in: query, name: from,    schema: { type: string, format: date } }
 *       - { in: query, name: to,      schema: { type: string, format: date } }
 *       - { in: query, name: sort,    schema: { type: string, default: "-workDate" } }
 *     responses:
 *       200: { description: Lista de albaranes }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /deliverynote/pdf/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Descargar albarán en PDF
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Archivo PDF
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       302: { description: Redirect a PDF en la nube (si ya está firmado) }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 */

/**
 * @openapi
 * /deliverynote/{id}:
 *   get:
 *     tags: [DeliveryNotes]
 *     summary: Obtener un albarán concreto (con populate)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Albarán encontrado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *   delete:
 *     tags: [DeliveryNotes]
 *     summary: Borrar un albarán (solo si no está firmado)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Albarán eliminado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *       409: { description: No se puede borrar un albarán firmado }
 */

/**
 * @openapi
 * /deliverynote/{id}/sign:
 *   patch:
 *     tags: [DeliveryNotes]
 *     summary: Firmar un albarán (sube imagen de firma a Cloudinary y genera PDF)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (jpeg, png, webp)
 *     responses:
 *       200: { description: Albarán firmado con URLs de firma y PDF }
 *       400: { description: Falta imagen de firma }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *       409: { description: Ya está firmado }
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js'
import { uploadSignature } from '../middleware/upload.js'
import {
  createDeliveryNote, listDeliveryNotes, getDeliveryNote,
  downloadPdf, signDeliveryNote, deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js'

const router = Router()

router.use(protect)

// Static before :id
router.get('/pdf/:id', downloadPdf)

router.post('/',          validate(createDeliveryNoteSchema), createDeliveryNote)
router.get('/',           listDeliveryNotes)
router.get('/:id',        getDeliveryNote)
router.patch('/:id/sign', uploadSignature, signDeliveryNote)
router.delete('/:id',     deleteDeliveryNote)

export default router

/**
 * @openapi
 * tags:
 *   name: Clients
 *   description: Gestión de clientes
 */

/**
 * @openapi
 * /client:
 *   post:
 *     tags: [Clients]
 *     summary: Crear un cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, cif]
 *             properties:
 *               name:    { type: string, example: "Constructora García S.L." }
 *               cif:     { type: string, example: "B12345678" }
 *               email:   { type: string, format: email }
 *               phone:   { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201:
 *         description: Cliente creado
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 ok:     { type: boolean }
 *                 client: { $ref: '#/components/schemas/Client' }
 *       400: { description: Validación fallida, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: No autorizado }
 *       409: { description: CIF duplicado }
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes de la compañía
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: Búsqueda parcial por nombre
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: "-createdAt" }
 *     responses:
 *       200:
 *         description: Lista de clientes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - properties:
 *                     ok:      { type: boolean }
 *                     clients: { type: array, items: { $ref: '#/components/schemas/Client' } }
 *                 - $ref: '#/components/schemas/Pagination'
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /client/archived:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes archivados
 *     responses:
 *       200:
 *         description: Clientes archivados
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /client/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener un cliente concreto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cliente encontrado
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 ok:     { type: boolean }
 *                 client: { $ref: '#/components/schemas/Client' }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *   put:
 *     tags: [Clients]
 *     summary: Actualizar un cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name:    { type: string }
 *               cif:     { type: string }
 *               email:   { type: string }
 *               phone:   { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200: { description: Cliente actualizado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *   delete:
 *     tags: [Clients]
 *     summary: Archivar (soft) o borrar (hard) un cliente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *         description: true = archivo lógico, false = borrado físico
 *     responses:
 *       200: { description: Cliente eliminado/archivado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 */

/**
 * @openapi
 * /client/{id}/restore:
 *   patch:
 *     tags: [Clients]
 *     summary: Restaurar un cliente archivado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente restaurado }
 *       404: { description: No encontrado }
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js'
import {
  createClient, updateClient, listClients,
  listArchivedClients, getClient, deleteClient, restoreClient,
} from '../controllers/client.controller.js'

const router = Router()

router.use(protect)

router.get('/archived', listArchivedClients)

router.post('/',             validate(createClientSchema), createClient)
router.get('/',              listClients)
router.get('/:id',           getClient)
router.put('/:id',           validate(updateClientSchema), updateClient)
router.delete('/:id',        deleteClient)
router.patch('/:id/restore', restoreClient)

export default router

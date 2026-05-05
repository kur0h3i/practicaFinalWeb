/**
 * @openapi
 * tags:
 *   name: PG-Clients
 *   description: "BONUS: Gestión de clientes con PostgreSQL + Prisma"
 */

/**
 * @openapi
 * /pg/client:
 *   post:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Crear un cliente"
 *     description: Versión complementaria con Prisma ORM sobre PostgreSQL (Supabase).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, cif]
 *             properties:
 *               name: { type: string }
 *               cif:  { type: string }
 *               email: { type: string, format: email }
 *               phone: { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201: { description: Cliente creado en PostgreSQL }
 *       400: { description: DATABASE_URL no configurada }
 *       401: { description: No autorizado }
 *       409: { description: CIF duplicado }
 *   get:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Listar clientes"
 *     parameters:
 *       - { in: query, name: page,  schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: name,  schema: { type: string } }
 *     responses:
 *       200: { description: Lista de clientes desde PostgreSQL }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /pg/client/archived:
 *   get:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Listar clientes archivados"
 *     responses:
 *       200: { description: Clientes archivados }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /pg/client/{id}:
 *   get:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Obtener un cliente"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente encontrado }
 *       404: { description: No encontrado }
 *   put:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Actualizar un cliente"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente actualizado }
 *       404: { description: No encontrado }
 *   delete:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Archivar o borrar un cliente"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: soft, schema: { type: boolean, default: true } }
 *     responses:
 *       200: { description: Cliente eliminado/archivado }
 *       404: { description: No encontrado }
 */

/**
 * @openapi
 * /pg/client/{id}/restore:
 *   patch:
 *     tags: [PG-Clients]
 *     summary: "[PostgreSQL] Restaurar cliente archivado"
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Cliente restaurado }
 *       404: { description: No encontrado }
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js'
import {
  pgCreateClient, pgListClients, pgGetClient,
  pgUpdateClient, pgDeleteClient,
  pgListArchivedClients, pgRestoreClient,
} from '../controllers/pg-client.controller.js'

const router = Router()

router.use(protect)

router.get('/archived',      pgListArchivedClients)
router.post('/',             validate(createClientSchema), pgCreateClient)
router.get('/',              pgListClients)
router.get('/:id',           pgGetClient)
router.put('/:id',           validate(updateClientSchema), pgUpdateClient)
router.delete('/:id',        pgDeleteClient)
router.patch('/:id/restore', pgRestoreClient)

export default router

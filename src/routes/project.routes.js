/**
 * @openapi
 * tags:
 *   name: Projects
 *   description: Gestión de proyectos
 */

/**
 * @openapi
 * /project:
 *   post:
 *     tags: [Projects]
 *     summary: Crear un proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, projectCode, client]
 *             properties:
 *               name:        { type: string, example: "Reforma Nave Industrial" }
 *               projectCode: { type: string, example: "PRJ-001" }
 *               client:      { type: string, description: "ID del cliente" }
 *               address:     { $ref: '#/components/schemas/Address' }
 *               email:       { type: string, format: email }
 *               notes:       { type: string }
 *               active:      { type: boolean }
 *     responses:
 *       201: { description: Proyecto creado }
 *       400: { description: Validación fallida }
 *       401: { description: No autorizado }
 *       404: { description: Cliente no encontrado }
 *       409: { description: Código duplicado }
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos de la compañía
 *     parameters:
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 10 } }
 *       - { in: query, name: name,   schema: { type: string } }
 *       - { in: query, name: client, schema: { type: string }, description: "Filtrar por ID de cliente" }
 *       - { in: query, name: active, schema: { type: boolean } }
 *       - { in: query, name: sort,   schema: { type: string, default: "-createdAt" } }
 *     responses:
 *       200: { description: Lista de proyectos }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /project/archived:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos archivados
 *     responses:
 *       200: { description: Proyectos archivados }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /project/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Obtener un proyecto concreto
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto encontrado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *   patch:
 *     tags: [Projects]
 *     summary: Actualizar un proyecto (parcial)
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto actualizado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 *   delete:
 *     tags: [Projects]
 *     summary: Archivar (soft) o borrar (hard) un proyecto
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: soft, schema: { type: boolean, default: true } }
 *     responses:
 *       200: { description: Proyecto eliminado/archivado }
 *       401: { description: No autorizado }
 *       404: { description: No encontrado }
 */

/**
 * @openapi
 * /project/{id}/restore:
 *   patch:
 *     tags: [Projects]
 *     summary: Restaurar un proyecto archivado
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Proyecto restaurado }
 *       404: { description: No encontrado }
 */

import { Router } from 'express'
import { protect } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validate.js'
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js'
import {
  createProject, updateProject, listProjects,
  listArchivedProjects, getProject, deleteProject, restoreProject,
} from '../controllers/project.controller.js'

const router = Router()

router.use(protect)

router.get('/archived', listArchivedProjects)

router.post('/',             validate(createProjectSchema), createProject)
router.get('/',              listProjects)
router.get('/:id',           getProject)
router.patch('/:id',         validate(updateProjectSchema), updateProject)
router.delete('/:id',        deleteProject)
router.patch('/:id/restore', restoreProject)

export default router

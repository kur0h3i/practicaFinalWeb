/**
 * @openapi
 * tags:
 *   name: Users
 *   description: Autenticación y gestión de usuarios
 */

/**
 * @openapi
 * /user/register:
 *   post:
 *     tags: [Users]
 *     summary: Registrar nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "yo@test.com" }
 *               password: { type: string, example: "Password1!" }
 *     responses:
 *       201: { description: Usuario registrado }
 *       409: { description: Email ya registrado }
 *   put:
 *     tags: [Users]
 *     summary: Actualizar datos personales
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, lastName, nif]
 *             properties:
 *               name:     { type: string, example: "Pedro" }
 *               lastName: { type: string, example: "García" }
 *               nif:      { type: string, example: "12345678A" }
 *     responses:
 *       200: { description: Datos actualizados }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /user/login:
 *   post:
 *     tags: [Users]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: "yo@test.com" }
 *               password: { type: string, example: "Password1!" }
 *     responses:
 *       200: { description: Login correcto, devuelve accessToken y refreshToken }
 *       401: { description: Credenciales incorrectas }
 */

/**
 * @openapi
 * /user/validation:
 *   put:
 *     tags: [Users]
 *     summary: Verificar email con código
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [code]
 *             properties:
 *               code: { type: string, example: "123456" }
 *     responses:
 *       200: { description: Email verificado }
 *       400: { description: Código incorrecto }
 */

/**
 * @openapi
 * /user/refresh:
 *   post:
 *     tags: [Users]
 *     summary: Renovar access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Nuevos tokens }
 *       401: { description: Refresh token inválido }
 */

/**
 * @openapi
 * /user/company:
 *   patch:
 *     tags: [Users]
 *     summary: Crear o unirse a una compañía
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [isFreelance]
 *             properties:
 *               isFreelance: { type: boolean, example: false }
 *               cif:  { type: string, example: "B12345678" }
 *               name: { type: string, example: "Mi Empresa S.L." }
 *               address:
 *                 type: object
 *                 properties:
 *                   street:   { type: string, example: "Calle Mayor" }
 *                   number:   { type: string, example: "1" }
 *                   postal:   { type: string, example: "28001" }
 *                   city:     { type: string, example: "Madrid" }
 *                   province: { type: string, example: "Madrid" }
 *     responses:
 *       200: { description: Compañía creada o unido como guest }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /user/password:
 *   put:
 *     tags: [Users]
 *     summary: Cambiar contraseña
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: "Password1!" }
 *               newPassword:     { type: string, example: "NewPassword2!" }
 *     responses:
 *       200: { description: Contraseña actualizada }
 *       400: { description: Contraseña actual incorrecta }
 */

/**
 * @openapi
 * /user/logout:
 *   post:
 *     tags: [Users]
 *     summary: Cerrar sesión
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Sesión cerrada }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /user:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 *       401: { description: No autorizado }
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar cuenta
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: false }
 *         description: Si true hace soft-delete, si false elimina permanentemente
 *     responses:
 *       200: { description: Usuario eliminado }
 *       401: { description: No autorizado }
 */

/**
 * @openapi
 * /user/invite:
 *   post:
 *     tags: [Users]
 *     summary: Invitar usuario a la compañía (solo admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [email, name, lastName]
 *             properties:
 *               email:    { type: string, format: email }
 *               name:     { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201: { description: Usuario invitado }
 *       403: { description: Solo admins pueden invitar }
 */

/**
 * @openapi
 * /user/logo:
 *   patch:
 *     tags: [Users]
 *     summary: Subir logo de la compañía
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200: { description: Logo subido }
 *       401: { description: No autorizado }
 */

import { Router } from 'express'
import { protect }      from '../middleware/auth.middleware.js'
import { requireRole }  from '../middleware/role.middleware.js'
import { validate }     from '../middleware/validate.js'
import { uploadLogo }   from '../middleware/upload.js'
import {
  registerSchema, verificationSchema, loginSchema,
  personalDataSchema, companySchema, changePasswordSchema, inviteSchema
} from '../validators/user.validator.js'
import {
  register, verifyEmail, login, updatePersonalData,
  updateCompany, uploadCompanyLogo, getMe,
  refreshToken, logout, deleteUser, changePassword, inviteUser
} from '../controllers/user.controller.js'

const router = Router()

router.post('/register',  validate(registerSchema), register)
router.post('/login',     validate(loginSchema), login)
router.post('/refresh',   refreshToken)

router.use(protect)

router.put('/validation', validate(verificationSchema), verifyEmail)
router.put('/register',   validate(personalDataSchema), updatePersonalData)
router.patch('/company',  validate(companySchema), updateCompany)
router.patch('/logo',     uploadLogo, uploadCompanyLogo)
router.get('/',           getMe)
router.post('/logout',    logout)
router.delete('/',        deleteUser)
router.put('/password',   validate(changePasswordSchema), changePassword)
router.post('/invite',    requireRole('admin'), validate(inviteSchema), inviteUser)

export default router

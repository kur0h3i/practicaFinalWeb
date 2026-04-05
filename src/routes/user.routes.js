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

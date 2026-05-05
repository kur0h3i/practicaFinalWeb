import multer from 'multer'
import path from 'node:path'
import { config } from '../config/index.js'
import { AppError } from '../utils/AppError.js'

// ── Logo upload (disk storage) ───────────────────────────────────────────────
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.path),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `logo-${unique}${ext}`)
  },
})

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(AppError.badRequest('Solo se permiten imágenes (jpeg, png, webp, gif)'))
}

export const uploadLogo = multer({
  storage:    logoStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: config.upload.maxFileSize },
}).single('logo')

// ── Signature upload (memory storage — goes to Cloudinary) ──────────────────
const memoryStorage = multer.memoryStorage()

export const uploadSignature = multer({
  storage:    memoryStorage,
  fileFilter: imageFilter,
  limits:     { fileSize: config.upload.maxFileSize },
}).single('signature')

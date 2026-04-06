import multer from 'multer'
import path from 'node:path'
import { config } from '../config/index.js'
import { AppError } from '../utils/AppError.js'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, config.upload.path),
  filename:    (_req, file, cb) => {
    const ext    = path.extname(file.originalname)
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `logo-${unique}${ext}`)
  },
})

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(AppError.badRequest('Solo se permiten imágenes'))
}

export const uploadLogo = multer({ storage, fileFilter, limits: { fileSize: config.upload.maxFileSize } }).single('logo')

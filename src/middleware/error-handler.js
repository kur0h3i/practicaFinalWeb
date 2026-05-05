import { AppError } from '../utils/AppError.js'
import { notifySlack } from '../services/logger.service.js'

export const errorHandler = (err, req, res, _next) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo'
    err = AppError.conflict(`Ya existe un registro con ese ${field}`)
  }
  if (err.name === 'ValidationError') {
    const msg = Object.values(err.errors).map(e => e.message).join('; ')
    err = AppError.badRequest(msg, 'VALIDATION_ERROR')
  }
  if (err.name === 'CastError') {
    err = AppError.badRequest(`ID inválido: ${err.value}`, 'CAST_ERROR')
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    err = AppError.badRequest('Archivo demasiado grande (máx. 5 MB)')
  }

  const status  = err.statusCode || 500
  const code    = err.code       || 'INTERNAL_ERROR'
  const message = err.isOperational ? err.message : 'Error interno del servidor'

  if (!err.isOperational) console.error('[ERROR NO CONTROLADO]', err)

  // Notify Slack for all 5XX errors
  if (status >= 500) notifySlack(err, req)

  res.status(status).json({ ok: false, code, message })
}

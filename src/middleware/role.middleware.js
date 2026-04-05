import { AppError } from '../utils/AppError.js'

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(AppError.forbidden(`Se requiere rol: ${roles.join(', ')}`))
  }
  next()
}

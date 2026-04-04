import { AppError } from '../utils/AppError.js'

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const msg = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    return next(AppError.badRequest(msg, 'VALIDATION_ERROR'))
  }
  req.body = result.data
  next()
}

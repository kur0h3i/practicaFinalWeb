import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Token no proporcionado'))
    }
    const token = authHeader.split(' ')[1]
    let payload
    try {
      payload = jwt.verify(token, config.jwt.secret)
    } catch {
      return next(AppError.unauthorized('Token inválido o expirado'))
    }
    const user = await User.findById(payload.id)
    if (!user) return next(AppError.unauthorized('Usuario no encontrado'))
    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

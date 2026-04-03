import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { User } from '../models/User.js'

// BUG: si no viene Authorization header, explota con TypeError
export const protect = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]

  try {
    const payload = jwt.verify(token, config.jwt.secret)
    req.user = await User.findById(payload.id)
    next()
  } catch (err) {
    res.status(401).json({ error: 'token inválido' })
  }
}

import express         from 'express'
import helmet          from 'helmet'
import mongoSanitize   from 'express-mongo-sanitize'
import rateLimit       from 'express-rate-limit'
import path            from 'node:path'
import { fileURLToPath } from 'node:url'

import { errorHandler } from './middleware/error-handler.js'
import userRoutes       from './routes/user.routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(helmet())
app.use(mongoSanitize())

const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { ok: false, code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' }
})
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { ok: false, code: 'RATE_LIMIT', message: 'Demasiados intentos' }
})

app.use(globalLimit)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api/user/login',    authLimit)
app.use('/api/user/register', authLimit)
app.use('/api/user',          userRoutes)

app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }))
app.use(errorHandler)

export default app

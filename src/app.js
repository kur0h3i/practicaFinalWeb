import express           from 'express'
import { createServer }  from 'node:http'
import helmet            from 'helmet'
import rateLimit         from 'express-rate-limit'
import path              from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server }        from 'socket.io'
import jwt               from 'jsonwebtoken'
import swaggerUi         from 'swagger-ui-express'

import { config }         from './config/index.js'
import { swaggerSpec }    from './config/swagger.js'
import { errorHandler }   from './middleware/error-handler.js'
import userRoutes         from './routes/user.routes.js'
import clientRoutes       from './routes/client.routes.js'
import projectRoutes      from './routes/project.routes.js'
import deliverynoteRoutes from './routes/deliverynote.routes.js'
import dashboardRoutes    from './routes/dashboard.routes.js'
import pgClientRoutes    from './routes/pg-client.routes.js'
import { User }           from './models/User.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app        = express()
const httpServer = createServer(app)

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, { cors: { origin: '*' } })

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Token requerido'))
    const payload = jwt.verify(token, config.jwt.secret)
    const user    = await User.findById(payload.id).select('company')
    if (!user) return next(new Error('Usuario no encontrado'))
    socket.user = user
    if (user.company) socket.join(user.company.toString())
    next()
  } catch {
    next(new Error('Token inválido'))
  }
})

io.on('connection', (socket) => {
  console.log(`[WS] Usuario conectado: ${socket.user?._id}`)
  socket.on('disconnect', () => console.log(`[WS] Usuario desconectado: ${socket.user?._id}`))
})

app.set('io', io)

// ── Security middleware ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))

// Simple NoSQL injection sanitizer for req.body (express-mongo-sanitize is Express 4 only)
app.use((req, _res, next) => {
  const strip = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$')) { delete obj[key] }
        else { strip(obj[key]) }
      }
    }
  }
  if (req.body) strip(req.body)
  next()
})

const isTest = config.nodeEnv === 'test'
const globalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: isTest ? 10_000 : 100,
  message: { ok: false, code: 'RATE_LIMIT', message: 'Demasiadas solicitudes' },
})
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, max: isTest ? 10_000 : 20,
  message: { ok: false, code: 'RATE_LIMIT', message: 'Demasiados intentos' },
})

app.use(globalLimit)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ── Swagger ───────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/user/login',    authLimit)
app.use('/api/user/register', authLimit)
app.use('/api/user',          userRoutes)
app.use('/api/client',        clientRoutes)
app.use('/api/project',       projectRoutes)
app.use('/api/deliverynote',  deliverynoteRoutes)
app.use('/api/dashboard',    dashboardRoutes)
// BONUS: PostgreSQL + Prisma (complementario)
app.use('/api/pg/client',   pgClientRoutes)

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const mongoose = (await import('mongoose')).default
  res.json({
    status:    'ok',
    db:        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

app.use((_req, res) => res.status(404).json({ ok: false, message: 'Ruta no encontrada' }))
app.use(errorHandler)

export { app, httpServer, io }

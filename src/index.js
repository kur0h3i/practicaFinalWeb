import mongoose from 'mongoose'
import { httpServer, io } from './app.js'
import { config } from './config/index.js'

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('[BD] Conectado a MongoDB Atlas')

    const server = httpServer.listen(config.port, () => {
      console.log(`[SERVER] BildyApp corriendo en http://localhost:${config.port}`)
      console.log(`[DOCS]   Swagger disponible en http://localhost:${config.port}/api-docs`)
    })

    // ── Graceful shutdown ─────────────────────────────────────────────────────
    const shutdown = async (signal) => {
      console.log(`\n[SERVER] ${signal} recibido — cerrando servidor...`)
      server.close(async () => {
        try {
          io.close()
          await mongoose.connection.close()
          console.log('[SERVER] Shutdown completado')
          process.exit(0)
        } catch (err) {
          console.error('[SERVER] Error en shutdown:', err)
          process.exit(1)
        }
      })
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT',  () => shutdown('SIGINT'))

  } catch (err) {
    console.error('[FATAL]', err)
    process.exit(1)
  }
}

start()

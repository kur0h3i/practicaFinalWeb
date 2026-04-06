import mongoose from 'mongoose'
import app       from './app.js'
import { config } from './config/index.js'

const start = async () => {
  try {
    await mongoose.connect(config.mongoUri)
    console.log('[BD] Conectado a MongoDB Atlas')

    app.listen(config.port, () => {
      console.log(`[SERVER] BildyApp corriendo en http://localhost:${config.port}`)
    })
  } catch (err) {
    console.error('[FATAL]', err)
    process.exit(1)
  }
}

start()

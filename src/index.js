import express from 'express'
import mongoose from 'mongoose'

const app = express()
app.use(express.json())

const MONGO_URI = process.env.MONGODB_URI
if (!MONGO_URI) {
  console.error('falta MONGODB_URI en .env')
  process.exit(1)
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('conectado a mongo'))
  .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.json({ message: 'BildyApp API' })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('servidor corriendo')
})

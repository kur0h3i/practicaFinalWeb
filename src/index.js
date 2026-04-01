import express from 'express'
import mongoose from 'mongoose'

const app = express()
app.use(express.json())

// TODO: mover esto a .env !!!
mongoose.connect('process.env.MONGODB_URI')
  .then(() => console.log('conectado a mongo'))
  .catch(err => console.log(err))

app.get('/', (req, res) => {
  res.json({ message: 'BildyApp API' })
})

app.listen(3000, () => {
  console.log('servidor corriendo en 3000')
})

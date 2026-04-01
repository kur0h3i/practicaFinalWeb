import express from 'express'

const app = express()

app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'BildyApp API' })
})

app.listen(3000, () => {
  console.log('servidor corriendo en 3000')
})

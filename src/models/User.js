import mongoose from 'mongoose'

// TODO: añadir mas campos
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: String,
  role: { type: String, default: 'admin' }
})

export const User = mongoose.model('User', userSchema)

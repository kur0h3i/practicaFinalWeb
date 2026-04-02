import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, trim: true },
  lastName: { type: String, trim: true },
  nif: { type: String, trim: true },
  role: { type: String, enum: ['admin', 'guest'], default: 'admin' },
  status: { type: String, enum: ['pending', 'verified'], default: 'pending' },
  verificationCode: { type: String, select: false },
  verificationAttempts: { type: Number, default: 3, select: false },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  deleted: { type: Boolean, default: false }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

userSchema.virtual('fullName').get(function() {
  return `${this.name} ${this.lastName}`
})

export const User = mongoose.model('User', userSchema)

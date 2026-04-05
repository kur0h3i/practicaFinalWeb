import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  name:     { type: String, trim: true },
  lastName: { type: String, trim: true },
  nif:      { type: String, trim: true },
  role:     { type: String, enum: ['admin', 'guest'], default: 'admin', index: true },
  status:   { type: String, enum: ['pending', 'verified'], default: 'pending', index: true },
  verificationCode:     { type: String, select: false },
  verificationAttempts: { type: Number, default: 3, select: false },
  company:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  address: {
    street: String, number: String,
    postal: String, city: String, province: String
  },
  refreshToken: { type: String, select: false },
  deleted:      { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON:   { virtuals: true },
  toObject: { virtuals: true },
})

userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`
  return this.name || ''
})

userSchema.pre(/^find/, function (next) {
  if (!this._skipDeletedFilter) this.where({ deleted: false })
  next()
})

export const User = mongoose.model('User', userSchema)

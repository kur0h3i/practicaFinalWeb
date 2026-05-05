import mongoose from 'mongoose'

const clientSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:    { type: String, required: true, trim: true },
  cif:     { type: String, required: true, trim: true },
  email:   { type: String, trim: true, lowercase: true },
  phone:   { type: String, trim: true },
  address: {
    street:   String,
    number:   String,
    postal:   String,
    city:     String,
    province: String,
  },
  deleted: { type: Boolean, default: false },
}, { timestamps: true })

// Unique CIF per company
clientSchema.index({ company: 1, cif: 1 }, { unique: true })

clientSchema.pre(/^find/, function (next) {
  if (!this.options._skipDeletedFilter) this.where({ deleted: false })
  next()
})

export const Client = mongoose.model('Client', clientSchema)

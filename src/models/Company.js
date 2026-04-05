import mongoose from 'mongoose'

const companySchema = new mongoose.Schema({
  owner:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, required: true, trim: true },
  cif:        { type: String, required: true, unique: true, trim: true },
  address: {
    street: String, number: String,
    postal: String, city: String, province: String
  },
  logo:        { type: String, default: null },
  isFreelance: { type: Boolean, default: false },
  deleted:     { type: Boolean, default: false },
}, { timestamps: true })

companySchema.pre(/^find/, function (next) {
  if (!this._skipDeletedFilter) this.where({ deleted: false })
  next()
})

export const Company = mongoose.model('Company', companySchema)

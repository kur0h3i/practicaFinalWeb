import mongoose from 'mongoose'

const projectSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true, index: true },
  name:         { type: String, required: true, trim: true },
  projectCode:  { type: String, required: true, trim: true },
  address: {
    street:   String,
    number:   String,
    postal:   String,
    city:     String,
    province: String,
  },
  email:   { type: String, trim: true, lowercase: true },
  notes:   { type: String, trim: true },
  active:  { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
}, { timestamps: true })

// Unique projectCode per company
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true })

projectSchema.pre(/^find/, function (next) {
  if (!this.options._skipDeletedFilter) this.where({ deleted: false })
  next()
})

export const Project = mongoose.model('Project', projectSchema)

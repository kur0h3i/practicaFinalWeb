import mongoose from 'mongoose'

const workerSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  hours: { type: Number, required: true, min: 0 },
}, { _id: false })

const deliveryNoteSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true, index: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },

  format:      { type: String, enum: ['material', 'hours'], required: true },
  description: { type: String, trim: true },
  workDate:    { type: Date, required: true },

  // material fields
  material: { type: String, trim: true },
  quantity: { type: Number, min: 0 },
  unit:     { type: String, trim: true },

  // hours fields
  hours:   { type: Number, min: 0 },
  workers: [workerSchema],

  // signature / PDF
  signed:       { type: Boolean, default: false },
  signedAt:     { type: Date },
  signatureUrl: { type: String },
  pdfUrl:       { type: String },

  deleted: { type: Boolean, default: false },
}, { timestamps: true })

deliveryNoteSchema.pre(/^find/, function (next) {
  if (!this.options._skipDeletedFilter) this.where({ deleted: false })
  next()
})

export const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema)

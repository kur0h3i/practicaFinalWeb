import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config/index.js'

let configured = false

const ensureConfigured = () => {
  if (configured) return
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key:    config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  })
  configured = true
}

export const uploadBuffer = (buffer, options = {}) => {
  ensureConfigured()
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
    stream.end(buffer)
  })
}

export const uploadSignature = async (buffer) => {
  const result = await uploadBuffer(buffer, {
    folder:          'bildyapp/signatures',
    resource_type:   'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  })
  return result.secure_url
}

export const uploadPdf = async (buffer) => {
  const result = await uploadBuffer(buffer, {
    folder:        'bildyapp/pdfs',
    resource_type: 'raw',
    format:        'pdf',
  })
  return result.secure_url
}

export const deleteFile = async (publicId, resourceType = 'image') => {
  ensureConfigured()
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}

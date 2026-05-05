export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'changeme_refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  upload: {
    path: process.env.UPLOAD_PATH || 'uploads',
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024,
  },
  cloudinary: {
    cloudName:  process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:     process.env.CLOUDINARY_API_KEY,
    apiSecret:  process.env.CLOUDINARY_API_SECRET,
  },
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL,
  },
  databaseUrl: process.env.DATABASE_URL,   // PostgreSQL (Prisma)
  mail: {
    host:   process.env.MAIL_HOST   || 'smtp.mailtrap.io',
    port:   Number(process.env.MAIL_PORT)  || 587,
    user:   process.env.MAIL_USER,
    pass:   process.env.MAIL_PASS,
    from:   process.env.MAIL_FROM   || 'noreply@bildyapp.com',
  },
}

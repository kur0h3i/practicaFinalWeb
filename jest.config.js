export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    // Exclude services that require live external credentials (Cloudinary, Slack, SMTP)
    '!src/services/storage.service.js',
    '!src/services/mail.service.js',
    '!src/services/logger.service.js',
    // Exclude entry point (not business logic)
    '!src/index.js',
    // Exclude PostgreSQL/Prisma (requires live DATABASE_URL, not available in test env)
    '!src/config/prisma.js',
    '!src/controllers/pg-client.controller.js',
    // Exclude app.js socket.io bootstrap (non-testable without a live WS client)
    '!src/app.js',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60, statements: 70 },
  },
  testTimeout: 30000,
}

import { PrismaClient } from '@prisma/client'
import { config } from './index.js'

let prisma

/**
 * Devuelve una instancia singleton de PrismaClient.
 * Si DATABASE_URL no está configurada, retorna null (modo degradado).
 */
export const getPrisma = () => {
  if (!config.databaseUrl) return null
  if (!prisma) {
    prisma = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['error', 'warn'] : ['error'],
    })
  }
  return prisma
}

export const disconnectPrisma = async () => {
  if (prisma) await prisma.$disconnect()
}

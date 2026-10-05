import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // Prisma 7 requires using an adapter for PostgreSQL
  // Ensure the connection string is properly formatted as a string
  const connectionString = String(process.env.DATABASE_URL || '')
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // PrismaPg adapter accepts connectionString directly
  // It handles connection string parsing internally including special characters
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

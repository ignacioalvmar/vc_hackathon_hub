import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/prisma.ts:5',message:'prismaClientSingleton entry',data:{dbUrlPresent:!!process.env.DATABASE_URL,dbUrlValue:process.env.DATABASE_URL?.substring(0,30)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime-debug-post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const connectionString = process.env.DATABASE_URL?.replace("file:", "") || "dev.db"
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/prisma.ts:8',message:'before adapter creation',data:{connectionString},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime-debug-post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const adapter = new PrismaBetterSqlite3({ url: connectionString })
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/prisma.ts:11',message:'before PrismaClient construction',data:{adapterType:typeof adapter},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime-debug-post-fix',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    const client = new PrismaClient({ adapter })
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/prisma.ts:15',message:'PrismaClient constructed successfully',data:{clientType:typeof client},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime-debug-post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return client
  } catch (e: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'src/lib/prisma.ts:20',message:'PrismaClient construction error',data:{error:e.message,errorName:e.name,stack:e.stack?.substring(0,200)},timestamp:Date.now(),sessionId:'debug-session',runId:'runtime-debug-post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throw e
  }
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

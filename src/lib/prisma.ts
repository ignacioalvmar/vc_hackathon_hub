import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prismaClientSingleton = () => {
  // #region agent log
  try {
    const logData = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:6',message:'PrismaClient singleton called',data:{dbUrlPresent:!!process.env.DATABASE_URL,dbUrlLength:process.env.DATABASE_URL?.length || 0}};
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
  } catch(e) {}
  // #endregion
  try {
    // #region agent log
    try {
      const logData2 = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:12',message:'Before adapter and PrismaClient construction',data:{}};
      fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    // Prisma 7 requires using an adapter for PostgreSQL
    // Ensure the connection string is properly formatted as a string
    const connectionString = String(process.env.DATABASE_URL || '')
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }
    // #region agent log
    try {
      const logConnectionString = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:20',message:'Connection string extracted',data:{hasConnectionString:!!connectionString,connectionStringLength:connectionString.length,connectionStringStart:connectionString?.substring(0,40)}};
      fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logConnectionString)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    // PrismaPg adapter accepts connectionString directly
    // It handles connection string parsing internally including special characters
    const adapter = new PrismaPg({ connectionString })
    // #region agent log
    try {
      const logAdapterCreated = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:29',message:'Adapter created',data:{}};
      fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAdapterCreated)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    const client = new PrismaClient({ adapter })
    // #region agent log
    try {
      const logData3 = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:33',message:'PrismaClient constructed successfully with adapter',data:{}};
      fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    return client
  } catch (error: any) {
    // #region agent log
    try {
      const logErr = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:38',message:'PrismaClient construction error',data:{error:error?.message,errorName:error?.name,errorCode:error?.errorCode,stack:error?.stack?.substring(0,400)}};
      fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logErr)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    throw error
  }
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

// #region agent log
try {
  const logData4 = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-4',hypothesisId:'C',location:'src/lib/prisma.ts:53',message:'Before prisma singleton call',data:{hasGlobalPrisma:!!globalForPrisma.prisma}};
  fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData4)}).catch(()=>{});
} catch(e) {}
// #endregion

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

import { writeFileSync, appendFileSync } from "fs";
import { resolve } from "path";

// #region agent log
try {
  const logPath = resolve(process.cwd(), ".cursor", "debug.log");
  const logEntry = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'A',location:'scripts/make-admin.ts:1',message:'Script entry - before dotenv',data:{cwd:process.cwd(),argv:process.argv.slice(2)}};
  appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
} catch(e) {}
// #endregion

// CRITICAL: Load dotenv BEFORE any other imports that might use process.env
import { config } from "dotenv";
import { existsSync } from "fs";

// #region agent log
try {
  const logPath = resolve(process.cwd(), ".cursor", "debug.log");
  const logBeforeDotenv = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'B',location:'scripts/make-admin.ts:12',message:'Before dotenv config',data:{cwd:process.cwd(),hasDotenvPackage:!!config}};
  appendFileSync(logPath, JSON.stringify(logBeforeDotenv) + '\n');
} catch(e) {}
// #endregion

// Try multiple path resolution methods for .env file
const cwd = process.cwd();
const envPath1 = resolve(cwd, ".env");
const envPath2 = resolve(cwd, "..", ".env");

// #region agent log
try {
  const logPath = resolve(process.cwd(), ".cursor", "debug.log");
  const logPaths = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'C',location:'scripts/make-admin.ts:22',message:'Calculated env paths',data:{cwd,envPath1,envPath2,exists1:existsSync(envPath1),exists2:existsSync(envPath2)}};
  appendFileSync(logPath, JSON.stringify(logPaths) + '\n');
} catch(e) {}
// #endregion

// Load environment variables from .env file - try both paths
let result1 = null;
let result2 = null;
if (existsSync(envPath1)) {
  result1 = config({ path: envPath1 });
}
if (existsSync(envPath2)) {
  result2 = config({ path: envPath2 });
}
// Also try default location (current working directory)
if (!result1 && !result2) {
  result1 = config();
}

// #region agent log
try {
  const logPath = resolve(process.cwd(), ".cursor", "debug.log");
  const logAfterDotenv = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'D',location:'scripts/make-admin.ts:37',message:'After dotenv config',data:{result1Error:result1?.error?.message,result2Error:result2?.error?.message,hasDbUrl:!!process.env.DATABASE_URL,dbUrlLength:process.env.DATABASE_URL?.length || 0,dbUrlStart:process.env.DATABASE_URL?.substring(0,20) || 'none',allEnvKeys:Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB'))}};
  appendFileSync(logPath, JSON.stringify(logAfterDotenv) + '\n');
} catch(e) {}
// #endregion

// #region agent log
try {
  const logPath = resolve(process.cwd(), ".cursor", "debug.log");
  const logBeforePrismaImport = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'E',location:'scripts/make-admin.ts:59',message:'Before prisma import',data:{hasDbUrl:!!process.env.DATABASE_URL}};
  appendFileSync(logPath, JSON.stringify(logBeforePrismaImport) + '\n');
} catch(e) {}
// #endregion

// Use dynamic import AFTER dotenv loads to ensure DATABASE_URL is available
let prisma: any;
async function loadPrisma() {
  const prismaModule = await import("../src/lib/prisma");
  prisma = prismaModule.default;
  // #region agent log
  try {
    const logPath = resolve(process.cwd(), ".cursor", "debug.log");
    const logAfterPrismaImport = {timestamp:Date.now(),sessionId:'debug-session',runId:'env-debug-2',hypothesisId:'E',location:'scripts/make-admin.ts:67',message:'After prisma import',data:{hasDbUrl:!!process.env.DATABASE_URL,hasPrisma:!!prisma}};
    appendFileSync(logPath, JSON.stringify(logAfterPrismaImport) + '\n');
  } catch(e) {}
  // #endregion
}

async function makeAdmin(email: string, name?: string) {
  try {
    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to ADMIN
      const user = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      console.log(`✅ Successfully updated user ${email} to ADMIN role`);
      console.log(`User: ${user.name || "N/A"} (${user.email})`);
    } else {
      // Create new user with ADMIN role
      const user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          role: "ADMIN",
        },
      });
      console.log(`✅ Successfully created new admin user`);
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`Role: ${user.role}`);
      console.log(`\n⚠️  Note: This app uses GitHub OAuth for authentication.`);
      console.log(`   When logging in, use a GitHub account with email: ${email}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error("❌ Unknown error:", error);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
(async () => {
  await loadPrisma();
  
  const email = process.argv[2];
  const name = process.argv[3];

  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: npx tsx scripts/make-admin.ts <email> [name]");
    process.exit(1);
  }

  await makeAdmin(email, name);
})();


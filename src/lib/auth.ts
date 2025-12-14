import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import prisma from "@/lib/prisma"

// #region agent log
try {
    const logAuthInit = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'D',location:'src/lib/auth.ts:6',message:'authOptions initialization start',data:{prismaPresent:!!prisma}};
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAuthInit)}).catch(()=>{});
} catch(e) {}
// #endregion

export const authOptions: NextAuthOptions = {
    // #region agent log
    adapter: (() => {
        try {
            const logAdapter = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'D',location:'src/lib/auth.ts:13',message:'Before PrismaAdapter creation',data:{}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAdapter)}).catch(()=>{});
            const adapter = PrismaAdapter(prisma);
            const logAdapterSuccess = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'D',location:'src/lib/auth.ts:16',message:'PrismaAdapter created successfully',data:{}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAdapterSuccess)}).catch(()=>{});
            return adapter;
        } catch (error: any) {
            const logAdapterError = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'D',location:'src/lib/auth.ts:20',message:'PrismaAdapter creation error',data:{error:error?.message,errorName:error?.name}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logAdapterError)}).catch(()=>{});
            throw error;
        }
    })(),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "",
            clientSecret: process.env.GITHUB_SECRET || "",
        }),
    ],
    callbacks: {
        async redirect({ url, baseUrl }) {
            // #region agent log
            try {
                const logData = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/lib/auth.ts:16',message:'redirect callback called',data:{url,baseUrl,urlType:typeof url,baseUrlType:typeof baseUrl}};
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
            } catch(e) {}
            // #endregion
            // Allow relative callback URLs
            if (url.startsWith("/")) {
                const result = `${baseUrl}${url}`;
                // #region agent log
                try {
                    const logData2 = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/lib/auth.ts:22',message:'redirect: relative URL path',data:{result}};
                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
                } catch(e) {}
                // #endregion
                return result;
            }
            // Allow callback URLs on the same origin
            try {
                if (new URL(url).origin === baseUrl) {
                    // #region agent log
                    try {
                        const logData3 = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/lib/auth.ts:30',message:'redirect: same origin URL',data:{url}};
                        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData3)}).catch(()=>{});
                    } catch(e) {}
                    // #endregion
                    return url;
                }
            } catch (e) {
                // #region agent log
                try {
                    const logErr = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/lib/auth.ts:37',message:'redirect: URL parse error',data:{error:(e as Error).message,url}};
                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logErr)}).catch(()=>{});
                } catch(e2) {}
                // #endregion
            }
            // Default to dashboard for sign-in
            const defaultRedirect = `${baseUrl}/dashboard`;
            // #region agent log
            try {
                const logData4 = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/lib/auth.ts:44',message:'redirect: default to dashboard',data:{defaultRedirect}};
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData4)}).catch(()=>{});
            } catch(e) {}
            // #endregion
            return defaultRedirect;
        },
        async session({ session, user }) {
            if (session.user) {
                session.user.id = user.id;
                // Always fetch the latest role from database to ensure it's up-to-date
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: { role: true }
                });
                // @ts-ignore // Role is added to User model but not default NextAuth types yet
                session.user.role = dbUser?.role || user.role;
            }
            return session
        },
    },
}

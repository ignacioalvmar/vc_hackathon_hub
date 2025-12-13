import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

async function authHandler(req: Request, context: any) {
    // #region agent log
    try {
        const url = new URL(req.url);
        const logData = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:7',message:'NextAuth handler called',data:{pathname:url.pathname,search:url.search,method:req.method}};
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    try {
        const result = await handler(req, context);
        // #region agent log
        try {
            const logData2 = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:14',message:'NextAuth handler success',data:{status:result?.status,statusText:result?.statusText}};
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        return result;
    } catch (error) {
        // #region agent log
        try {
            const logErr = {timestamp:Date.now(),sessionId:'debug-session',runId:'oauth-redirect-debug',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:20',message:'NextAuth handler error',data:{error:(error as Error).message,stack:(error as Error).stack?.substring(0,200)}};
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logErr)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        console.error("NextAuth Handler Error:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error", details: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export { authHandler as GET, authHandler as POST }

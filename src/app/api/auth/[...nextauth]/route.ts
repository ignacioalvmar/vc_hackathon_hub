import { authOptions } from "@/lib/auth"
import NextAuth from "next-auth"

// #region agent log
try {
    const logInit = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'B',location:'src/app/api/auth/[...nextauth]/route.ts:4',message:'NextAuth handler initialization',data:{}};
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logInit)}).catch(()=>{});
} catch(e) {}
// #endregion

const handler = NextAuth(authOptions)

async function authHandler(req: Request, context: { params: Promise<{ nextauth?: string[] }> }) {
    // #region agent log
    try {
        const url = new URL(req.url);
        const logData = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:13',message:'authHandler entry',data:{pathname:url.pathname,method:req.method}};
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    } catch(e) {}
    // #endregion
    try {
        // #region agent log
        try {
            const logParams = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:19',message:'Before params await',data:{}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logParams)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        // Resolve the params promise for Next.js 16 compatibility
        const params = await context.params;
        // #region agent log
        try {
            const logParamsResolved = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:23',message:'Params resolved',data:{nextauth:params?.nextauth}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logParamsResolved)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        // #region agent log
        try {
            const logBeforeHandler = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:27',message:'Before NextAuth handler call',data:{}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logBeforeHandler)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        // Pass the context with resolved params to NextAuth
        const result = await handler(req, { params });
        // #region agent log
        try {
            const logSuccess = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:33',message:'NextAuth handler success',data:{status:result?.status,statusText:result?.statusText}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logSuccess)}).catch(()=>{});
        } catch(e) {}
        // #endregion
        return result;
    } catch (error: any) {
        // #region agent log
        try {
            const logErr = {timestamp:Date.now(),sessionId:'debug-session',runId:'auth-debug-1',hypothesisId:'C',location:'src/app/api/auth/[...nextauth]/route.ts:40',message:'authHandler error',data:{error:error?.message,errorName:error?.name,stack:error?.stack?.substring(0,300)}};
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logErr)}).catch(()=>{});
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

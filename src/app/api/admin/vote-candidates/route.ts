import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:6',message:'POST vote-candidates entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const session = await getServerSession(authOptions)
    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:10',message:'POST vote-candidates unauthorized',data:{hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { enrollmentIds } = await req.json()
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:16',message:'POST vote-candidates request data',data:{enrollmentIds,isArray:Array.isArray(enrollmentIds),count:enrollmentIds?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (!Array.isArray(enrollmentIds)) {
            return new NextResponse("Invalid request: enrollmentIds must be an array", { status: 400 })
        }

        // First, set all enrollments to false
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:25',message:'POST vote-candidates before updateMany false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        await prisma.enrollment.updateMany({
            data: { isVotingCandidate: false }
        })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:29',message:'POST vote-candidates after updateMany false',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        // Then, set selected enrollments to true
        if (enrollmentIds.length > 0) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:33',message:'POST vote-candidates before updateMany true',data:{enrollmentIds},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            await prisma.enrollment.updateMany({
                where: { id: { in: enrollmentIds } },
                data: { isVotingCandidate: true }
            })
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:38',message:'POST vote-candidates after updateMany true',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
        }

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:42',message:'POST vote-candidates success',data:{selectedCount:enrollmentIds.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return NextResponse.json({ success: true, selectedCount: enrollmentIds.length })
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-candidates/route.ts:45',message:'POST vote-candidates error',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error("[VOTE_CANDIDATES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

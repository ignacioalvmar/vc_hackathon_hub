import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:6',message:'GET vote-control entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const session = await getServerSession(authOptions)
    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:10',message:'GET vote-control unauthorized',data:{hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
        const isOpen = votingOpenConfig?.value === "true"
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:16',message:'GET vote-control before count',data:{isOpen},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        const candidateCount = await prisma.enrollment.count({
            where: { isVotingCandidate: true }
        })
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:20',message:'GET vote-control after count',data:{candidateCount},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        return NextResponse.json({ 
            isOpen, 
            candidateCount 
        })
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:28',message:'GET vote-control error',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error("[VOTE_CONTROL_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const { action } = await req.json() // "OPEN" | "CLOSE" | "REVEAL" | "HIDE"

    if (action === "OPEN" || action === "CLOSE") {
        const votingValue = action === "OPEN" ? "true" : "false";
        await prisma.repoConfig.upsert({
            where: { key: "VOTING_OPEN" },
            update: { value: votingValue },
            create: { key: "VOTING_OPEN", value: votingValue }
        })
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vote-control/route.ts:60',message:'Voting status saved to DB',data:{action,votingValue},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
    }

    // Simplification: We strictly use RepoConfig for these states

    return NextResponse.json({ success: true })
}

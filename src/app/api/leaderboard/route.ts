import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Force dynamic rendering - prevent caching in production (Vercel)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Get leaderboard rankings
export async function GET(req: Request) {
    try {
        // ... existing code ...
        
        // Fetch event deadline
        const deadlineConfig = await prisma.repoConfig.findUnique({ 
            where: { key: "EVENT_DEADLINE" } 
        });
        const eventDeadline = deadlineConfig?.value || null;
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/leaderboard/route.ts:89',message:'API returning leaderboard data',data:{rankingsCount:rankings.length,isVotingOpen,eventDeadline,hasVoteCounts:rankings.some(r=>r.voteCount>0)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'E'})}).catch(()=>{});
        // #endregion

        const response = NextResponse.json({
            rankings,
            isVotingOpen,
            totalMilestones: milestones.length,
            eventDeadline
        });
        
        // Prevent caching in production (Vercel)
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        response.headers.set('Surrogate-Control', 'no-store');
        
        return response;
    } catch (error) {
        // ... existing error handling ...
    }
}

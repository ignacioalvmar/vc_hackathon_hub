import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Force dynamic rendering - prevent caching in production (Vercel)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET: Get leaderboard rankings
export async function GET(req: Request) {
    try {
        // Check if voting is open
        const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } });
        const isVotingOpen = votingOpenConfig?.value === "true";
        
        // Fetch event deadline
        const deadlineConfig = await prisma.repoConfig.findUnique({ 
            where: { key: "EVENT_DEADLINE" } 
        });
        const eventDeadline = deadlineConfig?.value || null;

        // When voting is open, only show candidates; otherwise show all enrollments
        const enrollments = await prisma.enrollment.findMany({
            where: isVotingOpen ? { isVotingCandidate: true } : undefined,
            include: {
                user: true,
                activities: {
                    include: { milestone: true }
                }
            }
        });

        const milestones = await prisma.milestone.findMany({ orderBy: { order: "asc" } });

        // Get vote counts for each enrollment if voting is open
        let voteCountMap = new Map<string, number>();
        if (isVotingOpen) {
            const voteCounts = await prisma.vote.groupBy({
                by: ['candidateId'],
                _count: {
                    candidateId: true
                }
            });
            voteCountMap = new Map(voteCounts.map(v => [v.candidateId, v._count.candidateId]));
        }

        // Calculate scores
        const rankings = enrollments.map(e => {
            const completed = new Set(e.activities.map(a => a.milestoneId));

            // Calculate Score
            let score = 0;
            milestones.forEach(m => {
                if (completed.has(m.id)) {
                    score += m.points;
                }
            });

            // Find time of last completed milestone (tie-breaker)
            const sortedActivities = e.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            const lastActivityTime = sortedActivities.length > 0 ? sortedActivities[0].timestamp.getTime() : 0;

            return {
                id: e.id,
                user: {
                    name: e.user.name,
                    image: e.user.image
                },
                score: score,
                completedCount: completed.size,
                lastActivityTime: lastActivityTime,
                voteCount: isVotingOpen ? (voteCountMap.get(e.id) || 0) : 0
            };
        });

        // Sort: During voting, sort by votes (descending), then by score; otherwise by score
        rankings.sort((a, b) => {
            if (isVotingOpen) {
                // During voting: sort by votes first (most votes at top)
                if (b.voteCount !== a.voteCount) {
                    return (b.voteCount || 0) - (a.voteCount || 0);
                }
                // Tie-breaker: higher score
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
            } else {
                // Normal mode: Higher score first
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
            }
            return a.lastActivityTime - b.lastActivityTime; // Lower (earlier) time wins tie
        });

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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import LeaderboardClient from "./leaderboard-client";

export const revalidate = 30; // Revalidate page every 30 seconds

export default async function LeaderboardPage() {
    const session = await getServerSession(authOptions);

    const enrollments = await prisma.enrollment.findMany({
        include: {
            user: true,
            activities: {
                include: { milestone: true }
            }
        }
    });

    const milestones = await prisma.milestone.findMany({ orderBy: { order: "asc" } });

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

        // Total duration (Advanced tie-breaker logic - skipped for MVP)

        return {
            id: e.id,
            user: e.user,
            score: score,
            completedCount: completed.size,
            lastActivityTime: lastActivityTime,
            activities: e.activities.map(a => ({
                ...a,
                timestamp: a.timestamp.toISOString()
            }))
        };
    });

    // Sort: Higher score first, then earlier completion time
    rankings.sort((a, b) => {
        if (b.score !== a.score) {
            return b.score - a.score;
        }
        return a.lastActivityTime - b.lastActivityTime; // Lower (earlier) time wins tie
    });

    return <LeaderboardClient initialRankings={rankings} totalMilestones={milestones.length} />;
}

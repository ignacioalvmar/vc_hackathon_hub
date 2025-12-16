import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        // Check if voting is open
        const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
        const isVotingOpen = votingOpenConfig?.value === "true"

        const enrollments = await prisma.enrollment.findMany({
            include: {
                user: true,
                activities: {
                    include: {
                        milestone: true
                    }
                },
                votes: true // Include votes to count them
            }
        })

        // Fetch milestones for score calculation
        const milestones = await prisma.milestone.findMany({ orderBy: { order: "asc" } })

        // Get vote counts for each enrollment
        const voteCounts = await prisma.vote.groupBy({
            by: ['candidateId'],
            _count: {
                candidateId: true
            }
        })

        const voteCountMap = new Map(voteCounts.map(v => [v.candidateId, v._count.candidateId]))

        // Calculate scores and lastActivityTime for each enrollment (same logic as leaderboard)
        const enrollmentsWithRanking = enrollments.map(e => {
            const completed = new Set(e.activities.map(a => a.milestoneId))

            // Calculate Score (sum of milestone points for completed milestones)
            let score = 0
            milestones.forEach(m => {
                if (completed.has(m.id)) {
                    score += m.points
                }
            })

            // Find time of last completed milestone (tie-breaker)
            const sortedActivities = e.activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            const lastActivityTime = sortedActivities.length > 0 ? sortedActivities[0].timestamp.getTime() : 0

            return {
                enrollment: e,
                score,
                lastActivityTime,
                voteCount: isVotingOpen ? (voteCountMap.get(e.id) || 0) : 0
            }
        })

        // Sort: During voting, sort by votes (descending), then by score; otherwise by score
        // Same logic as leaderboard (src/app/leaderboard/page.tsx lines 75-93)
        enrollmentsWithRanking.sort((a, b) => {
            if (isVotingOpen) {
                // During voting: sort by votes first (most votes at top)
                if (b.voteCount !== a.voteCount) {
                    return (b.voteCount || 0) - (a.voteCount || 0)
                }
                // Tie-breaker: higher score
                if (b.score !== a.score) {
                    return b.score - a.score
                }
            } else {
                // Normal mode: Higher score first
                if (b.score !== a.score) {
                    return b.score - a.score
                }
            }
            return a.lastActivityTime - b.lastActivityTime // Lower (earlier) time wins tie
        })

        // Serialize dates and return sorted enrollments
        const enrollmentsData = enrollmentsWithRanking.map(({ enrollment: e, voteCount }) => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            voteCount,
            activities: e.activities.map(a => ({
                ...a,
                timestamp: a.timestamp.toISOString(),
                milestone: {
                    ...a.milestone,
                    createdAt: a.milestone.createdAt.toISOString(),
                    updatedAt: a.milestone.updatedAt.toISOString()
                }
            }))
        }))

        return NextResponse.json(enrollmentsData)
    } catch (error) {
        console.error("[ENROLLMENTS_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)

    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const enrollmentId = searchParams.get("id")

        if (!enrollmentId) {
            return new NextResponse("Enrollment ID is required", { status: 400 })
        }

        // Delete the enrollment (cascade will handle activities and votes)
        await prisma.enrollment.delete({
            where: { id: enrollmentId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[ENROLLMENTS_DELETE]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}


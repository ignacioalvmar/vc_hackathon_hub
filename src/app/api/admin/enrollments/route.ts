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

        // Get vote counts for each enrollment
        const voteCounts = await prisma.vote.groupBy({
            by: ['candidateId'],
            _count: {
                candidateId: true
            }
        })

        const voteCountMap = new Map(voteCounts.map(v => [v.candidateId, v._count.candidateId]))

        // Serialize dates
        const enrollmentsData = enrollments.map(e => ({
            ...e,
            createdAt: e.createdAt.toISOString(),
            updatedAt: e.updatedAt.toISOString(),
            voteCount: isVotingOpen ? (voteCountMap.get(e.id) || 0) : 0,
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


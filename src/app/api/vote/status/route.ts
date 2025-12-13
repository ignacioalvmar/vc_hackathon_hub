import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: Get voting status and user's vote
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // Check status
    const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
    const isOpen = votingOpenConfig?.value === "true"

    // Only get candidates (selected enrollments)
    const candidates = await prisma.enrollment.findMany({
        where: { isVotingCandidate: true },
        include: { user: true }
    })

    // If user has voted, return their vote
    let myVote = null
    if (session?.user?.id) {
        myVote = await prisma.vote.findUnique({
            where: { voterId: session.user.id }
        })
    }

    return NextResponse.json({
        isOpen,
        candidates: candidates.map(c => ({
            id: c.id,
            name: c.user.name,
            image: c.user.image,
            repoUrl: c.repoUrl
        })),
        myVoteId: myVote?.candidateId || null
    })
}

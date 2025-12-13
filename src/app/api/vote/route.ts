import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET: Check if voting is open and get candidates
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // Check status
    const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
    const isOpen = votingOpenConfig?.value === "true"

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
        myVoteId: myVote?.candidateId
    })
}

// POST: Cast a vote
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    // Check availability
    const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
    if (votingOpenConfig?.value !== "true") {
        return new NextResponse("Voting is closed", { status: 403 })
    }

    try {
        const { candidateId } = await req.json()

        // Upsert vote (allows changing mind while open)
        await prisma.vote.upsert({
            where: { voterId: session.user.id },
            update: { candidateId },
            create: {
                voterId: session.user.id,
                candidateId
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[VOTE_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

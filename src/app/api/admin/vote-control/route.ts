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
        const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } })
        const isOpen = votingOpenConfig?.value === "true"

        const candidateCount = await prisma.enrollment.count({
            where: { isVotingCandidate: true }
        })

        return NextResponse.json({ 
            isOpen, 
            candidateCount 
        })
    } catch (error) {
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
    }

    // Simplification: We strictly use RepoConfig for these states

    return NextResponse.json({ success: true })
}

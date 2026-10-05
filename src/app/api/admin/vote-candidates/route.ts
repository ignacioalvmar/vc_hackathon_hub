import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { enrollmentIds } = await req.json()

        if (!Array.isArray(enrollmentIds)) {
            return new NextResponse("Invalid request: enrollmentIds must be an array", { status: 400 })
        }

        // First, set all enrollments to false
        await prisma.enrollment.updateMany({
            data: { isVotingCandidate: false }
        })

        // Then, set selected enrollments to true
        if (enrollmentIds.length > 0) {
            await prisma.enrollment.updateMany({
                where: { id: { in: enrollmentIds } },
                data: { isVotingCandidate: true }
            })
        }

        return NextResponse.json({ success: true, selectedCount: enrollmentIds.length })
    } catch (error) {
        console.error("[VOTE_CANDIDATES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

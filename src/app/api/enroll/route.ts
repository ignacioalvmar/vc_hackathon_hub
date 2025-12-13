import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const { repoUrl } = await req.json()

        // Create or update enrollment
        const enrollment = await prisma.enrollment.upsert({
            where: {
                userId: session.user.id,
            },
            update: {
                repoUrl: repoUrl,
            },
            create: {
                userId: session.user.id,
                repoUrl: repoUrl,
            },
        })

        return NextResponse.json(enrollment)
    } catch (error) {
        console.error("[ENROLLMENT_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId: session.user.id }
        })
        return NextResponse.json(enrollment)
    } catch (error) {
        console.error("[ENROLLMENT_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

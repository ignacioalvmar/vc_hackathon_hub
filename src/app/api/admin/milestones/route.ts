import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// Schema for validation could be added here (zod)

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // Debug logging
    console.log("[MILESTONES_POST] Session:", {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        userRole: session?.user?.role,
    })

    if (!session || !session.user?.id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    // Check role from session first, then fallback to database check
    // @ts-ignore
    let userRole = session.user?.role
    
    // If role is not ADMIN in session, check database directly
    if (userRole !== "ADMIN") {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })
        console.log("[MILESTONES_POST] Database check:", dbUser)
        userRole = dbUser?.role || userRole
    }

    if (userRole !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const body = await req.json()
        const { title, description, labelPattern, order, points } = body

        const milestone = await prisma.milestone.create({
            data: {
                title,
                description,
                labelPattern,
                order: parseInt(order),
                points: parseInt(points) || 1,
            },
        })

        return NextResponse.json(milestone)
    } catch (error) {
        console.error("[MILESTONES_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
        return new NextResponse("Forbidden", { status: 403 })
    }

    // Check role from session first, then fallback to database check
    // @ts-ignore
    let userRole = session.user?.role
    
    // If role is not ADMIN in session, check database directly
    if (userRole !== "ADMIN") {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true, email: true }
        })
        userRole = dbUser?.role || userRole
    }

    if (userRole !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const body = await req.json()
        const { id, title, description, labelPattern, order, points } = body

        if (!id) {
            return new NextResponse("Milestone ID is required", { status: 400 })
        }

        const milestone = await prisma.milestone.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(labelPattern !== undefined && { labelPattern }),
                ...(order !== undefined && { order: parseInt(order) }),
                ...(points !== undefined && { points: parseInt(points) || 1 }),
            },
        })

        return NextResponse.json(milestone)
    } catch (error) {
        console.error("[MILESTONES_PUT]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const milestones = await prisma.milestone.findMany({
            orderBy: {
                order: 'asc',
            },
        })

        return NextResponse.json(milestones)
    } catch (error) {
        console.error("[MILESTONES_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

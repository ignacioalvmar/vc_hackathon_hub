import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            }
        })

        const enrollment = await prisma.enrollment.findUnique({
            where: { userId: session.user.id },
            select: {
                repoUrl: true,
            }
        })

        return NextResponse.json({
            user,
            enrollment: enrollment || { repoUrl: null }
        })
    } catch (error) {
        console.error("[PROFILE_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, image, repoUrl } = body

        // Update user profile
        const updateData: { name?: string; image?: string } = {}
        if (name !== undefined) updateData.name = name
        if (image !== undefined) updateData.image = image

        const user = await prisma.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
            }
        })

        // Update enrollment repo URL if provided
        let enrollment = null
        if (repoUrl !== undefined) {
            enrollment = await prisma.enrollment.upsert({
                where: { userId: session.user.id },
                update: { repoUrl: repoUrl || null },
                create: {
                    userId: session.user.id,
                    repoUrl: repoUrl || null,
                },
                select: {
                    repoUrl: true,
                }
            })
        } else {
            enrollment = await prisma.enrollment.findUnique({
                where: { userId: session.user.id },
                select: {
                    repoUrl: true,
                }
            })
        }

        return NextResponse.json({
            user,
            enrollment: enrollment || { repoUrl: null }
        })
    } catch (error) {
        console.error("[PROFILE_PATCH]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}


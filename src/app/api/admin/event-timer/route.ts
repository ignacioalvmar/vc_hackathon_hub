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
        const deadlineConfig = await prisma.repoConfig.findUnique({ 
            where: { key: "EVENT_DEADLINE" } 
        })
        
        return NextResponse.json({ 
            deadline: deadlineConfig?.value || null
        })
    } catch (error) {
        console.error("[EVENT_TIMER_GET]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        const { deadline } = await req.json() // ISO 8601 string or null to clear

        if (deadline === null || deadline === undefined) {
            // Clear deadline
            await prisma.repoConfig.deleteMany({
                where: { key: "EVENT_DEADLINE" }
            })
        } else {
            // Validate deadline is a valid ISO string
            const deadlineDate = new Date(deadline)
            if (isNaN(deadlineDate.getTime())) {
                return new NextResponse("Invalid deadline format", { status: 400 })
            }

            // Store deadline as ISO string
            await prisma.repoConfig.upsert({
                where: { key: "EVENT_DEADLINE" },
                update: { value: deadline },
                create: { key: "EVENT_DEADLINE", value: deadline }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[EVENT_TIMER_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

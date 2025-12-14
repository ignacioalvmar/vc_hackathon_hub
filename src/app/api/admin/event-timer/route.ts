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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'event-timer/route.ts:54',message:'Deadline saved to DB',data:{deadline},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            // #region agent log
            const verifyConfig = await prisma.repoConfig.findUnique({ where: { key: "EVENT_DEADLINE" } });
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'event-timer/route.ts:58',message:'Deadline verified in DB after save',data:{savedValue:verifyConfig?.value,deadline},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[EVENT_TIMER_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}


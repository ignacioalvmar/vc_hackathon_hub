import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    const webhookUrl = process.env.WEBHOOK_URL || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/github`
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ? "✓ Configured" : "✗ Not configured"
    
    return NextResponse.json({
        webhookUrl,
        webhookSecret,
        isConfigured: !!process.env.GITHUB_WEBHOOK_SECRET,
        instructions: {
            step1: "Students: Go to YOUR repository Settings > Webhooks (optional - system polls automatically)",
            step2: `Add webhook URL: ${webhookUrl}`,
            step3: "Set Content type to: application/json",
            step4: "Select 'Just the push event'",
            step5: process.env.GITHUB_WEBHOOK_SECRET 
                ? `Add secret: ${process.env.GITHUB_WEBHOOK_SECRET.substring(0, 4)}...`
                : "Set GITHUB_WEBHOOK_SECRET in your .env file (optional - for webhook verification)"
        }
    })
}


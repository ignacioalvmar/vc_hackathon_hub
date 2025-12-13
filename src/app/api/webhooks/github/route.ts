import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"
import { processCommitsForEnrollment, CommitData } from "@/lib/commit-processor"

// Type definitions for GitHub Push Event (simplified)
interface Commit {
    id: string
    message: string
    timestamp: string
    author: {
        name: string
        email: string
        username?: string
    }
}

interface PushEvent {
    ref: string
    repository: {
        html_url: string
        full_name: string
    }
    commits: Commit[]
    pusher: {
        name: string
        email: string
    }
}

export async function POST(req: Request) {
    try {
        const bodyText = await req.text()
        const signature = (await headers()).get("x-hub-signature-256")

        // Verify signature if secret is provided
        const secret = process.env.GITHUB_WEBHOOK_SECRET
        if (secret && signature) {
            const hmac = crypto.createHmac("sha256", secret)
            const digest = "sha256=" + hmac.update(bodyText).digest("hex")
            if (signature !== digest) {
                return new NextResponse("Invalid Signature", { status: 401 })
            }
        }

        const event: PushEvent = JSON.parse(bodyText)
        const repoUrl = event.repository.html_url

        // Find enrollment by Repo URL
        // Note: This matches strictly. Students must supply the exact HTML URL.
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                repoUrl: repoUrl
            },
            include: {
                user: true,
                activities: true
            }
        })

        if (!enrollment) {
            console.log(`[WEBHOOK] No enrollment found for repo: ${repoUrl}`)
            return new NextResponse("No enrollment found", { status: 200 }) // Return 200 to satisfy GitHub
        }

        // Transform webhook commits to our format
        const commitData: CommitData[] = event.commits.map(commit => ({
            id: commit.id,
            message: commit.message,
            timestamp: commit.timestamp
        }))

        // Process commits using shared function
        const result = await processCommitsForEnrollment(
            enrollment.id,
            repoUrl,
            commitData
        )

        return NextResponse.json({
            processed: result.processed,
            new_activities: result.newActivities
        })

    } catch (error) {
        console.error("[WEBHOOK_POST]", error)
        return new NextResponse("Internal Error", { status: 500 })
    }
}

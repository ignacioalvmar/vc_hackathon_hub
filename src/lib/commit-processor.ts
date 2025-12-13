import prisma from "@/lib/prisma"

// Shared interface for commits from webhooks or API polling
export interface CommitData {
    id: string
    message: string
    timestamp: string | Date
}

/**
 * Process commits for an enrollment and check for milestone matches
 * This is shared between webhook processing and polling
 */
export async function processCommitsForEnrollment(
    enrollmentId: string,
    repoUrl: string,
    commits: CommitData[]
): Promise<{ processed: number; newActivities: number }> {
    const enrollment = await prisma.enrollment.findFirst({
        where: {
            id: enrollmentId,
            repoUrl: repoUrl
        },
        include: {
            user: true,
            activities: true
        }
    })

    if (!enrollment) {
        console.log(`[COMMIT_PROCESSOR] No enrollment found for repo: ${repoUrl}`)
        return { processed: 0, newActivities: 0 }
    }

    const milestones = await prisma.milestone.findMany({
        orderBy: { order: 'asc' }
    })

    const newActivities = []

    // Process commits
    for (const commit of commits) {
        const message = commit.message
        const commitTimestamp = typeof commit.timestamp === 'string' 
            ? new Date(commit.timestamp) 
            : commit.timestamp

        for (const milestone of milestones) {
            // Check if already completed
            const alreadyCompleted = enrollment.activities.some(
                a => a.milestoneId === milestone.id
            )
            if (alreadyCompleted) continue

            // Check for label pattern (case insensitive)
            const regex = new RegExp(milestone.labelPattern, 'i') // e.g. /#M1/i
            if (regex.test(message)) {
                console.log(`[COMMIT_PROCESSOR] Match found! User: ${enrollment.user.email}, Milestone: ${milestone.title}, Commit: ${commit.id}`)

                // Record activity
                const activity = await prisma.activity.create({
                    data: {
                        enrollmentId: enrollment.id,
                        milestoneId: milestone.id,
                        commitHash: commit.id,
                        commitMessage: message,
                        timestamp: commitTimestamp
                    }
                })
                newActivities.push(activity)
            }
        }
    }

    return {
        processed: commits.length,
        newActivities: newActivities.length
    }
}


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
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:14',message:'processCommitsForEnrollment entry',data:{enrollmentId,repoUrl,commitCount:commits.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

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
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:32',message:'No enrollment found',data:{repoUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        console.log(`[COMMIT_PROCESSOR] No enrollment found for repo: ${repoUrl}`)
        return { processed: 0, newActivities: 0 }
    }

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:35',message:'Enrollment found',data:{enrollmentId:enrollment.id,userEmail:enrollment.user.email,activityCount:enrollment.activities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    const milestones = await prisma.milestone.findMany({
        orderBy: { order: 'asc' }
    })

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:38',message:'Milestones loaded',data:{milestoneCount:milestones.length,milestones:milestones.map(m=>({id:m.id,title:m.title,labelPattern:m.labelPattern}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const newActivities = []

    // Process commits
    for (const commit of commits) {
        const message = commit.message
        const commitTimestamp = typeof commit.timestamp === 'string' 
            ? new Date(commit.timestamp) 
            : commit.timestamp

        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:45',message:'Processing commit',data:{commitId:commit.id,messageLength:message.length,messagePreview:message.substring(0,100),timestamp:commitTimestamp},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        for (const milestone of milestones) {
            // Check if already completed
            const alreadyCompleted = enrollment.activities.some(
                a => a.milestoneId === milestone.id
            )
            
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:52',message:'Checking milestone',data:{milestoneId:milestone.id,milestoneTitle:milestone.title,labelPattern:milestone.labelPattern,alreadyCompleted},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion

            if (alreadyCompleted) continue

            // Check for label pattern (case insensitive)
            const regex = new RegExp(milestone.labelPattern, 'i') // e.g. /#M1/i
            
            // #region agent log
            const regexTestResult = regex.test(message);
            fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:57',message:'Regex test result',data:{milestoneId:milestone.id,labelPattern:milestone.labelPattern,commitMessage:message,regexTestResult,messageContainsAcademic:message.toLowerCase().includes('academic'),messageContainsCloned:message.toLowerCase().includes('cloned')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
            // #endregion

            if (regexTestResult) {
                console.log(`[COMMIT_PROCESSOR] Match found! User: ${enrollment.user.email}, Milestone: ${milestone.title}, Commit: ${commit.id}`)

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'commit-processor.ts:60',message:'Match found - creating activity',data:{enrollmentId:enrollment.id,milestoneId:milestone.id,commitId:commit.id,commitMessage:message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion

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


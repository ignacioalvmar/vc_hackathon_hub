import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { processCommitsForEnrollment, CommitData } from "@/lib/commit-processor"

/**
 * Poll all student repositories for new commits
 * This is the primary method for tracking commits when webhooks aren't configured
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        return new NextResponse("Forbidden", { status: 403 })
    }

    try {
        // Get all enrollments with linked repositories
        const enrollments = await prisma.enrollment.findMany({
            where: {
                repoUrl: { not: null }
            },
            include: {
                user: true,
                activities: true
            }
        })

        const results = []
        const errors = []

        for (const enrollment of enrollments) {
            if (!enrollment.repoUrl) continue

            try {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:34',message:'Processing enrollment',data:{enrollmentId:enrollment.id,userEmail:enrollment.user.email,repoUrl:enrollment.repoUrl,activityCount:enrollment.activities.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion

                // Parse GitHub repo URL to get owner/repo
                // Format: https://github.com/owner/repo
                const urlMatch = enrollment.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
                if (!urlMatch) {
                    errors.push({ repo: enrollment.repoUrl, error: "Invalid GitHub URL format" })
                    continue
                }

                const [, owner, repo] = urlMatch
                const repoName = repo.replace(/\.git$/, '') // Remove .git suffix if present

                // Get all processed commit hashes to filter duplicates
                // This is more reliable than using timestamps
                const processedCommitHashes = new Set(enrollment.activities
                    .filter(a => a.commitHash)
                    .map(a => a.commitHash))
                
                // #region agent log
                const lastActivity = enrollment.activities
                    .filter(a => a.commitHash)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:52',message:'Last activity check',data:{enrollmentId:enrollment.id,lastActivityTimestamp:lastActivity?.timestamp,lastActivityCommitHash:lastActivity?.commitHash,hasLastActivity:!!lastActivity,processedCommitCount:processedCommitHashes.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                // #endregion

                // Fetch recent commits without since parameter - we'll filter by commit SHA instead
                // This ensures we don't miss commits due to timestamp issues
                // We fetch the last 30 commits and filter out ones we've already processed
                const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=30`

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:56',message:'GitHub API URL',data:{owner,repoName,apiUrl,strategy:'Fetch last 30 commits and filter by SHA'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,E'})}).catch(()=>{});
                // #endregion
                
                const response = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'VC-Hackathon-Hub'
                    }
                })

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:68',message:'GitHub API response',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion

                if (!response.ok) {
                    // If 404, repo might be private or not exist
                    if (response.status === 404) {
                        errors.push({ 
                            repo: enrollment.repoUrl, 
                            error: "Repository not found or is private (requires student to configure webhook)" 
                        })
                        continue
                    }
                    // Handle rate limiting gracefully - skip this repo but continue with others
                    if (response.status === 403) {
                        // #region agent log
                        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:95',message:'Rate limit hit - skipping repo',data:{enrollmentId:enrollment.id,repoUrl:enrollment.repoUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                        // #endregion
                        errors.push({ 
                            repo: enrollment.repoUrl, 
                            error: "GitHub API rate limit exceeded - will retry on next poll" 
                        })
                        continue
                    }
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
                }

                const commits: any[] = await response.json()

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:82',message:'Commits fetched from GitHub',data:{enrollmentId:enrollment.id,commitCount:commits.length,commitMessages:commits.slice(0,5).map((c:any)=>({sha:c.sha,message:c.commit.message.substring(0,100),date:c.commit.author.date}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,E'})}).catch(()=>{});
                // #endregion

                // Transform GitHub API commits to our format and filter out already-processed commits
                const commitData: CommitData[] = commits
                    .filter((commit: any) => !processedCommitHashes.has(commit.sha))
                    .map((commit: any) => ({
                        id: commit.sha,
                        message: commit.commit.message,
                        timestamp: commit.commit.author.date
                    }))

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:90',message:'Transformed commit data',data:{enrollmentId:enrollment.id,totalCommits:commits.length,filteredCommitCount:commitData.length,commitDataPreview:commitData.slice(0,3).map(c=>({id:c.id,messagePreview:c.message.substring(0,100),timestamp:c.timestamp}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                // #endregion

                // Process commits
                const result = await processCommitsForEnrollment(
                    enrollment.id,
                    enrollment.repoUrl,
                    commitData
                )

                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'poll-repos/route.ts:96',message:'Processing result',data:{enrollmentId:enrollment.id,processed:result.processed,newActivities:result.newActivities},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion

                results.push({
                    student: enrollment.user.name || enrollment.user.email,
                    repo: enrollment.repoUrl,
                    commitsProcessed: result.processed,
                    newActivities: result.newActivities
                })

            } catch (error) {
                console.error(`[POLL_REPOS] Error polling ${enrollment.repoUrl}:`, error)
                errors.push({ 
                    repo: enrollment.repoUrl, 
                    error: error instanceof Error ? error.message : 'Unknown error' 
                })
            }
        }

        return NextResponse.json({
            success: true,
            totalRepos: enrollments.length,
            results,
            errors,
            message: `Polled ${enrollments.length} repositories. Found ${results.reduce((sum, r) => sum + r.newActivities, 0)} new milestone completions.`
        })

    } catch (error) {
        console.error("[POLL_REPOS]", error)
        return NextResponse.json(
            { error: "Internal Error", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}


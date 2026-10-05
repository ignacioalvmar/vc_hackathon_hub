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

                // Fetch recent commits without since parameter - we'll filter by commit SHA instead
                // This ensures we don't miss commits due to timestamp issues
                // We fetch the last 30 commits and filter out ones we've already processed
                const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=30`

                const response = await fetch(apiUrl, {
                    headers: {
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'VC-Hackathon-Hub'
                    }
                })

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
                        errors.push({ 
                            repo: enrollment.repoUrl, 
                            error: "GitHub API rate limit exceeded - will retry on next poll" 
                        })
                        continue
                    }
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
                }

                const commits: any[] = await response.json()

                // Transform GitHub API commits to our format and filter out already-processed commits
                const commitData: CommitData[] = commits
                    .filter((commit: any) => !processedCommitHashes.has(commit.sha))
                    .map((commit: any) => ({
                        id: commit.sha,
                        message: commit.commit.message,
                        timestamp: commit.commit.author.date
                    }))

                // Process commits
                const result = await processCommitsForEnrollment(
                    enrollment.id,
                    enrollment.repoUrl,
                    commitData
                )

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


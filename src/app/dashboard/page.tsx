import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";
import prisma from "@/lib/prisma";

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    // Fetch initial data server-side
    const enrollment = await prisma.enrollment.findUnique({
        where: { userId: session.user.id },
        include: { activities: true }
    });

    const milestones = await prisma.milestone.findMany({
        orderBy: { order: "asc" }
    });

    // Serialize dates for client component
    const enrollmentData = enrollment ? {
        ...enrollment,
        createdAt: enrollment.createdAt.toISOString(),
        updatedAt: enrollment.updatedAt.toISOString(),
        activities: enrollment.activities.map(a => ({
            ...a,
            timestamp: a.timestamp.toISOString()
        }))
    } : null;

    const milestonesData = milestones.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString()
    }));

    // Fetch voting status
    const votingOpenConfig = await prisma.repoConfig.findUnique({ where: { key: "VOTING_OPEN" } });
    const isVotingOpen = votingOpenConfig?.value === "true";

    const candidates = await prisma.enrollment.findMany({
        where: { isVotingCandidate: true },
        include: { user: true }
    });

    let myVote = null;
    if (session.user?.id) {
        myVote = await prisma.vote.findUnique({
            where: { voterId: session.user.id }
        });
    }

    const votingData = {
        isOpen: isVotingOpen,
        myVoteId: myVote?.candidateId || null,
        candidates: candidates.map(c => ({
            id: c.id,
            name: c.user.name,
            image: c.user.image,
            repoUrl: c.repoUrl
        }))
    };

    return <DashboardClient user={session.user} initialEnrollment={enrollmentData} initialMilestones={milestonesData} initialVotingData={votingData} />;
}

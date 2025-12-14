import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AdminClient from "./admin-client";
import UnauthorizedMessage from "./unauthorized-message";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session || !session.user?.id) {
        return <UnauthorizedMessage />;
    }

    // Check role from session first, then fallback to database check
    // @ts-ignore
    let userRole = session.user?.role;
    
    // If role is not ADMIN in session, check database directly
    if (userRole !== "ADMIN") {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        });
        userRole = dbUser?.role || userRole;
    }

    // If not admin, show unauthorized message
    if (userRole !== "ADMIN") {
        return <UnauthorizedMessage />;
    }

    // Only fetch data if user is admin
    // Fetch all enrollments with detailed activity
    const enrollments = await prisma.enrollment.findMany({
        include: {
            user: true,
            activities: {
                include: {
                    milestone: true
                }
            }
        }
    });

    const milestones = await prisma.milestone.findMany({
        orderBy: { order: "asc" }
    });

    // Serialize
    const enrollmentsData = enrollments.map(e => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        activities: e.activities.map(a => ({
            ...a,
            timestamp: a.timestamp.toISOString(),
            milestone: {
                ...a.milestone,
                createdAt: a.milestone.createdAt.toISOString(),
                updatedAt: a.milestone.updatedAt.toISOString()
            }
        }))
    }));

    const milestonesData = milestones.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString()
    }));

    return <AdminClient initialEnrollments={enrollmentsData} initialMilestones={milestonesData} />;
}

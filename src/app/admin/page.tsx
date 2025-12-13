import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import AdminClient from "./admin-client";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    // @ts-ignore
    if (!session || session.user?.role !== "ADMIN") {
        // redirect("/"); // TODO: Uncomment for real auth protection
    }

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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import prisma from "@/lib/prisma";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    // Fetch user and enrollment data
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
        }
    });

    const enrollment = await prisma.enrollment.findUnique({
        where: { userId: session.user.id },
        select: {
            repoUrl: true,
        }
    });

    return <ProfileClient 
        initialUser={user} 
        initialEnrollment={enrollment || { repoUrl: null }}
    />;
}


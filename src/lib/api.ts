
export async function fetchEnrollment() {
    const res = await fetch("/api/enroll");
    if (!res.ok) return null;
    return res.json();
}

export async function fetchMilestones() {
    const res = await fetch("/api/admin/milestones");
    if (!res.ok) return [];
    return res.json();
}

export async function createEnrollment(repoUrl: string) {
    const res = await fetch("/api/enroll", {
        method: "POST",
        body: JSON.stringify({ repoUrl }),
    });
    return res.json();
}

export async function fetchProfile() {
    const res = await fetch("/api/profile");
    if (!res.ok) return null;
    return res.json();
}

export async function updateProfile(data: { name?: string; image?: string; repoUrl?: string | null }) {
    const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update profile");
    return res.json();
}
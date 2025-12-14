"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Github, User, Save, ExternalLink, ArrowLeft, LogOut } from "lucide-react";
import { updateProfile, fetchProfile } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserData {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
}

interface EnrollmentData {
    repoUrl: string | null;
}

export default function ProfileClient({ 
    initialUser, 
    initialEnrollment 
}: { 
    initialUser: UserData | null;
    initialEnrollment: EnrollmentData;
}) {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(initialUser);
    const [enrollment, setEnrollment] = useState<EnrollmentData>(initialEnrollment);
    const [name, setName] = useState(initialUser?.name || "");
    const [image, setImage] = useState(initialUser?.image || "");
    const [repoUrl, setRepoUrl] = useState(initialEnrollment?.repoUrl || "");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        setSaved(false);
        
        try {
            const result = await updateProfile({
                name: name || undefined,
                image: image || undefined,
                repoUrl: repoUrl || null,
            });
            
            setUser(result.user);
            setEnrollment(result.enrollment);
            setSaved(true);
            
            // Refresh the page data
            setTimeout(() => {
                router.refresh();
            }, 500);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center border-b border-border pb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="w-9 h-9">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Profile Settings</h1>
                            <p className="text-muted-foreground">Manage your account and repository</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-9 h-9"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Profile Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>
                            Update your name and profile picture
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar Preview */}
                        <div className="flex items-center gap-6">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={image || undefined} alt={name || "User"} />
                                <AvatarFallback className="text-lg">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-medium">Profile Picture</p>
                                <p className="text-xs text-muted-foreground">
                                    Enter a URL to your profile image
                                </p>
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium">
                                Name
                            </label>
                            <Input
                                id="name"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setSaved(false);
                                }}
                            />
                        </div>

                        {/* Image URL Input */}
                        <div className="space-y-2">
                            <label htmlFor="image" className="text-sm font-medium">
                                Profile Image URL
                            </label>
                            <Input
                                id="image"
                                placeholder="https://example.com/avatar.jpg"
                                value={image}
                                onChange={(e) => {
                                    setImage(e.target.value);
                                    setSaved(false);
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a URL to an image hosted online
                            </p>
                        </div>

                        {/* Email (read-only) */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium">
                                Email
                            </label>
                            <Input
                                id="email"
                                value={user?.email || ""}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Email cannot be changed
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Repository Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Github className="w-5 h-5" />
                            GitHub Repository
                        </CardTitle>
                        <CardDescription>
                            Link your GitHub repository to track your progress
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="repoUrl" className="text-sm font-medium">
                                Repository URL
                            </label>
                            <Input
                                id="repoUrl"
                                placeholder="https://github.com/username/my-hackathon-repo"
                                value={repoUrl}
                                onChange={(e) => {
                                    setRepoUrl(e.target.value);
                                    setSaved(false);
                                }}
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste the full URL to your GitHub repository
                            </p>
                        </div>

                        {/* Current Repo Display */}
                        {enrollment?.repoUrl && (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Github className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Current:</span>
                                <a
                                    href={enrollment.repoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                    {enrollment.repoUrl}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        )}

                        {!enrollment?.repoUrl && (
                            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <Badge variant="destructive" className="animate-pulse">
                                    No Repository Linked
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Link a repository to start tracking your progress
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {saved && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-500">Profile updated successfully!</p>
                    </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    <Link href="/dashboard">
                        <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button onClick={handleSave} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}


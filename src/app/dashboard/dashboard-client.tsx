"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, CheckCircle, Clock, ExternalLink, AlertCircle, LogOut, User, Vote, Lock } from "lucide-react";
import { createEnrollment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface Milestone {
    id: string;
    title: string;
    description: string;
    labelPattern: string;
    points: number;
}

interface Activity {
    milestoneId: string;
    timestamp: string;
    commitHash: string | null;
    commitMessage: string | null;
}

interface Enrollment {
    id: string;
    repoUrl: string | null;
    activities: Activity[];
}

interface Candidate {
    id: string;
    name: string | null;
    image: string | null;
    repoUrl: string | null;
}

interface VotingData {
    isOpen: boolean;
    myVoteId: string | null;
    candidates: Candidate[];
}

export default function DashboardClient({ user, initialEnrollment, initialMilestones, initialVotingData }: { user: any, initialEnrollment: Enrollment | null, initialMilestones: Milestone[], initialVotingData?: VotingData }) {
    const [enrollment, setEnrollment] = useState<Enrollment | null>(initialEnrollment);
    const [repoUrl, setRepoUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [votingData, setVotingData] = useState<VotingData | null>(initialVotingData || null);
    const [submittingVote, setSubmittingVote] = useState(false);

    const handleConnectRepo = async () => {
        setLoading(true);
        try {
            const newEnrollment = await createEnrollment(repoUrl);
            // Refresh logic or updates would go here. For now, simple state update.
            setEnrollment({ ...newEnrollment, activities: [] });
        } catch (e) {
            console.error(e);
            alert("Failed to connect repo");
        } finally {
            setLoading(false);
        }
    };

    // Fetch voting status
    useEffect(() => {
        const fetchVotingStatus = async () => {
            try {
                const res = await fetch("/api/vote/status");
                if (res.ok) {
                    const data = await res.json();
                    setVotingData(data);
                }
            } catch (err) {
                console.error("Failed to fetch voting status:", err);
            }
        };
        fetchVotingStatus();
        // Refresh every 5 seconds when voting is open
        const interval = setInterval(fetchVotingStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const castVote = async (candidateId: string) => {
        setSubmittingVote(true);
        try {
            const res = await fetch("/api/vote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ candidateId })
            });
            if (res.ok) {
                // Update local state
                setVotingData(prev => prev ? { ...prev, myVoteId: candidateId } : null);
                // Refresh voting status
                const statusRes = await fetch("/api/vote/status");
                if (statusRes.ok) {
                    const data = await statusRes.json();
                    setVotingData(data);
                }
            }
        } catch (err) {
            console.error("Failed to cast vote:", err);
        } finally {
            setSubmittingVote(false);
        }
    };

    const completedIds = new Set(enrollment?.activities.map(a => a.milestoneId));

    // Find next up
    const nextMilestone = initialMilestones.find(m => !completedIds.has(m.id));

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center border-b border-border pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                            Welcome, {user.name}
                        </h1>
                        <p className="text-muted-foreground">VibeCoding Hackathon Session</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/profile">
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9"
                                title="Profile settings"
                            >
                                <User className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-9 h-9"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                        {enrollment?.repoUrl ? (
                            <a 
                                href={enrollment.repoUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center"
                            >
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1 hover:bg-green-500/20 transition-colors">
                                    <Github className="w-3 h-3 mr-2" />
                                    Repo Connected
                                    <ExternalLink className="w-3 h-3 ml-2" />
                                </Badge>
                            </a>
                        ) : (
                            <Badge variant="destructive" className="animate-pulse">
                                Repo Not Linked
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Repo Connection State */}
                {!enrollment || !enrollment.repoUrl ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Connect your Repository</CardTitle>
                            <CardDescription>
                                Paste your GitHub repository URL to start tracking progress.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <Input
                                    placeholder="https://github.com/username/my-hackathon-repo"
                                    value={repoUrl}
                                    onChange={(e) => setRepoUrl(e.target.value)}
                                />
                                <Button onClick={handleConnectRepo} disabled={loading}>
                                    {loading ? "Connecting..." : "Connect"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : null}

                {/* Next Up Banner */}
                {nextMilestone && enrollment?.repoUrl && (
                    <div className="bg-gradient-to-r from-indigo-500/20 dark:from-indigo-900/40 to-purple-500/20 dark:to-purple-900/40 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-20">
                            <Clock className="w-24 h-24 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider text-sm">
                                <AlertCircle className="w-4 h-4" />
                                Next Up
                            </div>
                            <h2 className="text-3xl font-bold text-foreground shadow-sm">{nextMilestone.title}</h2>
                            <p className="text-indigo-700 dark:text-indigo-200 max-w-xl">{nextMilestone.description}</p>
                            <div className="pt-4 flex items-center gap-3">
                                <code className="bg-muted px-3 py-1 rounded-md border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-mono text-sm">
                                    git commit -m "... {nextMilestone.labelPattern}"
                                </code>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400">Include this tag in your commit message</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Voting Section */}
                {votingData && (
                    <Card className={cn(
                        "border-2 transition-all",
                        votingData.isOpen ? "border-purple-500/50 bg-purple-500/5" : "border-muted bg-muted/30"
                    )}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Vote className="w-5 h-5" />
                                Final Pitch Vote
                            </CardTitle>
                            <CardDescription>
                                {votingData.isOpen 
                                    ? "Cast your vote for the best pitch. You can change your vote until voting closes."
                                    : "Voting is currently closed. Please wait for the professor to open the ballot."}
                            </CardDescription>
                        </CardHeader>
                        {votingData.isOpen ? (
                            <CardContent>
                                {votingData.candidates.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No candidates selected for voting yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {votingData.candidates.map(candidate => {
                                            const isSelected = votingData.myVoteId === candidate.id;
                                            return (
                                                <Card
                                                    key={candidate.id}
                                                    className={cn(
                                                        "cursor-pointer transition-all hover:bg-accent border-2",
                                                        isSelected 
                                                            ? "border-purple-500 dark:border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)] bg-purple-500/10" 
                                                            : "border-border"
                                                    )}
                                                    onClick={() => !submittingVote && castVote(candidate.id)}
                                                >
                                                    <CardContent className="p-4 flex flex-col items-center gap-3 text-center">
                                                        <Avatar className="w-16 h-16">
                                                            <AvatarImage src={candidate.image || undefined} />
                                                            <AvatarFallback>{candidate.name?.[0] || "?"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-lg">{candidate.name}</div>
                                                            {candidate.repoUrl && (
                                                                <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-1">
                                                                    {candidate.repoUrl}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant={isSelected ? "default" : "outline"}
                                                            className={cn(
                                                                "w-full",
                                                                isSelected && "bg-purple-600 hover:bg-purple-700"
                                                            )}
                                                            disabled={submittingVote}
                                                        >
                                                            {isSelected ? "✓ Voted" : "Vote"}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        ) : (
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <Lock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Voting is currently closed.</p>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                )}

                {/* Milestones List */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Your Journey</h3>
                    <div className="space-y-4">
                        {initialMilestones.map((milestone, index) => {
                            const isCompleted = completedIds.has(milestone.id);
                            const isNext = nextMilestone?.id === milestone.id;
                            const activity = enrollment?.activities.find(a => a.milestoneId === milestone.id);

                            return (
                                <div
                                    key={milestone.id}
                                    className={cn(
                                        "flex items-start gap-4 p-5 rounded-xl border transition-all duration-300",
                                        isCompleted ? "bg-card/50 border-green-500/30 opacity-70 hover:opacity-100" :
                                            isNext ? "bg-card border-border ring-1 ring-ring shadow-lg" :
                                                "bg-muted/30 border-border opacity-50"
                                    )}
                                >
                                    <div className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-lg",
                                        isCompleted ? "bg-green-500 text-white" :
                                            isNext ? "bg-primary text-primary-foreground animate-pulse" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : index + 1}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={cn("text-lg font-medium text-foreground", isCompleted && "text-green-500")}>
                                                {milestone.title}
                                            </h4>
                                            {activity && (
                                                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <ExternalLink className="w-3 h-3" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground text-sm">{milestone.description}</p>

                                        <div className="pt-2 flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                {milestone.labelPattern}
                                            </Badge>
                                            {isCompleted && (
                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                    {activity?.commitMessage}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

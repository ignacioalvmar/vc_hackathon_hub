"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Vote as VoteIcon, Lock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface Candidate {
    id: string;
    name: string;
    image: string;
    repoUrl: string;
}

export default function VotePage() {
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [myVoteId, setMyVoteId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch("/api/vote").then(res => res.json()).then(data => {
            setIsOpen(data.isOpen);
            setCandidates(data.candidates);
            setMyVoteId(data.myVoteId);
            setLoading(false);
        });
    }, []);

    const castVote = async (id: string) => {
        setSubmitting(true);
        const res = await fetch("/api/vote", {
            method: "POST",
            body: JSON.stringify({ candidateId: id })
        });
        if (res.ok) {
            setMyVoteId(id);
        }
        setSubmitting(false);
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;

    if (!isOpen) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground space-y-4">
                <div className="absolute top-6 right-6">
                    <ThemeToggle />
                </div>
                <Lock className="w-16 h-16 text-muted-foreground" />
                <h1 className="text-2xl font-bold">Voting is currently closed</h1>
                <p className="text-muted-foreground">Please wait for the professor to open the ballot.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex justify-end">
                    <ThemeToggle />
                </div>
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold">Cast Your Vote</h1>
                    <p className="text-muted-foreground">Select the team with the best pitch. You can change your vote until the session closes.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {candidates.map(candidate => {
                        const isSelected = myVoteId === candidate.id;
                        return (
                            <Card
                                key={candidate.id}
                                className={`
                                    bg-card border-2 transition-all cursor-pointer hover:bg-accent
                                    ${isSelected ? 'border-purple-500 dark:border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'border-border'}
                                `}
                                onClick={() => castVote(candidate.id)}
                            >
                                <div className="p-6 flex flex-col items-center gap-4 text-center">
                                    <Avatar className="w-20 h-20">
                                        <AvatarImage src={candidate.image} />
                                        <AvatarFallback>?</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold text-lg text-card-foreground">{candidate.name}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{candidate.repoUrl}</div>
                                    </div>
                                    <Button
                                        variant={isSelected ? "default" : "outline"}
                                        className={`w-full ${isSelected ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                                        disabled={submitting}
                                    >
                                        {isSelected ? "Voted" : "Vote"}
                                    </Button>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}

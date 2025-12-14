"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useEffect, useState } from "react";

interface Ranking {
    id: string;
    user: {
        name: string | null;
        image: string | null;
    };
    score: number;
    completedCount: number;
    lastActivityTime: number;
    voteCount?: number;
}

export default function LeaderboardClient({ 
    initialRankings, 
    totalMilestones, 
    isVotingOpen, 
    initialEventDeadline 
}: { 
    initialRankings: Ranking[], 
    totalMilestones: number,
    isVotingOpen: boolean,
    initialEventDeadline: string | null
}) {
    const [rankings, setRankings] = useState<Ranking[]>(initialRankings);
    const [eventDeadline, setEventDeadline] = useState<string | null>(initialEventDeadline);
    const [votingOpen, setVotingOpen] = useState<boolean>(isVotingOpen);
    const [timeRemaining, setTimeRemaining] = useState<string>("");

    // Log initial deadline on mount
    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'leaderboard-client.tsx:37',message:'Component initialized with deadline',data:{initialEventDeadline},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
    }, []);

    // Update countdown timer
    useEffect(() => {
        if (!eventDeadline) {
            setTimeRemaining("");
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const deadline = new Date(eventDeadline).getTime();
            const diff = deadline - now;

            if (diff <= 0) {
                setTimeRemaining("Deadline passed");
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${seconds}s`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [eventDeadline]);

    // Poll for leaderboard updates
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Add cache-busting query parameter and prevent caching
                const res = await fetch(`/api/leaderboard?t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-cache',
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'leaderboard-client.tsx:49',message:'API response received',data:{hasEventDeadline:!!data.eventDeadline,eventDeadline:data.eventDeadline},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    setRankings(data.rankings || []);
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/8a563973-f3b4-4f9d-9c8f-85048a258aaf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'leaderboard-client.tsx:53',message:'Setting eventDeadline state',data:{newDeadline:data.eventDeadline || null,currentDeadline:eventDeadline},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                    // #endregion
                    setEventDeadline(data.eventDeadline || null);
                    setVotingOpen(data.isVotingOpen || false);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            }
        };
        
        fetchLeaderboard();
        // Poll every 5 seconds
        const interval = setInterval(fetchLeaderboard, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex justify-end">
                    <ThemeToggle />
                </div>

                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 animate-in fade-in slide-in-from-top-4 duration-700">
                        LEADERBOARD
                    </h1>
                    <p className="text-muted-foreground text-lg uppercase tracking-widest">Hackathon Session Rankings</p>
                    {eventDeadline && (
                        <Card className="mt-8 border-2 border-orange-500 bg-gradient-to-r from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/20">
                            <CardContent className="pt-8 pb-8 px-6">
                                <div className="flex items-center justify-center gap-4">
                                    <Clock className="w-8 h-8 md:w-10 md:h-10 text-orange-500" />
                                    <div className="text-center">
                                        <div className="text-sm md:text-base uppercase tracking-wider text-orange-400 font-semibold mb-2">Deadline</div>
                                        <div className="text-3xl md:text-5xl font-black text-orange-500 font-mono mb-2">{timeRemaining}</div>
                                        <div className="text-sm md:text-base text-orange-300/90 font-medium">
                                            {new Date(eventDeadline).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    {rankings.map((rank, index) => {
                        const isFirst = index === 0;
                        const isSecond = index === 1;
                        const isThird = index === 2;

                        return (
                            <div
                                key={rank.id}
                                className={`
                            relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]
                            ${isFirst ? 'bg-gradient-to-r from-yellow-500/20 dark:from-yellow-900/20 to-background dark:to-black border-yellow-500 dark:border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : ''}
                            ${isSecond ? 'bg-card/50 border-border' : ''}
                            ${isThird ? 'bg-card/30 border-border' : ''}
                            ${index > 2 ? 'bg-muted/30 border-border rounded-none border-x-0 border-t-0 hover:bg-muted/50' : ''}
                        `}
                            >
                                <div className="w-12 text-center font-bold text-xl flex justify-center">
                                    {isFirst ? <Trophy className="w-8 h-8 text-yellow-500" /> :
                                        isSecond ? <Medal className="w-8 h-8 text-muted-foreground" /> :
                                            isThird ? <Award className="w-8 h-8 text-amber-600 dark:text-amber-700" /> :
                                                <span className="text-muted-foreground">#{index + 1}</span>}
                                </div>

                                <Avatar className={`w-12 h-12 border-2 ${isFirst ? 'border-yellow-500' : 'border-transparent'}`}>
                                    <AvatarImage src={rank.user.image || undefined} />
                                    <AvatarFallback>{rank.user.name?.[0]}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg ${isFirst ? 'text-yellow-500' : 'text-foreground'}`}>
                                        {rank.user.name}
                                    </h3>
                                    <div className="flex gap-2 text-xs text-muted-foreground font-mono items-center">
                                        {rank.completedCount === totalMilestones && (
                                            <Badge variant="outline" className="border-green-500 dark:border-green-900 text-green-600 dark:text-green-500 bg-green-500/10 dark:bg-green-900/20 px-1 py-0 h-5">COMPLETED</Badge>
                                        )}
                                        <span>{rank.lastActivityTime > 0 ? `Last hit: ${new Date(rank.lastActivityTime).toLocaleTimeString()}` : "No activity"}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-2xl font-black text-foreground leading-none">
                                        {rank.score}
                                    </div>
                                    <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Points</div>
                                </div>
                            </div>
                        );
                    })}

                    {rankings.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <Flame className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No warriors have entered the arena yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
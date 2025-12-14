"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame, CheckCircle, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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

export default function LeaderboardClient({ initialRankings, totalMilestones, isVotingOpen, initialEventDeadline }: { initialRankings: Ranking[], totalMilestones: number, isVotingOpen: boolean, initialEventDeadline: string | null }) {
    const [rankings, setRankings] = useState<Ranking[]>(initialRankings);
    const [votingStatus, setVotingStatus] = useState(isVotingOpen);
    const [eventDeadline, setEventDeadline] = useState<string | null>(initialEventDeadline);
    const [timeRemaining, setTimeRemaining] = useState<{ hours: number; minutes: number; seconds: number; expired: boolean } | null>(null);

    // Poll for updates when voting is open
    useEffect(() => {
        if (!votingStatus) return;

        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/leaderboard");
                if (res.ok) {
                    const data = await res.json();
                    setRankings(data.rankings);
                    setVotingStatus(data.isVotingOpen);
                }
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            }
        };

        // Poll every 3 seconds during voting for real-time updates
        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 3000);
        return () => clearInterval(interval);
    }, [votingStatus]);

    // Also check if voting status changes
    useEffect(() => {
        setVotingStatus(isVotingOpen);
        if (!isVotingOpen) {
            // When voting closes, refresh to show all students again
            fetch("/api/leaderboard")
                .then(res => res.json())
                .then(data => {
                    setRankings(data.rankings);
                    setEventDeadline(data.eventDeadline || null);
                })
                .catch(err => console.error("Failed to fetch leaderboard:", err));
        }
    }, [isVotingOpen]);

    // Update event deadline when polling
    useEffect(() => {
        if (votingStatus) {
            const fetchLeaderboard = async () => {
                try {
                    const res = await fetch("/api/leaderboard");
                    if (res.ok) {
                        const data = await res.json();
                        setEventDeadline(data.eventDeadline || null);
                    }
                } catch (err) {
                    console.error("Failed to fetch leaderboard:", err);
                }
            };
            fetchLeaderboard();
        }
    }, [votingStatus]);

    // Calculate and update countdown timer
    useEffect(() => {
        if (!eventDeadline) {
            setTimeRemaining(null);
            return;
        }

        const calculateTimeRemaining = () => {
            const now = new Date();
            const deadline = new Date(eventDeadline);
            const diff = deadline.getTime() - now.getTime();

            if (diff <= 0) {
                // Timer expired
                setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, expired: true });
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ hours, minutes, seconds, expired: false });
        };

        // Calculate immediately
        calculateTimeRemaining();

        // Update every second
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [eventDeadline]);

    return (
        <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex justify-end">
                    <ThemeToggle />
                </div>

                <div className="text-center space-y-4 mb-12">
                    <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 animate-in fade-in slide-in-from-top-4 duration-700">
                        {votingStatus ? "VOTING LEADERBOARD" : "LEADERBOARD"}
                    </h1>
                    <p className="text-muted-foreground text-lg uppercase tracking-widest">
                        {votingStatus ? "Vote Rankings" : "Hackathon Session Rankings"}
                    </p>
                </div>

                {/* Countdown Timer */}
                {timeRemaining !== null && (
                    <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 dark:from-orange-900/20 to-background">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm uppercase tracking-wider font-semibold">
                                        {timeRemaining.expired ? "Time's Up!" : "Time Remaining"}
                                    </span>
                                </div>
                                <div className="text-4xl md:text-5xl font-mono font-black tabular-nums">
                                    {timeRemaining.expired ? (
                                        <span className="text-muted-foreground">00:00:00</span>
                                    ) : (
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                                            {String(timeRemaining.hours).padStart(2, '0')}:
                                            {String(timeRemaining.minutes).padStart(2, '0')}:
                                            {String(timeRemaining.seconds).padStart(2, '0')}
                                        </span>
                                    )}
                                </div>
                                {!timeRemaining.expired && eventDeadline && (
                                    <p className="text-xs text-muted-foreground">
                                        Deadline: {new Date(eventDeadline).toLocaleString()}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {rankings.map((rank, index) => {
                        const isFirst = index === 0;
                        const isSecond = index === 1;
                        const isThird = index === 2;
                        const isNearCompletion = !votingStatus && (rank.completedCount === 7 || rank.completedCount === 8);

                        return (
                            <div
                                key={rank.id}
                                className={`
                            relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02]
                            ${isFirst && votingStatus ? 'bg-gradient-to-r from-yellow-500/20 dark:from-yellow-900/20 to-background dark:to-black border-yellow-500 dark:border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : ''}
                            ${isNearCompletion ? 'bg-gradient-to-r from-yellow-500/20 dark:from-yellow-900/20 to-background dark:to-black border-yellow-500 dark:border-yellow-600/50 shadow-[0_0_30px_rgba(234,179,8,0.1)]' : ''}
                            ${isSecond ? 'bg-card/50 border-border' : ''}
                            ${isThird ? 'bg-card/30 border-border' : ''}
                            ${index > 2 && !isNearCompletion ? 'bg-muted/30 border-border rounded-none border-x-0 border-t-0 hover:bg-muted/50' : ''}
                        `}
                            >
                                <div className="w-12 text-center font-bold text-xl flex justify-center">
                                    {votingStatus ? (
                                        // Voting mode: Gold/Silver/Bronze Trophy for top 3
                                        isFirst ? <Trophy className="w-8 h-8 text-yellow-500" /> :
                                        isSecond ? <Trophy className="w-8 h-8 text-gray-400" /> :
                                        isThird ? <Trophy className="w-8 h-8 text-amber-700" /> :
                                        <span className="text-muted-foreground">#{index + 1}</span>
                                    ) : (
                                        // Non-voting mode: Golden CheckCircle for 7-8 milestones, otherwise Trophy/Medal/Award
                                        isNearCompletion ? <CheckCircle className="w-8 h-8 text-yellow-500" /> :
                                        isFirst ? <Trophy className="w-8 h-8 text-yellow-500" /> :
                                        isSecond ? <Medal className="w-8 h-8 text-muted-foreground" /> :
                                        isThird ? <Award className="w-8 h-8 text-amber-600 dark:text-amber-700" /> :
                                        <span className="text-muted-foreground">#{index + 1}</span>
                                    )}
                                </div>

                                <Avatar className={`w-12 h-12 border-2 ${(isFirst && votingStatus) || isNearCompletion ? 'border-yellow-500' : 'border-transparent'}`}>
                                    <AvatarImage src={rank.user.image || undefined} />
                                    <AvatarFallback>{rank.user.name?.[0]}</AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg ${(isFirst && votingStatus) || isNearCompletion ? 'text-yellow-500' : 'text-foreground'}`}>
                                        {rank.user.name}
                                    </h3>
                                    <div className="flex gap-2 text-xs text-muted-foreground font-mono items-center">
                                        {rank.completedCount === totalMilestones && (
                                            <Badge variant="outline" className="border-green-500 dark:border-green-900 text-green-600 dark:text-green-500 bg-green-500/10 dark:bg-green-900/20 px-1 py-0 h-5">COMPLETED</Badge>
                                        )}
                                        <span>{rank.lastActivityTime > 0 ? `Last hit: ${new Date(rank.lastActivityTime).toLocaleTimeString()}` : "No activity"}</span>
                                    </div>
                                </div>

                                <div className="flex items-end gap-6">
                                    {votingStatus ? (
                                        // During voting: Show votes prominently first, then points
                                        <>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-foreground leading-none">
                                                    {rank.voteCount || 0}
                                                </div>
                                                <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Votes</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-black text-foreground leading-none opacity-70">
                                                    {rank.score}
                                                </div>
                                                <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider opacity-70">Points</div>
                                            </div>
                                        </>
                                    ) : (
                                        // Normal mode: Show points
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-foreground leading-none">
                                                {rank.score}
                                            </div>
                                            <div className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Points</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {rankings.length === 0 && (
                        <div className="text-center py-20 text-muted-foreground">
                            <Flame className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>{votingStatus ? "No candidates selected for voting yet." : "No warriors have entered the arena yet."}</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

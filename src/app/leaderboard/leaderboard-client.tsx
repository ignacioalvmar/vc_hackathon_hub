"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, Flame } from "lucide-react";
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
                </div>

                <div className="space-y-4">
                    {initialRankings.map((rank, index) => {
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

                    {initialRankings.length === 0 && (
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
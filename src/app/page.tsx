"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Github, Code2, Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-background via-background/95 to-background/90 relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-600/20 dark:bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-600/20 dark:bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="z-10 text-center space-y-8 max-w-2xl px-4 animate-in fade-in zoom-in duration-700">

        {/* Logo / Icon */}
        <div className="mx-auto w-20 h-20 bg-card/50 border border-border rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm">
          <Code2 className="w-10 h-10 text-foreground" />
        </div>

        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60">
            VibeCoding
          </h1>
          <p className="text-xl text-muted-foreground font-light tracking-wide">
            Hackathon Hub WS25
          </p>
        </div>

        <div className="bg-card/50 backdrop-blur-md border border-border/50 p-8 rounded-3xl shadow-xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-card-foreground">Ready to ship?</h3>
            <p className="text-sm text-muted-foreground">
              Connect your GitHub to track milestones, verify progress, and climb the leaderboard.
            </p>
          </div>

          <Button
            size="lg"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="w-full text-md font-semibold h-12 rounded-xl transition-all hover:scale-[1.02]"
          >
            <Github className="mr-2 h-5 w-5" />
            Login with GitHub
          </Button>

          <div className="flex justify-center gap-8 pt-4">
            <div className="flex flex-col items-center gap-1">
              <Terminal className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Commit</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 flex items-center justify-center text-muted-foreground font-mono font-bold">#</div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Tag</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-5 h-5 rounded-full border border-muted-foreground/50"></div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Rank</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-muted-foreground text-xs tracking-widest uppercase">
        UXDM &bull; Prof. Dr. Ignacio Alvarez
      </div>
    </main>
  );
}

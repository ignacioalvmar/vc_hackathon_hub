"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash, User, Github, LogOut, RefreshCw, AlertCircle, CheckCircle, Pencil, Vote, Lock, Unlock, GripVertical, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "next-auth/react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Milestone {
    id: string;
    title: string;
    description: string;
    labelPattern: string;
    order: number;
    points: number;
}

interface Enrollment {
    id: string;
    user: {
        name: string | null;
        email: string | null;
        image: string | null;
    };
    repoUrl: string | null;
    activities: any[];
    voteCount?: number;
    isVotingCandidate?: boolean;
}

interface WebhookStatus {
    webhookUrl: string;
    webhookSecret: string;
    isConfigured: boolean;
    instructions: {
        step1: string;
        step2: string;
        step3: string;
        step4: string;
        step5: string;
    };
}

interface SortablePanelProps {
    id: string;
    children: React.ReactNode;
    isMinimized: boolean;
    onToggleMinimize: () => void;
    className?: string;
}

function SortablePanel({ id, children, isMinimized, onToggleMinimize, className }: SortablePanelProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn("relative", className)}>
            {children}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-accent/70 rounded transition-colors z-20 group"
                title="Drag to reorder"
            >
                <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </div>
        </div>
    );
}

export default function AdminClient({ initialEnrollments, initialMilestones }: { initialEnrollments: Enrollment[], initialMilestones: Milestone[] }) {
    const [milestones, setMilestones] = useState(initialMilestones);
    const [enrollments, setEnrollments] = useState(initialEnrollments);
    const [webhookStatus, setWebhookStatus] = useState<WebhookStatus | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isPolling, setIsPolling] = useState(false);
    const isPollingRef = useRef(false);

    // Milestone Form State
    const [newTitle, setNewTitle] = useState("");
    const [newTag, setNewTag] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit Milestone State
    const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editTag, setEditTag] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editPoints, setEditPoints] = useState(1);
    const [editOrder, setEditOrder] = useState(0);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    // Voting Management State
    const [votingStatus, setVotingStatus] = useState<{ isOpen: boolean; candidateCount: number } | null>(null);
    const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
    const [savingCandidates, setSavingCandidates] = useState(false);
    const [togglingVote, setTogglingVote] = useState(false);

    // Panel Management State
    const PANEL_IDS = {
        COMMIT_TRACKING: 'commit-tracking',
        VOTING_MANAGEMENT: 'voting-management',
        CREATE_MILESTONE: 'create-milestone',
        LIVE_PROGRESS: 'live-progress',
    } as const;

    const DEFAULT_PANEL_ORDER = [
        PANEL_IDS.COMMIT_TRACKING,
        PANEL_IDS.VOTING_MANAGEMENT,
        PANEL_IDS.CREATE_MILESTONE,
        PANEL_IDS.LIVE_PROGRESS,
    ];

    const DEFAULT_MINIMIZED = [PANEL_IDS.CREATE_MILESTONE];

    // Load panel state from localStorage
    const loadPanelState = () => {
        if (typeof window === 'undefined') {
            return { order: DEFAULT_PANEL_ORDER, minimized: DEFAULT_MINIMIZED };
        }
        try {
            const saved = localStorage.getItem('admin-dashboard-panel-state');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    order: parsed.order || DEFAULT_PANEL_ORDER,
                    minimized: parsed.minimized || DEFAULT_MINIMIZED,
                };
            }
        } catch (e) {
            console.error('Failed to load panel state:', e);
        }
        return { order: DEFAULT_PANEL_ORDER, minimized: DEFAULT_MINIMIZED };
    };

    const [panelOrder, setPanelOrder] = useState<string[]>(() => loadPanelState().order);
    const [minimizedPanels, setMinimizedPanels] = useState<Set<string>>(() => {
        const state = loadPanelState();
        return new Set(state.minimized);
    });

    // Save panel state to localStorage
    const savePanelState = useCallback((order: string[], minimized: string[]) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem('admin-dashboard-panel-state', JSON.stringify({ order, minimized }));
        } catch (e) {
            console.error('Failed to save panel state:', e);
        }
    }, []);

    // Update localStorage when state changes
    useEffect(() => {
        savePanelState(panelOrder, Array.from(minimizedPanels));
    }, [panelOrder, minimizedPanels, savePanelState]);

    // Drag and drop sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPanelOrder((items) => {
                const oldIndex = items.indexOf(active.id as string);
                const newIndex = items.indexOf(over.id as string);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    // Toggle minimize
    const toggleMinimize = (panelId: string) => {
        setMinimizedPanels((prev) => {
            const next = new Set(prev);
            if (next.has(panelId)) {
                next.delete(panelId);
            } else {
                next.add(panelId);
            }
            return next;
        });
    };

    // Fetch voting status
    const fetchVotingStatus = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:88',message:'fetchVotingStatus called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        try {
            const res = await fetch("/api/admin/vote-control");
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:91',message:'fetchVotingStatus response',data:{status:res.status,ok:res.ok,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (res.ok) {
                const data = await res.json();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:94',message:'fetchVotingStatus success',data:data,timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                setVotingStatus(data);
            } else {
                const errorText = await res.text();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:98',message:'fetchVotingStatus error response',data:{status:res.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
                // #endregion
                console.error("Failed to fetch voting status:", res.status, errorText);
            }
        } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:102',message:'fetchVotingStatus exception',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            console.error("Failed to fetch voting status:", err);
        }
    };

    // Initialize selected candidates from enrollments
    useEffect(() => {
        const selected = new Set(
            enrollments.filter(e => e.isVotingCandidate).map(e => e.id)
        );
        setSelectedCandidates(selected);
    }, [enrollments]);

    // Fetch voting status on mount and when enrollments change
    useEffect(() => {
        fetchVotingStatus();
    }, []);

    // Save candidate selection
    const saveCandidates = async () => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:113',message:'saveCandidates called',data:{selectedCount:selectedCandidates.size,selectedIds:Array.from(selectedCandidates)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        setSavingCandidates(true);
        try {
            const res = await fetch("/api/admin/vote-candidates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enrollmentIds: Array.from(selectedCandidates) })
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:121',message:'saveCandidates response',data:{status:res.status,ok:res.ok,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            if (res.ok) {
                const data = await res.json();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:124',message:'saveCandidates success',data:data,timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                await fetchEnrollments();
                await fetchVotingStatus();
            } else {
                const errorText = await res.text();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:128',message:'saveCandidates error response',data:{status:res.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error("Failed to save candidates:", res.status, errorText);
            }
        } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:132',message:'saveCandidates exception',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.error("Failed to save candidates:", err);
        } finally {
            setSavingCandidates(false);
        }
    };

    // Toggle voting open/close
    const toggleVoting = async (action: "OPEN" | "CLOSE") => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:133',message:'toggleVoting called',data:{action,currentStatus:votingStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setTogglingVote(true);
        try {
            const res = await fetch("/api/admin/vote-control", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:140',message:'toggleVoting response',data:{status:res.status,ok:res.ok,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            if (res.ok) {
                const data = await res.json();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:143',message:'toggleVoting success',data:data,timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                await fetchVotingStatus();
                await fetchEnrollments();
            } else {
                const errorText = await res.text();
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:147',message:'toggleVoting error response',data:{status:res.status,errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
                // #endregion
                console.error("Failed to toggle voting:", res.status, errorText);
            }
        } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:151',message:'toggleVoting exception',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.error("Failed to toggle voting:", err);
        } finally {
            setTogglingVote(false);
        }
    };

    // Fetch enrollments
    const fetchEnrollments = async () => {
        try {
            setIsRefreshing(true);
            const res = await fetch("/api/admin/enrollments");
            if (res.ok) {
                const data = await res.json();
                setEnrollments(data);
                setLastRefresh(new Date());
            }
        } catch (err) {
            console.error("Failed to refresh enrollments:", err);
        } finally {
            setIsRefreshing(false);
        }
    };

    // Poll student repositories for new commits
    const pollRepositories = useCallback(async () => {
        if (isPollingRef.current) return; // Prevent concurrent polls
        try {
            isPollingRef.current = true;
            setIsPolling(true);
            const res = await fetch("/api/admin/poll-repos", { method: "POST" });
            if (res.ok) {
                const data = await res.json();
                // Refresh enrollments after polling to show updated progress
                await fetchEnrollments();
                console.log("[POLL] Success:", data.message);
            } else {
                const errorData = await res.json();
                console.error("[POLL] Error:", errorData.error);
            }
        } catch (err) {
            console.error("Failed to poll repositories:", err);
        } finally {
            isPollingRef.current = false;
            setIsPolling(false);
        }
    }, []);

    // Fetch webhook status
    const fetchWebhookStatus = async () => {
        try {
            const res = await fetch("/api/admin/webhook-status");
            if (res.ok) {
                const data = await res.json();
                setWebhookStatus(data);
            }
        } catch (err) {
            console.error("Failed to fetch webhook status:", err);
        }
    };

    // Auto-refresh enrollments every 10 seconds
    useEffect(() => {
        if (autoRefreshEnabled) {
            intervalRef.current = setInterval(() => {
                fetchEnrollments();
                fetchVotingStatus();
            }, 10000); // 10 seconds

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }
    }, [autoRefreshEnabled]);

    // Auto-poll repositories every 30 seconds (less frequent to avoid rate limits)
    useEffect(() => {
        if (autoRefreshEnabled) {
            // Poll immediately on mount
            pollRepositories();
            
            pollIntervalRef.current = setInterval(() => {
                pollRepositories();
            }, 30000); // 30 seconds

            return () => {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                }
            };
        } else {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        }
    }, [autoRefreshEnabled, pollRepositories]);

    // Fetch webhook status on mount
    useEffect(() => {
        fetchWebhookStatus();
    }, []);

    const handleCreateMilestone = async () => {
        if (!newTitle.trim() || !newTag.trim() || !newDesc.trim()) {
            setError("Please fill in all fields");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const order = milestones.length + 1;
            const res = await fetch("/api/admin/milestones", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: newTitle,
                    description: newDesc,
                    labelPattern: newTag,
                    order: order,
                    points: 1
                })
            });
            
            if (res.ok) {
                const fresh = await res.json();
                setMilestones([...milestones, fresh]);
                setNewTitle("");
                setNewTag("");
                setNewDesc("");
                setError(null);
            } else {
                const errorText = await res.text();
                if (res.status === 403) {
                    setError("Access denied. You need ADMIN role to create milestones. Please update your user role in the database.");
                } else {
                    setError(`Failed to create milestone: ${errorText || res.statusText}`);
                }
            }
        } catch (err) {
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditMilestone = (milestone: Milestone) => {
        setEditingMilestone(milestone);
        setEditTitle(milestone.title);
        setEditTag(milestone.labelPattern);
        setEditDesc(milestone.description);
        setEditPoints(milestone.points);
        setEditOrder(milestone.order);
        setEditError(null);
        setEditDialogOpen(true);
    };

    const handleUpdateMilestone = async () => {
        if (!editingMilestone) return;
        if (!editTitle.trim() || !editTag.trim() || !editDesc.trim()) {
            setEditError("Please fill in all fields");
            return;
        }

        setEditLoading(true);
        setEditError(null);
        
        try {
            const res = await fetch("/api/admin/milestones", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: editingMilestone.id,
                    title: editTitle,
                    description: editDesc,
                    labelPattern: editTag,
                    order: editOrder,
                    points: editPoints
                })
            });
            
            if (res.ok) {
                const updated = await res.json();
                setMilestones(milestones.map(m => m.id === updated.id ? updated : m));
                setEditingMilestone(null);
                setEditError(null);
                setEditDialogOpen(false);
            } else {
                const errorText = await res.text();
                if (res.status === 403) {
                    setEditError("Access denied. You need ADMIN role to edit milestones.");
                } else {
                    setEditError(`Failed to update milestone: ${errorText || res.statusText}`);
                }
            }
        } catch (err) {
            setEditError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setEditLoading(false);
        }
    };

    const handleManualRefresh = async () => {
        fetchEnrollments();
        fetchWebhookStatus();
        await pollRepositories();
    };

    // Panel render functions
    const renderCommitTracking = () => {
        if (!webhookStatus) return null;
        return (
            <SortablePanel
                id={PANEL_IDS.COMMIT_TRACKING}
                isMinimized={minimizedPanels.has(PANEL_IDS.COMMIT_TRACKING)}
                onToggleMinimize={() => toggleMinimize(PANEL_IDS.COMMIT_TRACKING)}
            >
                <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="cursor-pointer" onClick={() => toggleMinimize(PANEL_IDS.COMMIT_TRACKING)}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-1">
                                <CheckCircle className="w-5 h-5 text-blue-500" />
                                <CardTitle>Commit Tracking System</CardTitle>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMinimize(PANEL_IDS.COMMIT_TRACKING);
                                }}
                            >
                                {minimizedPanels.has(PANEL_IDS.COMMIT_TRACKING) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <CardDescription>
                            The system automatically polls student repositories to track commits. Webhooks are optional for real-time updates.
                        </CardDescription>
                    </CardHeader>
                    {!minimizedPanels.has(PANEL_IDS.COMMIT_TRACKING) && (
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Tracking Method:</span>
                                    <p className="mt-1 font-medium text-green-500">? Automatic Polling (Active)</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        System polls student repositories every 10 seconds via auto-refresh
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Webhook Support:</span>
                                    <p className="mt-1 font-medium">{webhookStatus.webhookSecret}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Students can optionally configure webhooks for instant updates
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={pollRepositories}
                                    disabled={isPolling}
                                >
                                    <RefreshCw className={cn("w-4 h-4 mr-2", isPolling && "animate-spin")} />
                                    {isPolling ? "Polling..." : "Poll All Repos Now"}
                                </Button>
                            </div>
                            <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                                <p className="font-medium">Optional: Student Webhook Setup (for real-time updates)</p>
                                <p className="text-muted-foreground text-xs mb-2">
                                    Students can configure webhooks on their own repositories for instant commit tracking:
                                </p>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                                    <li>{webhookStatus.instructions.step1}</li>
                                    <li>{webhookStatus.instructions.step2}</li>
                                    <li>{webhookStatus.instructions.step3}</li>
                                    <li>{webhookStatus.instructions.step4}</li>
                                    <li>{webhookStatus.instructions.step5}</li>
                                </ol>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </SortablePanel>
        );
    };

    const renderVotingManagement = () => (
        <SortablePanel
            id={PANEL_IDS.VOTING_MANAGEMENT}
            isMinimized={minimizedPanels.has(PANEL_IDS.VOTING_MANAGEMENT)}
            onToggleMinimize={() => toggleMinimize(PANEL_IDS.VOTING_MANAGEMENT)}
        >
            <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader className="cursor-pointer" onClick={() => toggleMinimize(PANEL_IDS.VOTING_MANAGEMENT)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <Vote className="w-5 h-5 text-purple-500" />
                            <CardTitle>Voting Management</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleMinimize(PANEL_IDS.VOTING_MANAGEMENT);
                            }}
                        >
                            {minimizedPanels.has(PANEL_IDS.VOTING_MANAGEMENT) ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <CardDescription>
                        Select students for final voting and control voting sessions.
                    </CardDescription>
                </CardHeader>
                {!minimizedPanels.has(PANEL_IDS.VOTING_MANAGEMENT) && (
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
                            <div>
                                <div className="font-medium">Voting Status</div>
                                <div className="text-sm text-muted-foreground">
                                    {votingStatus?.isOpen ? (
                                        <span className="text-green-500">Open ({votingStatus.candidateCount} candidates)</span>
                                    ) : (
                                        <span className="text-muted-foreground">Closed</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant={votingStatus?.isOpen ? "outline" : "default"}
                                    onClick={() => toggleVoting(votingStatus?.isOpen ? "CLOSE" : "OPEN")}
                                    disabled={togglingVote || selectedCandidates.size === 0}
                                >
                                    {votingStatus?.isOpen ? (
                                        <>
                                            <Lock className="w-4 h-4 mr-2" />
                                            Close Voting
                                        </>
                                    ) : (
                                        <>
                                            <Unlock className="w-4 h-4 mr-2" />
                                            Open Voting
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">Select Voting Candidates</div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const allIds = new Set(enrollments.map(e => e.id));
                                            setSelectedCandidates(allIds);
                                        }}
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedCandidates(new Set())}
                                    >
                                        Deselect All
                                    </Button>
                                </div>
                            </div>
                            <div className="max-h-64 overflow-y-auto border rounded-lg p-2 space-y-2">
                                {enrollments.map((e) => {
                                    const milestoneIds = e.activities.map(a => a.milestoneId);
                                    const completedCount = new Set(milestoneIds).size;
                                    return (
                                        <label
                                            key={e.id}
                                            className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCandidates.has(e.id)}
                                                onChange={(ev) => {
                                                    const newSet = new Set(selectedCandidates);
                                                    if (ev.target.checked) {
                                                        newSet.add(e.id);
                                                    } else {
                                                        newSet.delete(e.id);
                                                    }
                                                    setSelectedCandidates(newSet);
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{e.user.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {completedCount} / {milestones.length} milestones
                                                </div>
                                            </div>
                                            {e.isVotingCandidate && (
                                                <Badge variant="secondary" className="text-xs">Selected</Badge>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                            <Button
                                className="w-full"
                                onClick={saveCandidates}
                                disabled={savingCandidates}
                            >
                                {savingCandidates ? "Saving..." : `Save Selection (${selectedCandidates.size} selected)`}
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </SortablePanel>
    );

    const renderCreateMilestone = () => (
        <SortablePanel
            id={PANEL_IDS.CREATE_MILESTONE}
            isMinimized={minimizedPanels.has(PANEL_IDS.CREATE_MILESTONE)}
            onToggleMinimize={() => toggleMinimize(PANEL_IDS.CREATE_MILESTONE)}
        >
            <Card>
                <CardHeader className="cursor-pointer" onClick={() => toggleMinimize(PANEL_IDS.CREATE_MILESTONE)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                            <CardTitle>Create Milestone</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleMinimize(PANEL_IDS.CREATE_MILESTONE);
                            }}
                        >
                            {minimizedPanels.has(PANEL_IDS.CREATE_MILESTONE) ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronUp className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                    <CardDescription>Define the roadmap for the students.</CardDescription>
                </CardHeader>
                {!minimizedPanels.has(PANEL_IDS.CREATE_MILESTONE) && (
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {error}
                            </div>
                        )}
                        <Input
                            placeholder="Milestone Title (e.g. Setup Project)"
                            value={newTitle}
                            onChange={e => {
                                setNewTitle(e.target.value);
                                setError(null);
                            }}
                            disabled={loading}
                        />
                        <Input
                            placeholder="Git Tag Pattern (e.g. #M1)"
                            value={newTag}
                            onChange={e => {
                                setNewTag(e.target.value);
                                setError(null);
                            }}
                            className="font-mono"
                            disabled={loading}
                        />
                        <Input
                            placeholder="Description"
                            value={newDesc}
                            onChange={e => {
                                setNewDesc(e.target.value);
                                setError(null);
                            }}
                            disabled={loading}
                        />
                        <Button 
                            className="w-full" 
                            onClick={handleCreateMilestone}
                            disabled={loading}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {loading ? "Creating..." : "Add Milestone"}
                        </Button>
                    </CardContent>
                )}
            </Card>
        </SortablePanel>
    );

    const renderLiveProgress = () => (
        <SortablePanel
            id={PANEL_IDS.LIVE_PROGRESS}
            isMinimized={minimizedPanels.has(PANEL_IDS.LIVE_PROGRESS)}
            onToggleMinimize={() => toggleMinimize(PANEL_IDS.LIVE_PROGRESS)}
            className="w-full"
        >
            <Card className="h-full w-full">
                <CardHeader className="cursor-pointer" onClick={() => toggleMinimize(PANEL_IDS.LIVE_PROGRESS)}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1">
                            <CardTitle>Live Progress</CardTitle>
                            <CardDescription>Real-time view of student activity.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAutoRefreshEnabled(!autoRefreshEnabled);
                                }}
                            >
                                {autoRefreshEnabled ? "Disable Auto-refresh" : "Enable Auto-refresh"}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMinimize(PANEL_IDS.LIVE_PROGRESS);
                                }}
                            >
                                {minimizedPanels.has(PANEL_IDS.LIVE_PROGRESS) ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {!minimizedPanels.has(PANEL_IDS.LIVE_PROGRESS) && (
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Student</TableHead>
                                    <TableHead>Repo</TableHead>
                                    <TableHead>Progress</TableHead>
                                    {votingStatus?.isOpen && <TableHead className="text-center">Votes</TableHead>}
                                    <TableHead className="text-right">Last Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {enrollments.map((e) => {
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:597',message:'Enrollment data check',data:{enrollmentId:e.id,userName:e.user.name,activitiesCount:e.activities?.length||0,activitiesSample:e.activities?.slice(0,2)||[],milestonesTotal:milestones.length,firstActivityKeys:e.activities?.[0]?Object.keys(e.activities[0]):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
                                    // #endregion
                                    const milestoneIds = e.activities.map(a => a.milestoneId);
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:599',message:'Milestone IDs extraction',data:{enrollmentId:e.id,userName:e.user.name,milestoneIds,milestoneIdsLength:milestoneIds.length,uniqueMilestoneIds:Array.from(new Set(milestoneIds))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
                                    // #endregion
                                    const completedCount = new Set(milestoneIds).size;
                                    const percentage = milestones.length > 0 ? (completedCount / milestones.length) * 100 : 0;
                                    const lastActivity = e.activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                                    // Highlight students who have completed 7 or 8 out of 8 milestones (near completion or fully completed)
                                    const isNearCompletion = (completedCount === 7 || completedCount === 8) && milestones.length === 8;
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:600',message:'Condition evaluation',data:{enrollmentId:e.id,userName:e.user.name,completedCount,completedMilestones:Array.from(new Set(e.activities.map(a => a.milestoneId))),milestonesTotal:milestones.length,isNearCompletion,conditionCheck:`(${completedCount}===7 || ${completedCount}===8) && ${milestones.length}===8`},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                                    // #endregion

                                    const rowClassName = cn(
                                        isNearCompletion && "relative outline outline-2 outline-yellow-400 dark:outline-yellow-500 outline-offset-2 shadow-[0_0_25px_rgba(234,179,8,0.7),0_0_50px_rgba(234,179,8,0.4)] dark:shadow-[0_0_25px_rgba(234,179,8,0.6),0_0_50px_rgba(234,179,8,0.3)]"
                                    );
                                    const rowStyle = isNearCompletion ? {
                                        boxShadow: '0 0 25px rgba(234, 179, 8, 0.7), 0 0 50px rgba(234, 179, 8, 0.4), inset 0 0 20px rgba(234, 179, 8, 0.2)'
                                    } : undefined;
                                    // #region agent log
                                    fetch('http://127.0.0.1:7242/ingest/0a238678-0e94-473d-9dc8-0b43e9b75d4d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'admin-client.tsx:603',message:'Style application check',data:{enrollmentId:e.id,userName:e.user.name,isNearCompletion,rowClassName,hasRowStyle:!!rowStyle,rowStyleKeys:rowStyle?Object.keys(rowStyle):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
                                    // #endregion
                                    return (
                                        <TableRow 
                                            key={e.id}
                                            className={rowClassName}
                                            style={rowStyle}
                                        >
                                            <TableCell 
                                                className={cn(
                                                    "font-medium",
                                                    isNearCompletion && "bg-gradient-to-r from-yellow-100/90 via-amber-100/90 to-yellow-100/90 dark:from-yellow-900/50 dark:via-amber-900/50 dark:to-yellow-900/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {e.user.image && <img src={e.user.image} className={cn("w-6 h-6 rounded-full", isNearCompletion && "ring-2 ring-yellow-400 dark:ring-yellow-500 ring-offset-1")} alt="" />}
                                                    <span className={cn("text-foreground", isNearCompletion && "font-semibold text-yellow-900 dark:text-yellow-100")}>{e.user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell 
                                                className={cn(
                                                    isNearCompletion && "bg-gradient-to-r from-yellow-100/90 via-amber-100/90 to-yellow-100/90 dark:from-yellow-900/50 dark:via-amber-900/50 dark:to-yellow-900/50"
                                                )}
                                            >
                                                {e.repoUrl ? (
                                                    <a href={e.repoUrl} target="_blank" className="text-primary hover:underline flex items-center gap-1">
                                                        <Github className="w-3 h-3" /> Link
                                                    </a>
                                                ) : <span className="text-muted-foreground">--</span>}
                                            </TableCell>
                                            <TableCell 
                                                className={cn(
                                                    isNearCompletion && "bg-gradient-to-r from-yellow-100/90 via-amber-100/90 to-yellow-100/90 dark:from-yellow-900/50 dark:via-amber-900/50 dark:to-yellow-900/50"
                                                )}
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span className={cn(isNearCompletion && "font-semibold text-yellow-900 dark:text-yellow-100")}>{completedCount} / {milestones.length}</span>
                                                        <span className={cn(isNearCompletion && "font-semibold text-yellow-900 dark:text-yellow-100")}>{Math.round(percentage)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                        <div className={cn("h-full transition-all duration-500", isNearCompletion ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "bg-green-500")} style={{ width: `${percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            {votingStatus?.isOpen && (
                                                <TableCell 
                                                    className={cn(
                                                        "text-center",
                                                        isNearCompletion && "bg-gradient-to-r from-yellow-100/90 via-amber-100/90 to-yellow-100/90 dark:from-yellow-900/50 dark:via-amber-900/50 dark:to-yellow-900/50"
                                                    )}
                                                >
                                                    <Badge variant="secondary" className="font-semibold">
                                                        {e.voteCount || 0}
                                                    </Badge>
                                                </TableCell>
                                            )}
                                            <TableCell 
                                                className={cn(
                                                    "text-right text-xs font-mono text-muted-foreground",
                                                    isNearCompletion && "bg-gradient-to-r from-yellow-100/90 via-amber-100/90 to-yellow-100/90 dark:from-yellow-900/50 dark:via-amber-900/50 dark:to-yellow-900/50 font-semibold text-yellow-900 dark:text-yellow-100"
                                                )}
                                            >
                                                {lastActivity ? new Date(lastActivity.timestamp).toLocaleTimeString() : "Never"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                )}
            </Card>
        </SortablePanel>
    );

    const panelRenderers: Record<string, () => React.ReactNode> = {
        [PANEL_IDS.COMMIT_TRACKING]: renderCommitTracking,
        [PANEL_IDS.VOTING_MANAGEMENT]: renderVotingManagement,
        [PANEL_IDS.CREATE_MILESTONE]: renderCreateMilestone,
        [PANEL_IDS.LIVE_PROGRESS]: renderLiveProgress,
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Professor Configuration Dashboard</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Last updated: {lastRefresh.toLocaleTimeString()}
                            {autoRefreshEnabled && (
                                <span className="ml-2 text-green-500">� Auto-refresh: ON (10s)</span>
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleManualRefresh}
                            disabled={isRefreshing}
                            className="w-9 h-9"
                            title="Refresh data"
                        >
                            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        </Button>
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

                {/* Draggable Panels */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={panelOrder}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-8">
                            {panelOrder.map((panelId) => {
                                const renderer = panelRenderers[panelId];
                                return renderer ? (
                                    <div key={panelId}>
                                        {renderer()}
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </SortableContext>
                </DndContext>

                {/* Milestones List (not draggable, always shown) */}
                <div className="space-y-2">
                    {milestones.map((m) => (
                        <div key={m.id} className="p-4 rounded-lg bg-card border border-border flex justify-between items-center gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-card-foreground">{m.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{m.description}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">{m.labelPattern}</Badge>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditMilestone(m)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Edit Milestone Dialog */}
                <Dialog open={editDialogOpen} onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) {
                        setEditingMilestone(null);
                        setEditError(null);
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Milestone</DialogTitle>
                            <DialogDescription>
                                Update the milestone details below.
                            </DialogDescription>
                        </DialogHeader>
                        {editError && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                {editError}
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-1 block">Title</label>
                                <Input
                                    placeholder="Milestone Title"
                                    value={editTitle}
                                    onChange={e => {
                                        setEditTitle(e.target.value);
                                        setEditError(null);
                                    }}
                                    disabled={editLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Label Pattern</label>
                                <Input
                                    placeholder="Git Tag Pattern (e.g. #M1)"
                                    value={editTag}
                                    onChange={e => {
                                        setEditTag(e.target.value);
                                        setEditError(null);
                                    }}
                                    className="font-mono"
                                    disabled={editLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1 block">Description</label>
                                <Input
                                    placeholder="Description"
                                    value={editDesc}
                                    onChange={e => {
                                        setEditDesc(e.target.value);
                                        setEditError(null);
                                    }}
                                    disabled={editLoading}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Order</label>
                                    <Input
                                        type="number"
                                        value={editOrder}
                                        onChange={e => {
                                            setEditOrder(parseInt(e.target.value) || 0);
                                            setEditError(null);
                                        }}
                                        disabled={editLoading}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Points</label>
                                    <Input
                                        type="number"
                                        value={editPoints}
                                        onChange={e => {
                                            setEditPoints(parseInt(e.target.value) || 1);
                                            setEditError(null);
                                        }}
                                        disabled={editLoading}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditDialogOpen(false);
                                    setEditingMilestone(null);
                                    setEditError(null);
                                }}
                                disabled={editLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpdateMilestone}
                                disabled={editLoading}
                            >
                                {editLoading ? "Updating..." : "Update Milestone"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Reply } from "lucide-react";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    profile?: { display_name: string | null };
}

interface ReplyListProps {
    parentId: string;
    onReply: (comment: Comment) => void;
    userId?: string;
    onDelete: (commentId: string) => void;
    refreshTrigger?: number;
}

export const ReplyList = ({ parentId, onReply, userId, onDelete, refreshTrigger }: ReplyListProps) => {
    const [replies, setReplies] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [replyCount, setReplyCount] = useState(0);

    // Initial fetch on mount to get count
    useEffect(() => {
        const fetchCount = async () => {
            const { count } = await supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("parent_id", parentId);
            setReplyCount(count || 0);

            // If we expand, fetch first 2 replies automatically
            if (expanded) {
                fetchReplies(false);
            }
        };
        fetchCount();
    }, [parentId, expanded, refreshTrigger]);

    const fetchReplies = async (loadAll = false) => {
        setLoading(true);
        let query = supabase
            .from("comments")
            .select("*")
            .eq("parent_id", parentId)
            .order("created_at", { ascending: true });

        if (!loadAll) {
            query = query.limit(2);
        }

        const { data: repliesData, error: repliesError } = await query;

        if (repliesError) {
            console.error("Error fetching replies:", repliesError);
        } else if (repliesData) {
            // Fetch profiles separately
            const userIds = [...new Set(repliesData.map(r => r.user_id))];
            let profilesMap: Record<string, { display_name: string | null }> = {};

            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from("profiles")
                    .select("id, display_name")
                    .in("id", userIds);

                if (profilesError) {
                    console.error("Error fetching profiles:", profilesError);
                } else if (profilesData) {
                    profilesMap = profilesData.reduce((acc, p) => ({ ...acc, [p.id]: { display_name: p.display_name } }), {});
                }
            }

            setReplies(repliesData.map(d => ({
                id: d.id,
                content: d.content,
                created_at: d.created_at,
                user_id: d.user_id,
                parent_id: d.parent_id,
                profile: profilesMap[d.user_id] || { display_name: "Пользователь" }
            })));
        }
        setLoading(false);
    };

    const handleExpand = () => {
        if (expanded) {
            setExpanded(false);
            setReplies([]); // Clear to reset state if collapsed
        } else {
            setExpanded(true);
            fetchReplies(false);
        }
    };

    const loadMore = () => {
        fetchReplies(true);
    };

    if (replyCount === 0) return null;

    return (
        <div className="ml-0 pl-4 border-l-2 border-border/30 mt-2 space-y-4">
            {/* Expand/Collapse Button */}
            {!expanded ? (
                <button
                    onClick={handleExpand}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 group"
                >
                    <div className="w-8 h-[1px] bg-muted-foreground group-hover:bg-foreground transition-colors" />
                    Посмотреть ответы ({replyCount})
                </button>
            ) : (
                <>
                    {replies.map((reply) => (
                        <div key={reply.id} className="group relative">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-display font-bold text-xs text-foreground">
                                            {reply.profile?.display_name ?? "Пользователь"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(reply.created_at), "d MMM", { locale: ru })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground leading-snug">
                                        {reply.content}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <button
                                            onClick={() => onReply(reply)}
                                            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            Ответить
                                        </button>
                                        {userId === reply.user_id && (
                                            <button
                                                onClick={() => onDelete(reply.id)}
                                                className="text-xs text-destructive hover:text-destructive/80 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                Удалить
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {loading && <p className="text-xs text-muted-foreground animate-pulse ml-2">Загрузка...</p>}

                    {!loading && replies.length < replyCount && (
                        <button
                            onClick={loadMore}
                            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-2 group ml-2 mt-2"
                        >
                            <div className="w-4 h-[1px] bg-muted-foreground group-hover:bg-foreground transition-colors" />
                            Посмотреть ещё ответы ({replyCount - replies.length})
                        </button>
                    )}

                    <button
                        onClick={() => setExpanded(false)}
                        className="text-xs font-semibold text-muted-foreground hover:text-foreground ml-2 mt-2 block"
                    >
                        Скрыть ответы
                    </button>
                </>
            )}
        </div>
    );
};

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { CommentInput } from "./CommentInput";
import { ReplyList } from "./ReplyList";

interface Comment {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    parent_id: string | null;
    profile?: { display_name: string | null };
}

interface CommentItemProps {
    comment: Comment;
    userId?: string;
    onDelete: (commentId: string) => void;
    reviewId: string;
    onCommentPosted: () => void;
    highlightCommentId?: string;
    shouldExpandReplies?: boolean;
}

export const CommentItem = ({
    comment,
    userId,
    onDelete,
    reviewId,
    onCommentPosted,
    highlightCommentId,
    shouldExpandReplies
}: CommentItemProps) => {
    const { role } = useAuth();
    const isAdmin = useAdmin();
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyToUser, setReplyToUser] = useState<string | undefined>(undefined);
    const [refreshReplies, setRefreshReplies] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showHighlight, setShowHighlight] = useState(false);

    useEffect(() => {
        if (highlightCommentId === comment.id) {
            setShowHighlight(true);
            const timer = setTimeout(() => setShowHighlight(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [highlightCommentId, comment.id]);

    const handleDelete = () => onDelete(comment.id);

    useEffect(() => {
        if (showHighlight && scrollRef.current) {
            // Delay slightly to ensure layout is stable
            const timer = setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [showHighlight]);

    const handleRootReply = () => {
        setReplyToUser(undefined);
        setReplyOpen(!replyOpen);
    };

    const handleChildReply = (childComment: Comment) => {
        setReplyToUser(childComment.profile?.display_name || undefined);
        setReplyOpen(true);
    };

    const handleSuccess = () => {
        setReplyOpen(false);
        setReplyToUser(undefined);
        setRefreshReplies(prev => prev + 1);
        onCommentPosted();
    };

    return (
        <div
            ref={scrollRef}
            id={`comment-${comment.id}`}
            className={`space-y-2 group transition-all duration-1000 ${showHighlight ? "bg-cream/40 ring-1 ring-gold/10 rounded-lg p-3 -m-3 shadow-sm" : ""}`}
        >
            <div className="flex items-start gap-3">
                {/* Avatar Placeholder */}
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs select-none">
                    {(comment.profile?.display_name ?? "?")[0].toUpperCase()}
                </div>

                <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm text-foreground">
                            {comment.profile?.display_name ?? "Пользователь"}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(comment.created_at), "d MMM", { locale: ru })}
                        </span>
                    </div>

                    <p className="text-sm text-foreground leading-snug break-words whitespace-pre-wrap">
                        {comment.content}
                    </p>

                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mt-1">
                        <button
                            onClick={handleRootReply}
                            className="hover:text-foreground transition-colors"
                        >
                            Ответить
                        </button>
                        {(userId === comment.user_id || role === 'admin' || isAdmin) && (
                            <button
                                onClick={handleDelete}
                                className="text-destructive hover:text-destructive/80 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                Удалить
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {replyOpen && (
                <div className="pl-11 pr-4">
                    <CommentInput
                        reviewId={reviewId}
                        userId={userId!}
                        parentId={comment.id}
                        replyToUser={replyToUser}
                        onCommentPosted={handleSuccess}
                        onCancel={() => setReplyOpen(false)}
                        autoFocus
                    />
                </div>
            )}

            {/* Replies */}
            <div className="pl-11">
                <ReplyList
                    parentId={comment.id}
                    userId={userId}
                    onReply={handleChildReply}
                    onDelete={onDelete}
                    refreshTrigger={refreshReplies}
                    highlightCommentId={highlightCommentId}
                    autoExpand={shouldExpandReplies}
                />
            </div>
        </div>
    );
};

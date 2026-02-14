import { useState } from "react";
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
}

export const CommentItem = ({ comment, userId, onDelete, reviewId, onCommentPosted }: CommentItemProps) => {
    const [replyOpen, setReplyOpen] = useState(false);
    const [replyToUser, setReplyToUser] = useState<string | undefined>(undefined);
    const [refreshReplies, setRefreshReplies] = useState(0);

    const handleDelete = () => onDelete(comment.id);

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
        <div className="space-y-2 group">
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
                        {userId === comment.user_id && (
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
                />
            </div>
        </div>
    );
};

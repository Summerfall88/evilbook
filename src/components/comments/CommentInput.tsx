import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CommentInputProps {
    reviewId: string;
    userId: string;
    parentId?: string | null;
    replyToUser?: string;
    onCommentPosted: (comment?: any) => void;
    onCancel?: () => void;
    autoFocus?: boolean;
}

export const CommentInput = ({
    reviewId,
    userId,
    parentId = null,
    replyToUser,
    onCommentPosted,
    onCancel,
    autoFocus = false,
}: CommentInputProps) => {
    const [content, setContent] = useState(replyToUser ? `@${replyToUser} ` : "");
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            const length = textareaRef.current.value.length;
            textareaRef.current.setSelectionRange(length, length);
        }
    }, [autoFocus]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;
        setSubmitting(true);

        const { data: insertData, error: insertError } = await supabase
            .from("comments")
            .insert({
                review_id: reviewId,
                user_id: userId,
                content: content.trim(),
                parent_id: parentId,
            })
            .select("*")
            .single();

        if (insertError) {
            console.error("Error inserting comment:", insertError);
            toast.error("Не удалось отправить комментарий");
        } else {
            // Fetch profile separately for the new comment
            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", userId)
                .single();

            if (profileError) {
                console.error("Error fetching profile for new comment:", profileError);
            }

            setContent("");
            const newComment = {
                ...insertData,
                profile: profileData || { display_name: "Пользователь" },
            };
            onCommentPosted(newComment);
        }
        setSubmitting(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-2 mt-2">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={parentId ? "Напишите ответ..." : "Напишите комментарий..."}
                    className="w-full min-h-[40px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    required
                />
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="absolute right-2 top-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                        ✕
                    </button>
                )}
            </div>
            <div className="flex justify-end">
                <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !content.trim()}
                    variant="ghost"
                    className="text-primary hover:text-primary/80 font-semibold h-8"
                >
                    {submitting ? "Отправка..." : "Опубликовать"}
                </Button>
            </div>
        </form>
    );
};

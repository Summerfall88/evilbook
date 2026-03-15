import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";

interface NotificationsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const PAGE_SIZE = 10;

export default function NotificationsSheet({ open, onOpenChange }: NotificationsSheetProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    // Fetch notifications with pagination
    const {
        data: notificationsPages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async ({ pageParam = 0 }) => {
            if (!user) return [];

            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await supabase
                .from("notifications")
                .select(`
                    id,
                    is_read,
                    created_at,
                    actor_id,
                    comment_id,
                    review_id,
                    profiles!notifications_actor_id_fkey (
                        display_name
                    ),
                    comments!notifications_comment_id_fkey (
                        content
                    ),
                    reviews!notifications_review_id_fkey (
                        cover_url
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data as any[];
        },
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
        },
        enabled: !!user && open,
        initialPageParam: 0,
    });

    const notifications = notificationsPages?.pages.flat() || [];

    // Mark all as read when opened
    useEffect(() => {
        if (open && user && notifications?.some(n => !n.is_read)) {
            const markAsRead = async () => {
                await supabase
                    .from("notifications")
                    .update({ is_read: true })
                    .eq("user_id", user.id)
                    .eq("is_read", false);

                queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
                queryClient.invalidateQueries({ queryKey: ["unread_notifications_count", user.id] });
            };
            markAsRead();
        }
    }, [open, user, notifications, queryClient]);

    // Real-time notifications subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications-list-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    // Invalidate the notifications query to refetch
                    queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
                    queryClient.invalidateQueries({ queryKey: ["unread_notifications_count", user.id] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, queryClient]);

    const handleNotificationClick = (reviewId: string, commentId: string) => {
        onOpenChange(false);
        // Navigate to review and pass commentId in state so we can scroll to it
        navigate(`/review/${reviewId}`, { state: { scrollToComment: commentId } });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-full sm:w-[400px] p-0 flex flex-col"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <SheetHeader className="p-6 border-b border-border/50">
                    <SheetTitle className="font-display text-xl">Уведомления</SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="p-6 text-center text-muted-foreground font-body">Загрузка...</div>
                    ) : !notifications || notifications.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground font-body">
                            У вас пока нет уведомлений.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => {
                                const authorName = notif.profiles?.display_name || "Пользователь";
                                const commentText = notif.comments?.content || "";
                                const previewText = commentText.length > 50 ? commentText.substring(0, 50) + "..." : commentText;

                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif.review_id, notif.comment_id)}
                                        className={`flex items-start gap-4 p-4 border-b border-border/50 text-left transition-colors hover:bg-muted/50 ${!notif.is_read ? "bg-muted/20" : ""}`}
                                    >
                                        <Avatar className="w-10 h-10 border border-border/50 shrink-0 mt-1">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${authorName}`} />
                                            <AvatarFallback>{authorName[0]}</AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-body text-sm text-foreground">
                                                <span className="font-bold text-[#ce6355]">{authorName}</span> ответил(а) на ваш комментарий: <span className="text-muted-foreground">"{previewText}"</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1 font-body">
                                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ru })}
                                            </p>
                                        </div>

                                        {notif.reviews?.cover_url && (
                                            <div className="w-12 h-16 shrink-0 rounded overflow-hidden border border-border/50 ml-2">
                                                <img
                                                    src={notif.reviews.cover_url}
                                                    alt="Cover"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}

                            {hasNextPage && (
                                <button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="w-full py-4 text-sm font-semibold text-primary hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {isFetchingNextPage ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        "Загрузить ещё"
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

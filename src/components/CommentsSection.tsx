import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { CommentInput } from "./comments/CommentInput";
import { CommentItem } from "./comments/CommentItem";
import { Loader2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile?: { display_name: string | null };
}

interface CommentsSectionProps {
  reviewId: string;
}

const PAGE_SIZE = 10;

const CommentsSection = ({ reviewId }: CommentsSectionProps) => {
  const { user, loading } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchRootComments = async (pageIndex: number, isRefresh = false) => {
    if (fetching) return;
    setFetching(true);

    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      // 1. Fetch comments first (removed the failing join)
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select("*")
        .eq("review_id", reviewId)
        .is("parent_id", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (commentsError) {
        console.error("Error fetching comments:", commentsError);
        return;
      }

      // 2. Fetch profiles for these comments manually
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
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

      // 3. Merge profiles with comments
      const loadedComments: Comment[] = commentsData.map(d => ({
        ...d,
        profile: profilesMap[d.user_id] || { display_name: "Пользователь" },
      }));

      if (isRefresh) {
        setComments(loadedComments);
      } else {
        setComments(prev => [...prev, ...loadedComments]);
      }

      if (commentsData.length < PAGE_SIZE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      setPage(0);
      setHasMore(true);
      fetchRootComments(0, true);
    }
  }, [reviewId, loading]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRootComments(nextPage);
  };

  const handleNewRootComment = () => {
    // Ideally refetch specific valid page or just reset
    // Resetting is simplest to see your new comment at top
    setPage(0);
    setHasMore(true);
    fetchRootComments(0, true);
  };

  const handleDeleteRoot = (id: string) => {
    // Optimistic delete from list
    setComments(prev => prev.filter(c => c.id !== id));
    // Also call API
    supabase.from("comments").delete().eq("id", id).then();
  };

  return (
    <div className="space-y-6 pb-20">
      <h3 className="font-display text-xl font-bold text-foreground">
        Комментарии
      </h3>

      {/* Main Input */}
      {user ? (
        <div className="bg-card border border-border/50 rounded-lg p-4 mb-6">
          <CommentInput
            reviewId={reviewId}
            userId={user.id}
            onCommentPosted={handleNewRootComment}
          />
        </div>
      ) : (
        <div className="text-center py-4 border border-border/50 rounded-lg mb-6">
          <p className="text-sm text-muted-foreground mb-2">
            Войдите, чтобы оставить комментарий
          </p>
          <AuthDialog
            open={authOpen}
            onOpenChange={setAuthOpen}
            trigger={
              <Button variant="outline" size="sm">
                Войти
              </Button>
            }
          />
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            userId={user?.id}
            onDelete={handleDeleteRoot}
            reviewId={reviewId}
            onCommentPosted={() => {
              // Usually we don't need to refresh roots if a reply was posted
              // But maybe update count? For now lazy reply loading handles it
            }}
          />
        ))}

        {comments.length === 0 && !fetching && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Здесь пока тихо... Напишите первое мнение!
          </p>
        )}

        {fetching && (
          <div className="flex justify-center py-4">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        )}

        {!fetching && hasMore && comments.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button variant="ghost" onClick={handleLoadMore}>
              Загрузить ещё комментарии
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsSection;

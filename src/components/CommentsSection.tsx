import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import AuthDialog from "@/components/AuthDialog";
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: { display_name: string | null };
}

interface CommentsSectionProps {
  reviewId: string;
}

const CommentsSection = ({ reviewId }: CommentsSectionProps) => {
  const { user, loading } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        toast.error("Ошибка загрузки комментариев");
        return;
      }

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", userIds);

        if (profileError) {
          console.error("Error fetching profiles:", profileError);
        }

        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        setComments(
          data.map((c) => ({
            ...c,
            profile: { display_name: profileMap.get(c.user_id) ?? "Пользователь" },
          }))
        );
      } else {
        setComments([]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchComments:", err);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchComments();
    }
  }, [reviewId, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      review_id: reviewId,
      user_id: user.id,
      content: content.trim(),
    });

    if (error) {
      toast.error("Не удалось отправить комментарий");
    } else {
      setContent("");
      await fetchComments();
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-xl font-bold text-foreground">
        Комментарии ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground">Пока нет комментариев. Будьте первым!</p>
      )}

      <div className="space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="border border-border/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {c.profile?.display_name ?? "Пользователь"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {user?.id === c.user_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-secondary-foreground">{c.content}</p>
          </div>
        ))}
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Напишите комментарий..."
            className="w-full min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            required
          />
          <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
            {submitting ? "Отправка..." : "Отправить"}
          </Button>
        </form>
      ) : (
        <div className="text-center py-4 border border-border/50 rounded-lg">
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
    </div>
  );
};

export default CommentsSection;

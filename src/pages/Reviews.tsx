import { useState, useMemo, useEffect } from "react";
import { Plus, Loader2, ArrowDownUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, type Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBookmarks } from "@/hooks/useBookmarks";

type SortOption = "favorites" | "latest" | "discussed" | "recommended";

const Reviews = () => {
  const [search, setSearch] = useState(() => sessionStorage.getItem("evilbook-search") || "");
  const [sortBy, setSortBy] = useState<SortOption>(() => (sessionStorage.getItem("evilbook-sort") as SortOption) || "latest");
  const [visibleCount, setVisibleCount] = useState(() => {
    const saved = sessionStorage.getItem("evilbook-count");
    return saved ? parseInt(saved, 10) : 10;
  });

  useEffect(() => {
    sessionStorage.setItem("evilbook-search", search);
    sessionStorage.setItem("evilbook-sort", sortBy);
    sessionStorage.setItem("evilbook-count", visibleCount.toString());
  }, [search, sortBy, visibleCount]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const isAdmin = useAdmin();
  const queryClient = useQueryClient();
  const { isBookmarked } = useBookmarks();

  const {
    data: reviews,
    isLoading,
    isError,
    error: reviewsError
  } = useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const data = await getReviews();
      // Persist to localStorage for instant display on next page load
      try { localStorage.setItem("evilbook-reviews-cache", JSON.stringify(data)); } catch { }
      return data;
    },
    staleTime: 1000 * 60 * 5,
    placeholderData: () => {
      // Show cached data instantly while fresh data loads in background
      try {
        const cached = localStorage.getItem("evilbook-reviews-cache");
        return cached ? JSON.parse(cached) as Review[] : undefined;
      } catch { return undefined; }
    },
  });

  // Diagnostic logging for errors
  useEffect(() => {
    if (isError && reviewsError) {
      console.error(`[${new Date().toISOString()}] Reviews fetch error:`, reviewsError);
      // If the error has a specific message or code, log it too
      if (reviewsError instanceof Error) {
        console.error("Error details:", {
          message: reviewsError.message,
          name: reviewsError.name,
          stack: reviewsError.stack
        });
      }
    }
  }, [isError, reviewsError]);

  // Загружаем статистику по всем комментариям для сортировки
  const { data: commentsStats } = useQuery({
    queryKey: ["comments_stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("review_id, created_at");
      if (error) {
        console.error("Error fetching comments stats", error);
        return [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const filtered = useMemo(() => {
    if (!reviews) return [];

    // 1. Фильтрация по поиску
    const q = search.toLowerCase().trim();
    let result = [...reviews];
    if (q) {
      result = result.filter(r => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q));
    }

    // 2. Сортировка / Фильтрация Избранного
    if (sortBy === "favorites") {
      result = result.filter(r => isBookmarked(r.id));
      // Сортировка избранного по умолчанию по дате
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      return result;
    }

    if (sortBy === "latest") {
      // Изначально они уже отсортированы по sort_order из getReviews
      // Ничего не делаем, либо можно дополнительно сортировать по дате создания, если нужно
      return result;
    }

    // Подсчитываем статистику для 'discussed' и 'recommended'
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

    const statsMap = new Map<string, { total: number; recent: number }>();
    if (commentsStats) {
      commentsStats.forEach(c => {
        const isRecent = new Date(c.created_at) >= threeDaysAgo;
        const current = statsMap.get(c.review_id) || { total: 0, recent: 0 };
        current.total += 1;
        if (isRecent) current.recent += 1;
        statsMap.set(c.review_id, current);
      });
    }

    result.sort((a, b) => {
      const statsA = statsMap.get(a.id) || { total: 0, recent: 0 };
      const statsB = statsMap.get(b.id) || { total: 0, recent: 0 };

      if (sortBy === "discussed") {
        // Сортировка по общему количеству комментариев (по убыванию)
        if (statsB.total !== statsA.total) {
          return statsB.total - statsA.total;
        }
      } else if (sortBy === "recommended") {
        // Сортировка по количеству комментариев за последние 3 дня (по убыванию)
        if (statsB.recent !== statsA.recent) {
          return statsB.recent - statsA.recent;
        }
        // Вторичная сортировка по общему количеству
        if (statsB.total !== statsA.total) {
          return statsB.total - statsA.total;
        }
      }

      // Fallback: сохраняем оригинальный порядок getReviews (sort_order)
      const orderA = a.sortOrder || 0;
      const orderB = b.sortOrder || 0;
      return orderA - orderB;
    });

    return result;
  }, [reviews, search, sortBy, commentsStats, isBookmarked]);

  const displayedReviews = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep internal state for filtering but input is removed from UI
    setSearch(e.target.value);
    setVisibleCount(10);
  };

  const saveMutation = useMutation({
    mutationFn: saveReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setDialogOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setDialogOpen(false);
    }
  });

  const handleSave = (review: Review) => {
    saveMutation.mutate(review);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <div>
      <section className="container mx-auto px-4 pt-0 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-end gap-4 mb-4">
          {isAdmin && <Button onClick={() => {
            setEditingReview(null);
            setDialogOpen(true);
          }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus size={16} /> Новая рецензия
          </Button>}
        </div>

        {/* Filter Options */}
        <div className="flex justify-start pt-4 mb-6">
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 min-w-max">
              <Button
                variant={sortBy === "favorites" ? "default" : "outline"}
                onClick={() => {
                  setSortBy("favorites");
                  setSearch("");
                  setVisibleCount(10);
                }}
                className={`font-body px-3 h-8 text-[15px] border-transparent ${sortBy === "favorites" ? "bg-[#ce6355] text-white hover:bg-[#ce6355]/90 transition-all duration-300" : "text-foreground hover:text-gold"}`}
              >
                Избранное
              </Button>
              <Button
                variant={sortBy === "latest" ? "default" : "outline"}
                onClick={() => {
                  setSortBy("latest");
                  setSearch("");
                  setVisibleCount(10);
                }}
                className={`font-body px-3 h-8 text-[15px] border-transparent ${sortBy === "latest" ? "bg-[#ce6355] text-white hover:bg-[#ce6355]/90 transition-all duration-300" : "text-foreground hover:text-gold"}`}
              >
                Последние
              </Button>
              <Button
                variant={sortBy === "discussed" ? "default" : "outline"}
                onClick={() => {
                  setSortBy("discussed");
                  setSearch("");
                  setVisibleCount(10);
                }}
                className={`font-body px-3 h-8 text-[15px] border-transparent ${sortBy === "discussed" ? "bg-[#ce6355] text-white hover:bg-[#ce6355]/90 transition-all duration-300" : "text-foreground hover:text-gold"}`}
              >
                Обсуждаемые
              </Button>
              <Button
                variant={sortBy === "recommended" ? "default" : "outline"}
                onClick={() => {
                  setSortBy("recommended");
                  setSearch("");
                  setVisibleCount(10);
                }}
                className={`font-body px-3 h-8 text-[15px] border-transparent ${sortBy === "recommended" ? "bg-[#ce6355] text-white hover:bg-[#ce6355]/90 transition-all duration-300" : "text-foreground hover:text-gold"}`}
              >
                Рекомендуемые
              </Button>
            </div>
          </div>
        </div>

        {/* Search Query Indicator */}
        {search && (
          <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-muted/30 rounded-lg w-fit animate-in fade-in slide-in-from-left-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Результаты поиска для:</span>
            <span className="text-sm font-semibold truncate max-w-[200px]">"{search}"</span>
            <button
              onClick={() => setSearch("")}
              className="ml-2 p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-destructive"
              title="Сбросить поиск"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-body">Загрузка рецензий...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="bg-destructive/10 p-6 rounded-2xl border border-destructive/20 max-w-md">
              <p className="text-destructive font-bold text-lg mb-2">
                Ошибка загрузки данных
              </p>
              <p className="text-muted-foreground text-sm font-body mb-6">
                Сервис временно недоступен или возникли проблемы с интернет-соединением. Пожалуйста, попробуйте обновить страницу.
              </p>
              <Button
                variant="outline"
                onClick={() => queryClient.refetchQueries({ queryKey: ["reviews"] })}
                className="hover:bg-destructive hover:text-white transition-colors"
                size="lg"
              >
                Попробовать снова
              </Button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-body">
            Ничего не найдено
          </p>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-6">
              {displayedReviews.map((review) => <div key={review.id}>
                <ReviewCard review={review} onEdit={isAdmin ? () => {
                  setEditingReview(review);
                  setDialogOpen(true);
                } : undefined} />
              </div>)}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  className="font-medium px-8"
                >
                  Показать еще 10 рецензий
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {isAdmin && <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} review={editingReview} onSave={handleSave} onDelete={handleDelete} />}
    </div>
  );
};

export default Reviews;
import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Loader2, ArrowDownUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, type Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "latest" | "discussed" | "recommended";

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

  const { data: reviews, isLoading, isError } = useQuery({
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

    // 2. Сортировка
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
  }, [reviews, search, sortBy, commentsStats]);

  const displayedReviews = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <section className="container mx-auto px-4 pt-4 pb-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-end gap-4 mb-4">
          {isAdmin && <Button onClick={() => {
            setEditingReview(null);
            setDialogOpen(true);
          }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus size={16} /> Новая рецензия
          </Button>}
        </div>

        {/* Search & Filter Options */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={handleSearchChange} placeholder="Поиск по названию или автору..." className="pl-10 bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50 w-full" />
          </div>

          <div className="w-full sm:w-[200px]">
            <Select
              value={sortBy}
              onValueChange={(val: SortOption) => { setSortBy(val); setVisibleCount(10); }}
            >
              <SelectTrigger className="w-full bg-card border-border/50">
                <div className="flex items-center gap-2">
                  <ArrowDownUp size={14} className="text-muted-foreground" />
                  <SelectValue placeholder="Сортировка" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Последние</SelectItem>
                <SelectItem value="discussed">Обсуждаемые</SelectItem>
                <SelectItem value="recommended">Рекомендуемые</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-body">Загрузка рецензий...</span>
          </div>
        ) : isError ? (
          <p className="text-center text-destructive py-20 font-body">
            Произошла ошибка при загрузке данных
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-body">
            Ничего не найдено
          </p>
        ) : (
          <div className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
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
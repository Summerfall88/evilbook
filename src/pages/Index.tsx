import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialLinks from "@/components/SocialLinks";
import Footer from "@/components/Footer";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, type Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
import heroPortrait from "@/assets/hero-portrait.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const isAdmin = useAdmin();
  const queryClient = useQueryClient();

  const { data: reviews, isLoading, isError } = useQuery({
    queryKey: ["reviews"],
    queryFn: getReviews,
  });

  const latestReviews = reviews ? [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6) : [];

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

  const openEdit = (review: Review) => {
    setEditingReview(review);
    setDialogOpen(true);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 px-4 border-b border-border/30 overflow-hidden">
        {/* Background portrait */}
        <div className="absolute right-0 top-0 bottom-0 w-3/4 sm:w-2/3 md:w-1/2 pointer-events-none overflow-hidden">
          <img src={heroPortrait} alt="" className="absolute right-0 top-1/2 -translate-y-1/2 h-[90%] sm:h-[100%] md:h-[110%] w-auto object-contain opacity-0 animate-slide-in-fade md:animate-slide-in-fade" />
        </div>

        <div className="mx-auto max-w-2xl space-y-6 text-center relative z-10">
          <p className="uppercase tracking-[0.4em] font-body text-[#ce6355] text-sm">
            Книжный блог
          </p>
          <h1 className="font-evilbook text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-foreground">
            Christina<span className="text-[#ce6355]">Evilbook</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground font-body leading-relaxed max-w-lg mx-auto">
            Рецензии на книги, которые не оставляют равнодушными. Тёмные истории, красивые слова, честные мнения.
          </p>
          <div className="flex flex-col items-center gap-5 pt-4">
            <SocialLinks />
            <Button variant="outline" asChild className="border-border text-foreground hover:border-gold/50 hover:text-gold">
              <Link to="/reviews">
                Все рецензии <ArrowRight size={16} className="ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Latest Reviews */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl font-bold text-foreground">
            Последние рецензии
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 font-body">Загрузка последних рецензий...</span>
          </div>
        ) : isError ? (
          <p className="text-center text-destructive py-20 font-body">
            Произошла ошибка при загрузке данных
          </p>
        ) : latestReviews.length === 0 ? (
          <p className="text-center text-muted-foreground py-20 font-body">
            Пока нет ни одной рецензии
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestReviews.map((review) => (
              <div key={review.id}>
                <ReviewCard review={review} onEdit={isAdmin ? () => openEdit(review) : undefined} />
              </div>
            ))}
          </div>
        )}
      </section>

      {isAdmin && <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} review={editingReview} onSave={handleSave} onDelete={handleDelete} />}
      <Footer />
    </div>
  );
};

export default Index;
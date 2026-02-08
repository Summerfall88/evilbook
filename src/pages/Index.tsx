import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialLinks from "@/components/SocialLinks";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
const Index = () => {
  const [reviews, setReviews] = useState(getReviews);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const isAdmin = useAdmin();
  const latestReviews = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  const handleSave = (review: Review) => {
    saveReview(review);
    setReviews(getReviews());
  };
  const handleDelete = (id: string) => {
    deleteReview(id);
    setReviews(getReviews());
  };
  const openEdit = (review: Review) => {
    setEditingReview(review);
    setDialogOpen(true);
  };
  return <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-24 px-4 text-center border-b border-border/30">
        <div className="mx-auto max-w-2xl space-y-6">
          <p className="uppercase tracking-[0.4em] font-body text-[#ce6355] text-base">
            Книжный блог
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-foreground">
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
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Свежее</p>
            <h2 className="font-display text-3xl font-semibold text-foreground">
              Последние рецензии
            </h2>
          </div>
          <Link to="/reviews" className="text-sm text-muted-foreground hover:text-gold transition-colors flex items-center gap-1">
            Смотреть все <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestReviews.map((review, i) => <div key={review.id} className="animate-fade-in" style={{
          animationDelay: `${i * 80}ms`
        }}>
              <ReviewCard review={review} onEdit={isAdmin ? () => openEdit(review) : undefined} />
            </div>)}
        </div>
      </section>

      {isAdmin && <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} review={editingReview} onSave={handleSave} onDelete={handleDelete} />}
    </div>;
};
export default Index;
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SocialLinks from "@/components/SocialLinks";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
import heroPortrait from "@/assets/hero-portrait.png";
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
  return <div className="min-h-dvh">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {latestReviews.map((review) => (
          <div key={review.id}>
            <ReviewCard review={review} onEdit={isAdmin ? () => openEdit(review) : undefined} />
          </div>
        ))}
      </div>
    </section>

    {isAdmin && <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} review={editingReview} onSave={handleSave} onDelete={handleDelete} />}
  </div>;
};
export default Index;
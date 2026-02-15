import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReviewCard from "@/components/ReviewCard";
import ReviewDialog from "@/components/ReviewDialog";
import { getReviews, saveReview, deleteReview, Review } from "@/data/reviews";
import { useAdmin } from "@/hooks/useAdmin";
const Reviews = () => {
  const [reviews, setReviews] = useState(getReviews);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const isAdmin = useAdmin();
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const sorted = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!q) return sorted;
    return sorted.filter(r => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q));
  }, [reviews, search]);
  const handleSave = (review: Review) => {
    saveReview(review);
    setReviews(getReviews());
  };
  const handleDelete = (id: string) => {
    deleteReview(id);
    setReviews(getReviews());
  };
  return <div className="min-h-screen">
    <section className="container mx-auto px-4 py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">
            Все рецензии
          </h1>
        </div>
        {isAdmin && <Button onClick={() => {
          setEditingReview(null);
          setDialogOpen(true);
        }} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
          <Plus size={16} /> Новая рецензия
        </Button>}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-10">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по названию или автору..." className="pl-10 bg-card border-border/50 text-foreground placeholder:text-muted-foreground/50" />
      </div>

      {filtered.length === 0 ? <p className="text-center text-muted-foreground py-20 font-body">
        Ничего не найдено
      </p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filtered.map((review, i) => <div key={review.id} className="animate-fade-in" style={{
          animationDelay: `${i * 60}ms`
        }}>
          <ReviewCard review={review} onEdit={isAdmin ? () => {
            setEditingReview(review);
            setDialogOpen(true);
          } : undefined} />
        </div>)}
      </div>}
    </section>

    {isAdmin && <ReviewDialog open={dialogOpen} onClose={() => setDialogOpen(false)} review={editingReview} onSave={handleSave} onDelete={handleDelete} />}
  </div>;
};
export default Reviews;
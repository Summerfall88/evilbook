import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { getReviewById, Review } from "@/data/reviews";
import StarRating from "./StarRating";
interface ReviewCardProps {
  review: Review;
  onEdit?: () => void;
}
const ReviewCard = ({
  review,
  onEdit
}: ReviewCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const formattedDate = new Date(review.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["review", review.id],
      queryFn: () => getReviewById(review.id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return <article className="group bg-card border border-border/50 rounded-lg overflow-hidden transition-all duration-300 hover:border-gold/30 hover:shadow-[0_0_30px_-10px_hsl(42,60%,55%,0.15)] relative">
    <Link to={`/review/${review.id}`} className="block" onMouseEnter={handleMouseEnter} onFocus={handleMouseEnter}>
      <div className="aspect-[2/3] overflow-hidden relative">
        <img src={review.coverUrl} alt={review.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-display text-lg font-bold leading-tight line-clamp-2 text-foreground group-hover:text-gold transition-colors">
          {review.title}
        </h3>
        <p className="text-base text-muted-foreground">{review.author}</p>
        <p className="text-xs text-muted-foreground/60">{formattedDate}</p>
        <p className="text-secondary-foreground line-clamp-3 leading-relaxed text-base break-words">
          {review.text}
        </p>
      </div>
    </Link>

    <button
      onClick={toggleFavorite}
      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95 group/bookmark"
      title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
    >
      <Bookmark
        size={20}
        className={`transition-colors duration-300 ${isFavorite ? "fill-red-500 text-red-500" : "text-white/70 group-hover/bookmark:text-white"}`}
      />
    </button>

    {onEdit && <button onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    }} className="absolute top-3 left-3 z-10 bg-card/80 backdrop-blur-sm border border-border/50 text-gold rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
      Редактировать
    </button>}
  </article>;
};
export default ReviewCard;
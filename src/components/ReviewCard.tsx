import { Review } from "@/data/reviews";
import StarRating from "./StarRating";

interface ReviewCardProps {
  review: Review;
  onClick?: () => void;
}

const ReviewCard = ({ review, onClick }: ReviewCardProps) => {
  const formattedDate = new Date(review.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      onClick={onClick}
      className={`group bg-card border border-border/50 rounded-lg overflow-hidden transition-all duration-300 hover:border-gold/30 hover:shadow-[0_0_30px_-10px_hsl(42,60%,55%,0.15)] ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="aspect-[2/3] overflow-hidden relative">
        <img
          src={review.coverUrl}
          alt={review.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <StarRating rating={review.rating} />
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-display text-base font-semibold leading-tight line-clamp-2 text-foreground group-hover:text-gold transition-colors">
          {review.title}
        </h3>
        <p className="text-sm text-muted-foreground">{review.author}</p>
        <p className="text-xs text-muted-foreground/60">{formattedDate}</p>
        <p className="text-sm text-secondary-foreground line-clamp-3 leading-relaxed">
          {review.text}
        </p>
      </div>
    </article>
  );
};

export default ReviewCard;

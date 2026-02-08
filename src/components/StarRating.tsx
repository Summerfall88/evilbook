import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: number;
}

const StarRating = ({ rating, interactive = false, onChange, size = 16 }: StarRatingProps) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={`${
          star <= rating ? "fill-gold text-gold" : "text-muted-foreground/30"
        } ${interactive ? "cursor-pointer hover:text-gold transition-colors" : ""}`}
        onClick={() => interactive && onChange?.(star)}
      />
    ))}
  </div>
);

export default StarRating;

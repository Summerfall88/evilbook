import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { getReviews } from "@/data/reviews";
import StarRating from "@/components/StarRating";

const ReviewDetail = () => {
  const { id } = useParams<{ id: string }>();
  const reviews = getReviews();
  const review = reviews.find((r) => r.id === id);

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground font-body text-lg">Рецензия не найдена</p>
          <Link to="/reviews" className="text-gold hover:underline text-sm">
            ← Вернуться к рецензиям
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(review.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          to="/reviews"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold transition-colors mb-8"
        >
          <ArrowLeft size={16} /> Все рецензии
        </Link>

        <article className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
            <div className="w-48 sm:w-56 flex-shrink-0 mx-auto sm:mx-0">
              <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border/50 shadow-lg">
                <img
                  src={review.coverUrl}
                  alt={review.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-4 flex-1 text-center sm:text-left">
              <div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                  {review.title}
                </h1>
                <p className="text-lg text-muted-foreground mt-2">{review.author}</p>
              </div>
              <StarRating rating={review.rating} size={22} />
              <p className="text-sm text-muted-foreground/60">{formattedDate}</p>
            </div>
          </div>

          <div className="border-t border-border/30 pt-8">
            <p className="font-body text-base sm:text-lg leading-relaxed text-secondary-foreground whitespace-pre-line">
              {review.text}
            </p>
          </div>
        </article>
      </section>
    </div>
  );
};

export default ReviewDetail;

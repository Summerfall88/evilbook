import { useRef, useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MessageCircle, Loader2, Bookmark } from "lucide-react";
import { getReviewById } from "@/data/reviews";
import StarRating from "@/components/StarRating";
import CommentsSection from "@/components/CommentsSection";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Утилита для рендера ссылок в тексте
const renderTextWithLinks = (text: string) => {
  // Ищем форматы [текст](http...) или просто http...
  const regex = /(\[.+?\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s\)]+)/g;

  return text.split(regex).map((part, i) => {
    const mdMatch = part.match(/^\[(.+?)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (mdMatch) {
      return (
        <a key={i} href={mdMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline">
          {mdMatch[1]}
        </a>
      );
    }
    if (part.match(/^https?:\/\/[^\s\)]+$/)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 hover:underline break-all">
          {part}
        </a>
      );
    }
    return part;
  });
};

const ReviewDetail = () => {
  const { id } = useParams<{ id: string }>();
  const commentsRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: review, isLoading, isError } = useQuery({
    queryKey: ["review", id],
    queryFn: () => getReviewById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 минут — повторный открыв без спиннера
  });

  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCommentCount = async () => {
      if (!id) return;
      const { count, error } = await supabase
        .from("comments")
        .select("*", { count: "exact", head: true })
        .eq("review_id", id);

      if (!error && count !== null) {
        setCommentCount(count);
      }
    };
    fetchCommentCount();
  }, [id]);

  useEffect(() => {
    if (showComments && commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [showComments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center grow text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
      </div>
    );
  }

  if (isError || !review) {
    return (
      <div className="flex items-center justify-center grow text-center space-y-4 py-20">
        <div>
          <p className="text-muted-foreground font-body text-lg">Рецензия не найдена или произошла ошибка</p>
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

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="grow">
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
              <div className="aspect-[2/3] rounded-lg overflow-hidden border border-border/50 shadow-lg relative group">
                <img
                  src={review.coverUrl}
                  alt={review.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={toggleFavorite}
                  className="absolute top-3 right-3 z-10 p-2 rounded-full bg-background/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-110 active:scale-95"
                  title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                >
                  <Bookmark
                    size={20}
                    className={`transition-colors duration-300 ${isFavorite ? "fill-red-500 text-red-500" : "text-white/70 hover:text-white"}`}
                  />
                </button>
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
              {review.quote && (
                <blockquote className="border-l-2 border-gold pl-4 italic text-muted-foreground text-sm leading-relaxed">
                  «{review.quote}»
                </blockquote>
              )}
              <p className="text-sm text-muted-foreground/60">{formattedDate}</p>
            </div>
          </div>

          <div className="border-t border-border/30 pt-8">
            <p className="font-body text-base sm:text-lg leading-relaxed text-secondary-foreground whitespace-pre-wrap break-words">
              {renderTextWithLinks(review.text)}
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!showComments) {
                  setShowComments(true);
                } else {
                  commentsRef.current?.scrollIntoView({ behavior: "auto" });
                }
              }}
              className="gap-2"
            >
              <MessageCircle size={16} />
              Перейти к комментариям {commentCount !== null ? `(${commentCount})` : ""}
            </Button>
          </div>

          <div className={`${!showComments ? "hidden" : ""} border-t border-border/30 pt-8 animate-fade-in`}>
            <div ref={commentsRef}>
              <CommentsSection reviewId={id!} />
            </div>
          </div>
        </article>
      </section>
    </div>
  );
};

export default ReviewDetail;

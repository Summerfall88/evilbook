import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "./StarRating";
import { Review } from "@/data/reviews";

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  review?: Review | null;
  onSave: (review: Review) => void;
  onDelete?: (id: string) => void;
}

const ReviewDialog = ({ open, onClose, review, onSave, onDelete }: ReviewDialogProps) => {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [rating, setRating] = useState(3);
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [quote, setQuote] = useState("");

  useEffect(() => {
    if (review) {
      setTitle(review.title);
      setAuthor(review.author);
      setCoverUrl(review.coverUrl);
      setRating(review.rating);
      setDate(review.date);
      setText(review.text);
      setQuote(review.quote || "");
    } else {
      setTitle("");
      setAuthor("");
      setCoverUrl("");
      setRating(3);
      setDate(new Date().toISOString().slice(0, 10));
      setText("");
      setQuote("");
    }
  }, [review, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: review?.id || crypto.randomUUID(),
      title,
      author,
      coverUrl: coverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
      rating,
      date,
      text,
      quote: quote || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display font-bold text-xl text-foreground">
            {review ? "Редактировать рецензию" : "Новая рецензия"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Название книги</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Автор книги</Label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">URL обложки</Label>
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Оценка</Label>
            <StarRating rating={rating} interactive onChange={setRating} size={24} />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Дата</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Цитата из книги</Label>
            <Input
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Необязательно"
              className="bg-secondary border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Рецензия</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
              rows={5}
              className="bg-secondary border-border text-foreground resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Сохранить
            </Button>
            {review && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete(review.id);
                  onClose();
                }}
              >
                Удалить
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;

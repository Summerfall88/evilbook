import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import StarRating from "./StarRating";
import { Review } from "@/data/reviews";
import { uploadReviewCover } from "@/lib/storage";

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
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (review) {
      setTitle(review.title);
      setAuthor(review.author);
      setCoverUrl(review.coverUrl);
      setRating(review.rating);
      setDate(review.date);
      setText(review.text);
      setQuote(review.quote || "");
      if (review.coverUrl) {
        setPreviewUrl(review.coverUrl);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setTitle("");
      setAuthor("");
      setCoverUrl("");
      setRating(3);
      setDate(new Date().toISOString().slice(0, 10));
      setText("");
      setQuote("");
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [review, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalCoverUrl = coverUrl;

      // If a new file is in the input, upload it
      const file = fileInputRef.current?.files?.[0];
      if (file) {
        toast.loading("Загрузка обложки...", { id: "upload-dialog-toast" });
        try {
          finalCoverUrl = await uploadReviewCover(file);
          setCoverUrl(finalCoverUrl);
          toast.success("Обложка загружена", { id: "upload-dialog-toast" });
        } catch (error) {
          toast.error("Ошибка при загрузке обложки", { id: "upload-dialog-toast" });
          setIsUploading(false);
          return; // Stop form submission if upload fails
        }
      } else if (!finalCoverUrl && !review) {
        toast.error("Пожалуйста, выберите обложку для загрузки");
        setIsUploading(false);
        return;
      }

      if (finalCoverUrl.startsWith("blob:")) {
        toast.error("Внутренняя ошибка: невозможно сохранить временную ссылку обложки. Попробуйте удалить и прикрепить файл заново.");
        setIsUploading(false);
        return;
      }

      onSave({
        id: review?.id || crypto.randomUUID(),
        title,
        author,
        coverUrl: finalCoverUrl || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300&h=450&fit=crop",
        rating,
        date,
        text,
        quote: quote || undefined,
      });
      onClose();
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Set coverUrl to the object url temporarily so validation passes conceptually if needed
      setCoverUrl(url);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setCoverUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            <Label className="text-muted-foreground">Обложка книги</Label>
            <div className="flex flex-col gap-4">
              {previewUrl ? (
                <div className="relative w-32 h-44 rounded-md overflow-hidden border border-border group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dialog-dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Нажмите для загрузки</span> или перетащите файл</p>
                      <p className="text-xs text-muted-foreground/70">PNG, JPG или WEBP</p>
                    </div>
                  </label>
                </div>
              )}
              <input
                id="dialog-dropzone-file"
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </div>
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
            <Button type="submit" disabled={isUploading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {isUploading ? "Сохранение..." : "Сохранить"}
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

import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getReviewById, saveReview, type Review } from "@/data/reviews";
import { uploadReviewCover } from "@/lib/storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { ChevronLeft, Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";

const reviewSchema = z.object({
    title: z.string().min(2, "Название должно содержать минимум 2 символа"),
    author: z.string().min(2, "Имя автора должно содержать минимум 2 символа"),
    coverUrl: z.string().min(1, "Пожалуйста, загрузите обложку с устройства"),
    rating: z.coerce.number().min(1).max(5),
    date: z.string().min(10, "Выберите дату"),
    text: z.string().min(10, "Текст рецензии слишком короткий"),
    quote: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

export default function AdminReviewForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            title: "",
            author: "",
            coverUrl: "",
            rating: 5,
            date: format(new Date(), "yyyy-MM-dd"),
            text: "",
            quote: "",
        },
    });

    const { data: existingReview, isLoading } = useQuery({
        queryKey: ["review", id],
        queryFn: () => getReviewById(id!),
        enabled: isEditing && !!id,
    });

    const saveMutation = useMutation({
        mutationFn: saveReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            toast.success(isEditing ? "Рецензия обновлена" : "Рецензия успешно добавлена");
            navigate("/nimda/reviews");
        },
        onError: (error) => {
            console.error("Error saving review:", error);
            toast.error("Произошла ошибка при сохранении рецензии");
        }
    });

    useEffect(() => {
        if (isEditing && existingReview) {
            form.reset({
                title: existingReview.title,
                author: existingReview.author,
                coverUrl: existingReview.coverUrl,
                rating: existingReview.rating,
                date: existingReview.date,
                text: existingReview.text,
                quote: existingReview.quote || "",
            });
            if (existingReview.coverUrl) {
                setPreviewUrl(existingReview.coverUrl);
            }
        }
    }, [existingReview, isEditing, form]);

    async function onSubmit(data: ReviewFormValues) {
        setIsUploading(true);
        try {
            let finalCoverUrl = data.coverUrl;

            // If a new file relies in the input, upload it
            const file = fileInputRef.current?.files?.[0];
            if (file) {
                toast.loading("Загрузка обложки...", { id: "upload-toast" });
                try {
                    finalCoverUrl = await uploadReviewCover(file);
                    form.setValue("coverUrl", finalCoverUrl); // Update form state
                    toast.success("Обложка загружена", { id: "upload-toast" });
                } catch (error) {
                    toast.error("Ошибка при загрузке обложки", { id: "upload-toast" });
                    setIsUploading(false);
                    return; // Stop form submission if upload fails
                }
            } else if (!finalCoverUrl) {
                toast.error("Пожалуйста, выберите обложку для загрузки");
                setIsUploading(false);
                return;
            }

            if (finalCoverUrl.startsWith("blob:")) {
                toast.error("Внутренняя ошибка: невозможно сохранить временную ссылку обложки. Попробуйте удалить и прикрепить файл заново.");
                setIsUploading(false);
                return;
            }

            const reviewId = isEditing && id ? id : crypto.randomUUID();

            const newReview: Review = {
                id: reviewId,
                ...data,
                coverUrl: finalCoverUrl,
                quote: data.quote || undefined,
            };

            saveMutation.mutate(newReview);
        } finally {
            setIsUploading(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create a local preview URL — also use it as form value since it's a real URL (blob:http://...)
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            // Use the blob URL so type="url" validation and Zod both pass
            form.setValue("coverUrl", url, { shouldValidate: true });
        }
    };

    const handleRemoveImage = () => {
        setPreviewUrl(null);
        form.setValue("coverUrl", "");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/nimda/reviews")}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        {isEditing ? "Редактировать рецензию" : "Новая рецензия"}
                    </h2>
                    <p className="text-muted-foreground">
                        {isEditing
                            ? "Внесите изменения в существующую рецензию."
                            : "Заполните форму ниже, чтобы опубликовать новую рецензию."}
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <span className="text-muted-foreground">Загрузка данных...</span>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                <div className="grid gap-6 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Название книги</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Например: 1984" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="author"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Автор книги</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Джордж Оруэлл" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="coverUrl"
                                        render={({ field }) => (
                                            <FormItem className="col-span-1 md:col-span-2">
                                                <FormLabel>Обложка книги</FormLabel>
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
                                                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 border-muted-foreground/20 hover:bg-muted/50 transition-colors">
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Нажмите для загрузки</span> или перетащите файл</p>
                                                                    <p className="text-xs text-muted-foreground/70">PNG, JPG или WEBP (макс. 5MB)</p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                    <input
                                                        id="dropzone-file"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                    />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="date"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Дата прочтения</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="rating"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Оценка (1-5)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" min={1} max={5} {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="quote"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Цитата (необязательно)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Запоминающаяся фраза из книги..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="text"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Текст рецензии</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Ваши впечатления о книге..."
                                                    className="min-h-[200px] resize-y"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/nimda/reviews")}
                                    >
                                        Отмена
                                    </Button>
                                    <Button type="submit" disabled={saveMutation.isPending || isUploading}>
                                        {(saveMutation.isPending || isUploading) ? "Сохранение..." : (isEditing ? "Сохранить изменения" : "Опубликовать")}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

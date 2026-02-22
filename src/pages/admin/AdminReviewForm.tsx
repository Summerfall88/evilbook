import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getReviews, saveReview, type Review } from "@/data/reviews";
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
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

const reviewSchema = z.object({
    title: z.string().min(2, "Название должно содержать минимум 2 символа"),
    author: z.string().min(2, "Имя автора должно содержать минимум 2 символа"),
    coverUrl: z.string().url("Укажите корректный URL изображения"),
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

    useEffect(() => {
        if (isEditing && id) {
            const existingReview = getReviews().find((r) => r.id === id);
            if (existingReview) {
                form.reset({
                    title: existingReview.title,
                    author: existingReview.author,
                    coverUrl: existingReview.coverUrl,
                    rating: existingReview.rating,
                    date: existingReview.date,
                    text: existingReview.text,
                    quote: existingReview.quote || "",
                });
            } else {
                toast.error("Рецензия не найдена");
                navigate("/nimda/reviews");
            }
        }
    }, [id, isEditing, form, navigate]);

    function onSubmit(data: ReviewFormValues) {
        const reviewId = isEditing && id ? id : crypto.randomUUID();

        const newReview: Review = {
            id: reviewId,
            ...data,
            quote: data.quote || undefined,
        };

        saveReview(newReview);

        toast.success(isEditing ? "Рецензия обновлена" : "Рецензия успешно добавлена");
        navigate("/nimda/reviews");
    }

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
                                        <FormItem>
                                            <FormLabel>URL обложки (изображение)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://example.com/image.jpg" type="url" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Прямая ссылка на картинку с обложкой.
                                            </FormDescription>
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
                                <Button type="submit">
                                    {isEditing ? "Сохранить изменения" : "Опубликовать"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}

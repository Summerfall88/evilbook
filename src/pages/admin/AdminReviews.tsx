import { useState, useMemo } from "react";
import { getReviews, deleteReview, swapReviewOrder, type Review } from "@/data/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search, Pencil, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";



export default function AdminReviews() {
    const queryClient = useQueryClient();
    const { data: reviews, isLoading, isError } = useQuery({
        queryKey: ["reviews"],
        queryFn: getReviews,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: deleteReview,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
            queryClient.invalidateQueries({ queryKey: ["admin", "reviewsCount"] });
            toast.success("Рецензия успешно удалена");
            setReviewToDelete(null);
        },
        onError: () => {
            toast.error("Произошла ошибка при удалении");
        }
    });

    const handleDelete = () => {
        if (!reviewToDelete) return;
        deleteMutation.mutate(reviewToDelete);
    };

    const filteredReviews = useMemo(() => {
        if (!reviews) return [];
        let result = [...reviews]; // already sorted by sort_order from API

        // Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (review) =>
                    review.title.toLowerCase().includes(query) ||
                    review.author.toLowerCase().includes(query)
            );
        }

        return result;
    }, [reviews, searchQuery]);

    const moveMutation = useMutation({
        mutationFn: ({ idA, orderA, idB, orderB }: { idA: string; orderA: number; idB: string; orderB: number }) =>
            swapReviewOrder(idA, orderA, idB, orderB),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["reviews"] });
        },
        onError: () => {
            toast.error("Ошибка при перемещении");
        }
    });

    const handleMove = (index: number, direction: "up" | "down") => {
        if (!reviews) return;
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= reviews.length) return;

        const current = reviews[index];
        const target = reviews[targetIndex];

        moveMutation.mutate({
            idA: current.id,
            orderA: current.sortOrder ?? index,
            idB: target.id,
            orderB: target.sortOrder ?? targetIndex,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Управление рецензиями</h2>
                    <p className="text-muted-foreground">
                        Список всех опубликованных рецензий на сайте.
                    </p>
                </div>
                <Button asChild>
                    <Link to="/nimda/reviews/new">
                        Добавить рецензию
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle>Все рецензии</CardTitle>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по названию или автору..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 sm:w-[300px]"
                                />
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Порядок</TableHead>
                                    <TableHead className="w-[80px]">Обложка</TableHead>
                                    <TableHead>Книга / Автор</TableHead>
                                    <TableHead className="hidden md:table-cell">Дата</TableHead>
                                    <TableHead className="hidden sm:table-cell text-right">Оценка</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center text-destructive">
                                            Ошибка при загрузке рецензий.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredReviews.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            Ничего не найдено.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReviews.map((review, index) => (
                                        <TableRow key={review.id}>
                                            <TableCell>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === 0 || moveMutation.isPending || !!searchQuery}
                                                        onClick={() => handleMove(index, "up")}
                                                        title="Поднять"
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <span className="text-xs text-muted-foreground">{index + 1}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        disabled={index === filteredReviews.length - 1 || moveMutation.isPending || !!searchQuery}
                                                        onClick={() => handleMove(index, "down")}
                                                        title="Опустить"
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <img
                                                    src={review.coverUrl}
                                                    alt={review.title}
                                                    className="h-12 w-8 object-cover rounded shadow-sm"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">{review.title}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {review.author}
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                {format(new Date(review.date), "dd MMMM yyyy", { locale: ru })}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-right font-medium">
                                                {review.rating}/5
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <Link to={`/nimda/reviews/${review.id}/edit`}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive focus:ring-destructive"
                                                                onClick={() => setReviewToDelete(review.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Удалить рецензию?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Вы уверены, что хотите удалить рецензию на книгу "{review.title}"?
                                                                    Это действие нельзя отменить.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={() => setReviewToDelete(null)}>
                                                                    Отмена
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={handleDelete}
                                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                                >
                                                                    Удалить
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

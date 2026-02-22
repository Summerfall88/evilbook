import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { toast } from "sonner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Определяем тип для комментария, возвращаемого из БД с присоединенным профилем
type CommentWithProfile = {
    id: string;
    book_id: string;
    content: string;
    created_at: string;
    user_id: string;
    profiles: {
        display_name: string | null;
        avatar_url: string | null;
    } | null;
};

export default function AdminComments() {
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();

    // Получаем комментарии из Supabase
    const { data: comments, isLoading, isError } = useQuery({
        queryKey: ["admin", "comments"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("comments")
                .select(`
          id,
          book_id,
          content,
          created_at,
          user_id,
          profiles (
            display_name,
            avatar_url
          )
        `)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Ошибка при получении комментариев:", error);
                throw error;
            }

            return data as unknown as CommentWithProfile[];
        },
    });

    // Мутация для удаления комментария
    const deleteMutation = useMutation({
        mutationFn: async (commentId: string) => {
            const { error } = await supabase
                .from("comments")
                .delete()
                .eq("id", commentId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Комментарий успешно удален");
            queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
        },
        onError: (error) => {
            console.error("Ошибка удаления:", error);
            toast.error("Не удалось удалить комментарий");
        },
    });

    // Фильтрация
    const filteredComments = comments?.filter((comment) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const contentMatch = comment.content.toLowerCase().includes(query);
        const nameMatch = comment.profiles?.display_name?.toLowerCase().includes(query) || false;
        return contentMatch || nameMatch;
    }) || [];

    return (
        <div className="space-y-6 max-w-[1200px]">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Модерация комментариев</h2>
                <p className="text-muted-foreground">
                    Управление всеми комментариями пользователей сайта.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Список комментариев</CardTitle>
                            <CardDescription>
                                Всего найдено: {filteredComments.length}
                            </CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Поиск по тексту или автору..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 sm:w-[350px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Автор</TableHead>
                                    <TableHead>Комментарий</TableHead>
                                    <TableHead className="w-[150px]">Рецензия</TableHead>
                                    <TableHead className="w-[150px] hidden md:table-cell">Дата</TableHead>
                                    <TableHead className="w-[70px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2">Загрузка комментариев...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-destructive">
                                            Ошибка при загрузке данных
                                        </TableCell>
                                    </TableRow>
                                ) : filteredComments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            Ничего не найдено.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredComments.map((comment) => (
                                        <TableRow key={comment.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                                        <AvatarFallback>
                                                            {comment.profiles?.display_name?.charAt(0)?.toUpperCase() || "?"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm truncate max-w-[120px]">
                                                        {comment.profiles?.display_name || "Без имени"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm line-clamp-2" title={comment.content}>
                                                    {comment.content}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs text-muted-foreground truncate max-w-[120px] inline-block" title={comment.book_id}>
                                                    ID: {comment.book_id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm whitespace-nowrap">
                                                {format(new Date(comment.created_at), "dd MMM yyyy, HH:mm", { locale: ru })}
                                            </TableCell>
                                            <TableCell>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive focus:ring-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Вы уверены, что хотите безвозвратно удалить этот комментарий?
                                                                <div className="mt-4 p-3 bg-muted rounded-md text-sm border">
                                                                    "{comment.content}"
                                                                </div>
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => deleteMutation.mutate(comment.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                {deleteMutation.isPending ? "Удаление..." : "Удалить"}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
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

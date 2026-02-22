import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getReviews } from "@/data/reviews";
import { BookOpen, MessageSquare, Users, Loader2 } from "lucide-react";

export default function AdminDashboard() {
    // Получение количества рецензий (из локального файла данных, т.к. они не в Supabase)
    const { data: reviewsCount, isLoading: reviewsLoading } = useQuery({
        queryKey: ["admin", "reviewsCount"],
        queryFn: async () => {
            const reviews = getReviews();
            return reviews.length;
        },
    });

    // Получение количества комментариев
    const { data: commentsCount, isLoading: commentsLoading } = useQuery({
        queryKey: ["admin", "commentsCount"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("comments")
                .select("*", { count: "exact", head: true });
            if (error) throw error;
            return count || 0;
        },
    });

    // Получение количества зарегистрированных пользователей
    const { data: usersCount, isLoading: usersLoading } = useQuery({
        queryKey: ["admin", "usersCount"],
        queryFn: async () => {
            const { count, error } = await supabase
                .from("profiles")
                .select("*", { count: "exact", head: true });
            if (error) throw error;
            return count || 0;
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Дашборд</h2>
                <p className="text-muted-foreground">
                    Добро пожаловать в панель управления Evilbook.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Виджет Рецензий */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Всего рецензий
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {reviewsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                reviewsCount
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Виджет Комментариев */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Всего комментариев
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {commentsLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                commentsCount
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Виджет Пользователей */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Пользователи
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {usersLoading ? (
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            ) : (
                                usersCount
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

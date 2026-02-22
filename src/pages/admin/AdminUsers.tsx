import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Search, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Profile = {
    id: string;
    display_name: string | null;
    role: "admin" | "user" | null;
    created_at: string;
};

export default function AdminUsers() {
    const [searchQuery, setSearchQuery] = useState("");
    const queryClient = useQueryClient();
    const { currentUser } = useAuth();

    // Загружаем список профилей
    const { data: profiles, isLoading, isError } = useQuery({
        queryKey: ["admin", "profiles"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("id, display_name, role, created_at")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Profile[];
        },
    });

    // Мутация для смены роли
    const roleMutation = useMutation({
        mutationFn: async ({ userId, newRole }: { userId: string; newRole: "admin" | "user" }) => {
            // Пока (до шага 8) это может падать с ошибкой RLS, если пытаться изменить чужой профиль без политик админа
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Роль пользователя успешно обновлена");
            queryClient.invalidateQueries({ queryKey: ["admin", "profiles"] });
        },
        onError: (error: any) => {
            console.error("Ошибка обновления роли:", error);

            // Даем более понятное сообщение для ошибки RLS (Шаг 8)
            if (error.code === '42501' || error.message?.includes('row-level security')) {
                toast.error("Недостаточно прав базы данных. Настройте политики RLS (Шаг 8 плана).");
            } else {
                toast.error("Не удалось обновить роль пользователя");
            }
        },
    });

    const handleRoleChange = (userId: string, newRole: "admin" | "user") => {
        if (userId === currentUser?.id) {
            toast.error("Вы не можете изменить собственную роль");
            return;
        }
        roleMutation.mutate({ userId, newRole });
    };

    // Фильтрация
    const filteredProfiles = profiles?.filter((profile) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const nameMatch = profile.display_name?.toLowerCase().includes(query) || false;
        const idMatch = profile.id.toLowerCase().includes(query);
        return nameMatch || idMatch;
    }) || [];

    return (
        <div className="space-y-6 max-w-[1200px]">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Пользователи</h2>
                <p className="text-muted-foreground">
                    Список зарегистрированных читателей и управление правами администратора.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Список профилей</CardTitle>
                            <CardDescription>
                                Всего найдено: {filteredProfiles.length}
                            </CardDescription>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Поиск по имени или ID..."
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
                                    <TableHead className="w-[100px]">ID UUID</TableHead>
                                    <TableHead>Имя пользователя</TableHead>
                                    <TableHead className="w-[200px]">Дата регистрации</TableHead>
                                    <TableHead className="w-[180px]">Текущая Роль</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                <span className="ml-2">Загрузка пользователей...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : isError ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-destructive">
                                            Ошибка при загрузке данных о пользователях
                                        </TableCell>
                                    </TableRow>
                                ) : filteredProfiles.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Ничего не найдено.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredProfiles.map((profile) => {
                                        const isSelf = profile.id === currentUser?.id;
                                        const currentRole = profile.role || "user";

                                        return (
                                            <TableRow key={profile.id}>
                                                <TableCell>
                                                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded" title={profile.id}>
                                                        {profile.id.substring(0, 8)}...
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium flex items-center gap-2">
                                                        {profile.display_name || "Без имени"}
                                                        {isSelf && (
                                                            <Badge variant="outline" className="text-xs">Вы</Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(profile.created_at), "dd MMM yyyy", { locale: ru })}
                                                </TableCell>
                                                <TableCell>
                                                    {isSelf ? (
                                                        <div className="flex items-center gap-2 text-sm font-medium text-amber-600 px-3 py-2 border rounded-md bg-amber-50">
                                                            <ShieldAlert className="h-4 w-4" />
                                                            Владелец
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <Select
                                                                value={currentRole}
                                                                onValueChange={(val: "admin" | "user") => handleRoleChange(profile.id, val)}
                                                                disabled={roleMutation.isPending && roleMutation.variables?.userId === profile.id}
                                                            >
                                                                <SelectTrigger className={currentRole === "admin" ? "border-amber-500 bg-amber-50 text-amber-700 font-medium" : ""}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="user">Пользователь</SelectItem>
                                                                    <SelectItem value="admin">
                                                                        <span className="text-amber-600 font-medium">Администратор</span>
                                                                    </SelectItem>
                                                                </SelectContent>
                                                            </Select>

                                                            {roleMutation.isPending && roleMutation.variables?.userId === profile.id && (
                                                                <div className="absolute inset-y-0 right-8 flex items-center">
                                                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

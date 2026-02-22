import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
    {
        title: "Дашборд",
        href: "/nimda",
        icon: LayoutDashboard,
    },
    {
        title: "Рецензии",
        href: "/nimda/reviews",
        icon: BookOpen,
    },
    {
        title: "Комментарии",
        href: "/nimda/comments",
        icon: MessageSquare,
    },
    {
        title: "Пользователи",
        href: "/nimda/users",
        icon: Users,
    },
];

export function AdminLayout() {
    const location = useLocation();

    return (
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
                <div className="h-full py-6 pr-6 lg:py-8">
                    <nav className="flex flex-col space-y-1">
                        {sidebarLinks.map((item) => {
                            const isActive = location.pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground",
                                        isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>
            <main className="flex w-full flex-col overflow-hidden py-6 lg:py-8">
                <Outlet />
            </main>
        </div>
    );
}

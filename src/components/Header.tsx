import { useState, useRef } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, Search, X, Bell, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import AuthDialog from "@/components/AuthDialog";
import UserProfileSheet from "@/components/UserProfileSheet";
import NotificationsSheet from "@/components/NotificationsSheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

const Header = () => {
  const { pathname } = useLocation();
  const { user, displayName, loading, signOut } = useAuth();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Fetch real unread notifications count
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ["unread_notifications_count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Pull-to-refresh logic
  const touchStartY = useRef<number | null>(null);
  const PULL_THRESHOLD = 80; // pixels to pull before refreshing

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      sessionStorage.setItem("evilbook-search", searchQuery);
      if (pathname === "/reviews") {
        window.location.reload();
      } else {
        navigate("/reviews");
      }
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only register pull if we are at the top of the page (or since header is fixed, just register it)
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchCurrentY = e.touches[0].clientY;
    const deltaY = touchCurrentY - touchStartY.current;

    // Optional: add visual feedback here (transform) if desired.
    // For now, keeping it invisible as requested.
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchEndY - touchStartY.current;

    if (deltaY > PULL_THRESHOLD) {
      // Trigger refresh
      window.location.reload();
    }

    // Reset
    touchStartY.current = null;
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 bg-background/95 border-b border-border/50 backdrop-blur-sm"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="container mx-auto flex items-center justify-between py-4 px-4 h-[72px]">
        {/* Left: Search Icon */}
        <div className="flex-1 flex justify-start">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} className="text-foreground">
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </Button>
        </div>

        {/* Center: Title / Logo */}
        <div className="flex flex-1 justify-center items-center">
          <Link
            to="/reviews"
            onClick={(e) => {
              if (pathname === "/reviews") {
                e.preventDefault();
                window.location.reload();
              }
            }}
            className="flex items-center group"
          >
            <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden group-hover:border-[#ce6355]/50 transition-colors duration-300">
              <img src="/favicon.png?v=2" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
          </Link>
        </div>

        {/* Right: Notifications & Burger Menu */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {/* Notification Badge */}
          {user && (
            <Button variant="ghost" size="icon" onClick={() => setNotificationsOpen(true)} className="relative text-foreground">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} className="text-foreground">
            <Menu size={24} />
          </Button>
        </div>
      </div>

      {/* Search Dropdown */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 p-4 bg-background border-b border-border/50 shadow-md animate-in slide-in-from-top-2">
          <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию или автору..."
                className="pl-10 w-full bg-card border-border/50 text-foreground placeholder:text-xs sm:placeholder:text-sm"
              />
            </div>
            <Button type="submit" variant="default" className="bg-[#ce6355] text-white hover:bg-[#ce6355]/90">
              Искать
            </Button>
          </form>
        </div>
      )}

      {/* Navigation menu sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="w-72"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle className="font-display font-bold">Меню</SheetTitle>
            <SheetDescription className="sr-only">Навигация по сайту</SheetDescription>
          </SheetHeader>
          <nav className="flex flex-col gap-4 mt-6 font-body text-base">
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className={`uppercase tracking-widest transition-colors hover:text-primary ${pathname === "/" ? "text-primary" : "text-muted-foreground"}`}
            >
              Главная
            </Link>
            <Link
              to="/reviews"
              onClick={() => setMenuOpen(false)}
              className={`uppercase tracking-widest transition-colors hover:text-primary ${pathname === "/reviews" || pathname.startsWith("/review/") ? "text-primary" : "text-muted-foreground"}`}
            >
              Все рецензии
            </Link>

            {isInstallable && (
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await promptInstall();
                }}
                className="flex items-center gap-2 uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                <Download size={16} />
                Установить приложение
              </button>
            )}

            <div className="border-t border-border/50 pt-4 mt-2">
              {!loading && (
                user ? (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileOpen(true);
                      }}
                      className="text-left uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      Личный кабинет
                    </button>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="text-left uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      Выйти
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthOpen(true);
                    }}
                    className="uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                    Войти
                  </button>
                )
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
      {user && (
        <>
          <UserProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
          <NotificationsSheet open={notificationsOpen} onOpenChange={setNotificationsOpen} />
        </>
      )}
    </header>
  );
};

export default Header;

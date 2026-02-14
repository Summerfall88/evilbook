import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, BookOpen } from "lucide-react";
import AuthDialog from "@/components/AuthDialog";
import UserProfileSheet from "@/components/UserProfileSheet";
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
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-card border border-border/50 flex items-center justify-center overflow-hidden group-hover:border-[#ce6355]/50 transition-colors duration-300">
            <img src="favicon.png" alt="Evilbook Logo" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <h1 className="font-evilbook text-xl font-semibold tracking-wide text-foreground leading-none">
              Evilbook
            </h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              by Christina
            </span>
          </div>
        </Link>

        <Button variant="ghost" size="icon" onClick={() => setMenuOpen(true)} className="text-foreground">
          <Menu size={24} />
        </Button>
      </div>

      {/* Navigation menu sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-72">
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
        <UserProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      )}
    </header>
  );
};

export default Header;

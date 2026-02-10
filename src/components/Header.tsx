import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";

const Header = () => {
  const { pathname } = useLocation();
  const { user, displayName, loading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div>
            <h1 className="font-display text-xl font-semibold tracking-wide text-foreground leading-none">
              Evilbook
            </h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              by Christina
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6 text-sm font-body">
          <Link
            to="/"
            className={`uppercase tracking-widest transition-colors hover:text-gold ${pathname === "/" ? "text-gold" : "text-muted-foreground"}`}
          >
            Главная
          </Link>
          <Link
            to="/reviews"
            className={`uppercase tracking-widest transition-colors hover:text-gold ${pathname === "/reviews" || pathname.startsWith("/review/") ? "text-gold" : "text-muted-foreground"}`}
          >
            Все рецензии
          </Link>

          {!loading && (
            user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {displayName}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut} className="text-xs">
                  Выйти
                </Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setAuthOpen(true)} className="text-xs uppercase tracking-widest">
                  Войти
                </Button>
                <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
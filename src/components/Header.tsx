import { Link, useLocation } from "react-router-dom";
import { BookOpen } from "lucide-react";

const Header = () => {
  const { pathname } = useLocation();

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <BookOpen className="h-6 w-6 text-gold transition-transform group-hover:rotate-[-8deg]" />
          <div>
            <h1 className="font-display text-xl font-semibold tracking-wide text-foreground leading-none">
              Evilbook
            </h1>
            <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              by Christina
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-body">
          <Link
            to="/"
            className={`uppercase tracking-widest transition-colors hover:text-gold ${
              pathname === "/" ? "text-gold" : "text-muted-foreground"
            }`}
          >
            Главная
          </Link>
          <Link
            to="/reviews"
            className={`uppercase tracking-widest transition-colors hover:text-gold ${
              pathname === "/reviews" ? "text-gold" : "text-muted-foreground"
            }`}
          >
            Все рецензии
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;

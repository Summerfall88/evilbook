import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="mt-auto py-8 border-t border-border/40 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                <div>
                    © {new Date().getFullYear()} Evilbook. Книжный блог Кристины.
                </div>
                <div className="flex gap-6">
                    <a
                        href="/privacy.html"
                        className="hover:text-primary transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Политика конфиденциальности
                    </a>
                    <a
                        href="/terms.html"
                        className="hover:text-primary transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Пользовательское соглашение
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

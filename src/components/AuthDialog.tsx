import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import TermsDialog from "@/components/TermsDialog";

interface AuthDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AuthDialog = ({ trigger, open, onOpenChange }: AuthDialogProps) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot_password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (mode === "forgot_password") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Ссылка для восстановления пароля отправлена на почту");
        setMode("login");
      }
      setSubmitting(false);
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName || "Пользователь" },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Проверьте почту для подтверждения регистрации");
        onOpenChange?.(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Вы вошли в аккаунт");
        onOpenChange?.(false);
      }
    }
    setSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
    }
    // No need to setSubmitting(false) on success as the page will redirect
  };

  const switchToRegister = () => {
    setAgreedToTerms(false);
    setMode("register");
  };

  const switchToLogin = () => {
    setAgreedToTerms(false);
    setMode("login");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {mode === "login" ? "Вход" : mode === "register" ? "Регистрация" : "Восстановление пароля"}
            </DialogTitle>
            <DialogDescription>
              {mode === "login"
                ? "Войдите, чтобы оставлять комментарии"
                : mode === "register"
                  ? "Создайте аккаунт для участия в обсуждениях"
                  : "Введите email, на который зарегистрирован аккаунт"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <Input
                placeholder="Имя"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {mode !== "forgot_password" && (
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}

            {mode === "register" && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(v) => setAgreedToTerms(v === true)}
                  className="mt-0.5 rounded-full"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                  Я ознакомлен(а) и согласен(на) с{" "}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="text-primary underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    Пользовательским соглашением и политикой конфиденциальности
                  </button>
                </label>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || (mode === "register" && !agreedToTerms)}
            >
              {submitting ? "..." : mode === "login" ? "Войти" : mode === "register" ? "Зарегистрироваться" : "Отправить ссылку"}
            </Button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Или войти через</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>

          <div className="flex flex-col items-center gap-2 mt-4 text-sm text-muted-foreground">
            {mode === "login" && (
              <button type="button" onClick={() => setMode("forgot_password")} className="hover:text-foreground hover:underline transition-colors text-xs">
                Забыли пароль?
              </button>
            )}

            <p className="text-center">
              {mode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button onClick={switchToRegister} className="text-gold hover:underline">
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button onClick={switchToLogin} className="text-gold hover:underline">
                    Войти
                  </button>
                </>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog >

      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
};

export default AuthDialog;

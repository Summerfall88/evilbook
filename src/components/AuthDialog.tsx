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
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">
              {mode === "login" ? "Вход" : "Регистрация"}
            </DialogTitle>
            <DialogDescription>
              {mode === "login"
                ? "Войдите, чтобы оставлять комментарии"
                : "Создайте аккаунт для участия в обсуждениях"}
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
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

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
              {submitting ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
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
        </DialogContent>
      </Dialog>

      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </>
  );
};

export default AuthDialog;

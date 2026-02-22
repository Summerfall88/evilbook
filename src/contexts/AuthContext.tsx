import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
interface AuthState {
  user: User | null;
  displayName: string | null;
  role: "admin" | "user" | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  useEffect(() => {
    // Listen for auth changes (handles initial session too)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        setProfileLoading(true);
        // Fetch profile in background without blocking UI
        supabase
          .from("profiles")
          .select("display_name, role")
          .eq("id", currentUser.id)
          .maybeSingle()
          .then(({ data }) => {
            setDisplayName(data?.display_name ?? "Пользователь");
            setRole(data?.role as "admin" | "user" | null);
            setProfileLoading(false);
          });
      } else {
        setDisplayName(null);
        setRole(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Пароль успешно обновлён");
      setRecoveryMode(false);
      setNewPassword("");
    }
    setUpdatingPassword(false);
  };

  return (
    <AuthContext.Provider value={{ user, displayName, role, loading, profileLoading, signOut }}>
      {children}
      <Dialog open={recoveryMode} onOpenChange={setRecoveryMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display font-bold">Восстановление пароля</DialogTitle>
            <DialogDescription>
              Введите ваш новый пароль
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              type="password"
              placeholder="Новый пароль"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <Button type="submit" className="w-full" disabled={updatingPassword}>
              {updatingPassword ? "..." : "Сохранить"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

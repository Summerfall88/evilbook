import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
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
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Use useQuery for profile fetching to benefit from global retries and caching
  const {
    data: profile,
    isLoading: isProfileQueryLoading,
  } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const displayName = profile?.display_name || (user ? "Пользователь" : null);
  const role = profile?.role as "admin" | "user" | null;
  const profileLoading = isProfileQueryLoading && !!user;

  useEffect(() => {
    // Listen for auth changes (handles initial session too)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
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

  const contextValue = useMemo(() => ({
    user,
    displayName,
    role,
    loading,
    profileLoading,
    signOut
  }), [user, displayName, role, loading, profileLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
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

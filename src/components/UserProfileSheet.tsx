import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserProfileSheet = ({ open, onOpenChange }: UserProfileSheetProps) => {
  const { user, displayName } = useAuth();
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      setNewName(displayName ?? "");
      setNewPassword("");

      // Fetch comment count
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .then(({ count }) => setCommentCount(count ?? 0));
    }
  }, [open, user, displayName]);

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName.trim() })
      .eq("id", user.id);

    if (error) {
      toast.error("Не удалось обновить имя");
    } else {
      toast.success("Имя обновлено");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Пароль должен быть не менее 6 символов");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Пароль обновлён");
      setNewPassword("");
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="font-display font-bold">Личный кабинет</SheetTitle>
          <SheetDescription>Управление аккаунтом</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Comment stats */}
          <div className="border border-border/50 rounded-lg p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{commentCount}</p>
            <p className="text-sm text-muted-foreground">комментариев оставлено</p>
          </div>

          {/* Change name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Имя</label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ваше имя"
            />
            <Button size="sm" onClick={handleSaveName} disabled={saving} className="w-full">
              Сохранить имя
            </Button>
          </div>

          {/* Change password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Новый пароль</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              minLength={6}
            />
            <Button size="sm" onClick={handleChangePassword} disabled={saving} className="w-full">
              Сменить пароль
            </Button>
          </div>

          {/* Newsletter */}
          <div className="flex items-center gap-3 border border-border/50 rounded-lg p-4">
            <Checkbox
              id="newsletter"
              checked={newsletter}
              onCheckedChange={(v) => setNewsletter(v === true)}
            />
            <label htmlFor="newsletter" className="text-sm text-foreground cursor-pointer">
              Подписаться на email-рассылку о новостях сайта
            </label>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserProfileSheet;

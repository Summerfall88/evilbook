import { useAuth } from "./useAuth";

export function useAdmin(): boolean {
  const { role } = useAuth();
  return role === "admin";
}


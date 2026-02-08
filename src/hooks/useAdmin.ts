import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const ADMIN_KEY = "evilbook-admin";

export function useAdmin(): boolean {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem(ADMIN_KEY) === "1");

  useEffect(() => {
    if (searchParams.has("admin")) {
      sessionStorage.setItem(ADMIN_KEY, "1");
      setIsAdmin(true);
      // Remove ?admin from URL to keep it clean
      searchParams.delete("admin");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return isAdmin;
}


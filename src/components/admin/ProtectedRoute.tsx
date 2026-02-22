import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
    const { user, role, loading, profileLoading } = useAuth();

    if (loading || profileLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user || role !== "admin") {
        // If not logged in or not an admin, redirect to home page
        return <Navigate to="/" replace />;
    }

    // If logged in and admin, render the child routes
    return <Outlet />;
}

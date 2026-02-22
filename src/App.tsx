import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Reviews from "./pages/Reviews";
import ReviewDetail from "./pages/ReviewDetail";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/admin/ProtectedRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReviews from "./pages/admin/AdminReviews";
import AdminReviewForm from "./pages/admin/AdminReviewForm";
import AdminComments from "./pages/admin/AdminComments";
import AdminUsers from "./pages/admin/AdminUsers";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Disable automatic scroll restoration
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Detect iOS to apply specific fixes
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS) {
      document.documentElement.classList.add('is-ios');
    } else {
      document.documentElement.classList.remove('is-ios');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/evilbook/">
          <AuthProvider>
            <ScrollToTop />
            <Header />
            <main className="pt-20 pb-safe flex flex-col grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/review/:id" element={<ReviewDetail />} />

                {/* Admin Routes */}
                <Route path="/nimda" element={<ProtectedRoute />}>
                  <Route element={<AdminLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="reviews/new" element={<AdminReviewForm />} />
                    <Route path="reviews/:id/edit" element={<AdminReviewForm />} />
                    <Route path="comments" element={<AdminComments />} />
                    <Route path="users" element={<AdminUsers />} />
                    {/* Placeholder for future admin routes */}
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // #root is the actual scroll container for all platforms
    // (body is position:fixed, overflow:hidden — scroll lives in #root)
    const root = document.getElementById("root");

    const scrollToTop = () => {
      if (root) {
        root.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
      // Fallback for window, just in case
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    // First attempt — immediate
    scrollToTop();

    // Second attempt — after React has painted the new page
    const raf = requestAnimationFrame(() => {
      scrollToTop();
    });

    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
};

export default ScrollToTop;

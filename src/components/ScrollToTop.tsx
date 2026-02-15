import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Temporarily disabled to rule out JS-induced jumps
    console.log("ScrollToTop blocked a potential jump for path:", pathname);
    return () => { };
  }, [pathname]);

  return null;
};

export default ScrollToTop;

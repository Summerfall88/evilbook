import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Global store for the PWA install prompt to avoid race conditions
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).deferredPWAInstallPrompt = e;
  // Dispatch a custom event to notify listeners that the prompt is available
  window.dispatchEvent(new Event("pwa-installable"));
});

// Register service worker for PWA install support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // SW registration failed — PWA install won't be available
  });
}

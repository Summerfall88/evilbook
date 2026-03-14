import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(!!(window as any).deferredPWAInstallPrompt);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = () => {
      setIsInstallable(true);
    };

    // If it was already caught globally, set it now
    if ((window as any).deferredPWAInstallPrompt) {
      setIsInstallable(true);
    }

    // Listen for future triggers
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("pwa-installable", handler);

    // Hide button after successful install
    const installedHandler = () => {
      setIsInstallable(false);
      (window as any).deferredPWAInstallPrompt = null;
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("pwa-installable", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = (window as any).deferredPWAInstallPrompt as BeforeInstallPromptEvent;
    if (!promptEvent) return;

    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      (window as any).deferredPWAInstallPrompt = null;
    }
  };

  return { isInstallable, promptInstall };
}

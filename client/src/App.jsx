import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import AppRouter from "@/app/router";
import { Toast } from "@components/ui";
import { useAuthStore, useUIStore } from "@store";

export default function App() {
  const location = useLocation();
  const initializedRef = useRef(false);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const toast = useUIStore((state) => state.toast);
  const dismissToast = useUIStore((state) => state.dismissToast);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");

      window.requestAnimationFrame(() => {
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      return;
    }

    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return (
    <>
      <AppRouter />
      {toast ? (
        <div className="fixed bottom-4 right-4 z-[100]">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={dismissToast}
          />
        </div>
      ) : null}
    </>
  );
}

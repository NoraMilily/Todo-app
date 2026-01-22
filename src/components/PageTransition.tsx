"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Only show loader if pathname actually changed
    if (prevPathnameRef.current !== pathname) {
      setIsLoading(true);
      setShowLoader(true);
      prevPathnameRef.current = pathname;
      startTimeRef.current = Date.now();

      // Minimum display time for better UX (800ms)
      const minDisplayTime = 800;
      const elapsedTime = 0;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      const timer = setTimeout(() => {
        setIsLoading(false);
        // Keep loader visible for smooth transition
        setTimeout(() => {
          setShowLoader(false);
        }, 200);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  return (
    <>
      {children}
      {showLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        </div>
      )}
    </>
  );
}

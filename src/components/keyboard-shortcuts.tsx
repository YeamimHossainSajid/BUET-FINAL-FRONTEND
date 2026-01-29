"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      switch (e.key.toLowerCase()) {
        case "k":
          e.preventDefault();
          router.push("/dashboard");
          break;
        case "o":
          e.preventDefault();
          router.push("/orders");
          break;
        case "i":
          e.preventDefault();
          router.push("/inventory");
          break;
        case "a":
          e.preventDefault();
          router.push("/analytics");
          break;
        case "/":
          e.preventDefault();
          (document.querySelector('[aria-label="Search"]') as HTMLElement)?.focus();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}

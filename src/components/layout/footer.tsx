"use client";

import { Wifi, WifiOff, Activity } from "lucide-react";
import { useOfflineStore } from "@/stores/offline-store";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

let latencyMs = 0;

export function Footer() {
  const isOnline = useOfflineStore((s) => s.isOnline);
  const setOnline = useOfflineStore((s) => s.setOnline);
  const [latency, setLatency] = useState<number | null>(null);
  const [health, setHealth] = useState<"ok" | "degraded" | "error">("ok");

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    if (!isOnline) {
      setLatency(null);
      return;
    }
    const t0 = performance.now();
    fetch("/api/health", { cache: "no-store" })
      .then(() => {
        latencyMs = Math.round(performance.now() - t0);
        setLatency(latencyMs);
        setHealth(latencyMs < 200 ? "ok" : latencyMs < 500 ? "degraded" : "error");
      })
      .catch(() => {
        setHealth("error");
        setLatency(null);
      });
    const id = setInterval(() => {
      const t0 = performance.now();
      fetch("/api/health", { cache: "no-store" })
        .then(() => {
          latencyMs = Math.round(performance.now() - t0);
          setLatency(latencyMs);
          setHealth(latencyMs < 200 ? "ok" : latencyMs < 500 ? "degraded" : "error");
        })
        .catch(() => setHealth("error"));
    }, 30000);
    return () => clearInterval(id);
  }, [isOnline]);

  return (
    <footer
      className="flex h-10 items-center justify-between border-t bg-muted/30 px-4 text-xs text-muted-foreground"
      role="contentinfo"
    >
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5" aria-label="Network status">
          {isOnline ? (
            <Wifi className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
          )}
          {isOnline ? "Online" : "Offline"}
        </span>
        {latency != null && (
          <span
            className={cn(
              "flex items-center gap-1.5",
              health === "ok" && "text-green-600",
              health === "degraded" && "text-amber-600",
              health === "error" && "text-destructive"
            )}
            aria-label={`API latency: ${latency}ms`}
          >
            <Activity className="h-3.5 w-3.5" aria-hidden="true" />
            {latency}ms
          </span>
        )}
      </div>
      <div>E-Commerce Dashboard v1.0</div>
    </footer>
  );
}

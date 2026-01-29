"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const WS_MOCK = process.env.NEXT_PUBLIC_WS_MOCK === "true";

const MAX_RECONNECT_ATTEMPTS = 5;
const INITIAL_RECONNECT_MS = 1000;

export function useWebSocket() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connected, setConnected] = useState(false);

  const invalidateOrderQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const invalidateInventoryQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Mock mode: poll invalidation when no WS URL (for demo without backend)
    if (WS_MOCK && !WS_URL) {
      const interval = setInterval(() => {
        invalidateOrderQueries();
        invalidateInventoryQueries();
      }, 30_000);
      return () => clearInterval(interval);
    }

    if (!WS_URL) return;

    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttemptRef.current = 0;
      };

      ws.onclose = () => {
        wsRef.current = null;
        setConnected(false);
        if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) return;
        const delay = INITIAL_RECONNECT_MS * Math.pow(2, reconnectAttemptRef.current);
        reconnectAttemptRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          if (data.type === "order_updated" || data.type === "new_order") {
            invalidateOrderQueries();
          }
          if (data.type === "inventory_updated") {
            invalidateInventoryQueries();
          }
        } catch {
          // ignore parse errors
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      reconnectAttemptRef.current = MAX_RECONNECT_ATTEMPTS;
    };
  }, [queryClient]);

  return { connected };
}

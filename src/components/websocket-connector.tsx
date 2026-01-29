"use client";

import { useWebSocket } from "@/hooks/use-websocket";

/**
 * Mounts the WebSocket hook so real-time order and inventory events
 * invalidate React Query caches. Renders nothing.
 */
export function WebSocketConnector() {
  useWebSocket();
  return null;
}

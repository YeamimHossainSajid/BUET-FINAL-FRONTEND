"use client";

import { useWebSocket } from "@/hooks/use-websocket";

export function WebSocketConnector() {
  useWebSocket();
  return null;
}

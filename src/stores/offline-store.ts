import { create } from "zustand";

export interface QueuedAction {
  id: string;
  type: string;
  payload: unknown;
  timestamp: number;
  retries: number;
}

interface OfflineState {
  isOnline: boolean;
  queue: QueuedAction[];
  addToQueue: (action: Omit<QueuedAction, "id" | "timestamp" | "retries">) => void;
  removeFromQueue: (id: string) => void;
  setOnline: (online: boolean) => void;
  clearQueue: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  queue: [],
  addToQueue: (action) =>
    set((s) => ({
      queue: [
        ...s.queue,
        {
          ...action,
          id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
          retries: 0,
        },
      ],
    })),
  removeFromQueue: (id) =>
    set((s) => ({ queue: s.queue.filter((a) => a.id !== id) })),
  setOnline: (online) => set({ isOnline: online }),
  clearQueue: () => set({ queue: [] }),
}));

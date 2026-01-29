import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_KEY = "ecom_auth";
const STORAGE_KEY = "ecom-auth-store";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  customerId: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string, expiresAt: number, customerId?: string) => void;
  setCustomerId: (customerId: string) => void;
  logout: () => void;
  getStoredToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      customerId: null,
      isAuthenticated: false,
      setTokens: (access, refresh, expiresAt, customerId) =>
        set({
          accessToken: access,
          refreshToken: refresh,
          expiresAt,
          customerId: customerId ?? get().customerId,
          isAuthenticated: true,
        }),
      setCustomerId: (customerId) => set({ customerId }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          customerId: null,
          isAuthenticated: false,
        }),
      getStoredToken: () => {
        const state = get();
        if (state.expiresAt && Date.now() >= state.expiresAt - 60_000) {
          return null;
        }
        return state.accessToken;
      },
    }),
    { name: STORAGE_KEY }
  )
);

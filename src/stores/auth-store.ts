import { create } from "zustand";
import { persist } from "zustand/middleware";

const TOKEN_KEY = "ecom_auth";
const STORAGE_KEY = "ecom-auth-store";

export interface AuthState {
  accessToken: string | null;
  expiresAt: string | null;
  customerId: string | null;
  isAuthenticated: boolean;
  setTokens: (access: string, expiresAt: string, customerId?: string) => void;
  setCustomerId: (customerId: string) => void;
  logout: () => void;
  getStoredToken: () => string | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      expiresAt: null,
      customerId: null,
      isAuthenticated: false,
      setTokens: (access, expiresAt, customerId) =>
        set({
          accessToken: access,
          expiresAt,
          customerId: customerId ?? get().customerId,
          isAuthenticated: true,
        }),
      setCustomerId: (customerId) => set({ customerId }),
      logout: () =>
        set({
          accessToken: null,
          expiresAt: null,
          customerId: null,
          isAuthenticated: false,
        }),
      getStoredToken: () => {
        const state = get();
        if (state.expiresAt && new Date(state.expiresAt).getTime() <= Date.now()) {
          return null;
        }
        return state.accessToken;
      },
    }),
    { name: STORAGE_KEY }
  )
);

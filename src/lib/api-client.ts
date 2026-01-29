"use client";

import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { generateIdempotencyKey } from "./utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const IDEMPOTENCY_HEADER = "Idempotency-Key";

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (!config.headers[IDEMPOTENCY_HEADER] && ["post", "put", "patch"].includes((config.method ?? "").toLowerCase())) {
      config.headers[IDEMPOTENCY_HEADER] = generateIdempotencyKey();
    }
    return config;
  },
  (err) => Promise.reject(err)
);

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) throw new Error("No refresh token");
  refreshPromise = apiClient
    .post<{ accessToken: string; expiresAt: number }>("/api/auth/refresh", { refreshToken })
    .then((res) => {
      useAuthStore.getState().setTokens(res.data.accessToken, refreshToken, res.data.expiresAt);
      return res.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        useAuthStore.getState().logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;

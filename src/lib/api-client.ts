"use client";

import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";
import { generateIdempotencyKey } from "./utils";

const API_BASE = "http://api.bcf26.k8s.monzim.com/";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

const IDEMPOTENCY_HEADER = "idempotency-key"; // Spec uses snake-case for schema field but usually headers are case-insensitive. However, some middleware might be strict.

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

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default apiClient;

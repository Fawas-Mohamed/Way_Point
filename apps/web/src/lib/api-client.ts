import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "./env";
import { tokenStore } from "./tokenStore";

export const apiClient = axios.create({
  baseURL: `${env.apiUrl}/api/v1`,
  withCredentials: true, // sends the httpOnly refresh cookie
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Multiple requests can 401 at once (e.g. a page firing several queries
  // in parallel) — de-dupe so only one refresh call is made, and every
  // waiting request awaits the same promise.
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${env.apiUrl}/api/v1/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.data?.accessToken ?? null;
        tokenStore.set(token);
        return token;
      })
      .catch(() => {
        tokenStore.set(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && config && !config._retried && !config.url?.includes("/auth/")) {
      config._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(config);
      }
      tokenStore.notifyUnauthorized();
    }

    return Promise.reject(error);
  },
);

export interface ApiErrorPayload {
  success: false;
  error: { message: string; code: string; details?: Record<string, string[]> };
}

/** Pulls a human-readable message out of our API's standard error envelope. */
export function getApiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    if (payload?.error?.message) return payload.error.message;
  }
  return fallback;
}

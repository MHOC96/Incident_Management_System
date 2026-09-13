import type { ApiError, AuthTokens } from "@/types";

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.replace(/([^:]\/)\/+/g, "$1");
}

const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api",
);

type RequestOptions = RequestInit & {
  auth?: boolean;
  json?: boolean;
};

class ApiClientError extends Error {
  status: number;
  payload: ApiError;

  constructor(message: string, status: number, payload: ApiError) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.payload = payload;
  }
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("access_token");
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("refresh_token");
}

function setTokens(tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
}

function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string };
  localStorage.setItem("access_token", data.access);
  return data.access;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  const useJson = options.json !== false;

  if (useJson && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth !== false) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let headers = buildHeaders(options);

  let response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && options.auth !== false) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers = buildHeaders(options);
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
      });
    }
  }

  const payload = (await response.json().catch(() => ({}))) as ApiError;

  if (!response.ok) {
    throw new ApiClientError(
      payload.detail?.toString() ?? "Request failed.",
      response.status,
      payload,
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  postFormData: <T>(path: string, formData: FormData, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "POST",
      body: formData,
      json: false,
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  getBaseUrl: () => API_URL,
};

export { ApiClientError };

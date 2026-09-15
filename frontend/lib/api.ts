import type { ApiError } from "@/types";

function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  return trimmed.replace(/([^:]\/)\/+/g, "$1");
}

const API_URL = normalizeApiUrl("/api");
let csrfToken: string | null = null;
let csrfRequest: Promise<void> | null = null;

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

async function ensureCsrfToken() {
  if (csrfToken) return;
  if (!csrfRequest) {
    csrfRequest = request<{ csrfToken: string }>("/auth/session/", { auth: false })
      .then(data => { csrfToken = data.csrfToken; })
      .finally(() => { csrfRequest = null; });
  }
  await csrfRequest;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  const useJson = options.json !== false;

  if (useJson && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (csrfToken && !["GET", "HEAD", "OPTIONS"].includes(options.method ?? "GET")) {
    headers.set("X-CSRFToken", csrfToken);
  }

  return headers;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!["GET", "HEAD", "OPTIONS"].includes(options.method ?? "GET")) {
    await ensureCsrfToken();
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "same-origin",
    cache: "no-store",
    headers: buildHeaders(options),
  });

  const payload = (await response.json().catch(() => ({}))) as ApiError;

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-expired"));
    }
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
  setCsrfToken: (token: string | null) => { csrfToken = token; },
  getBaseUrl: () => API_URL,
};

export { ApiClientError };

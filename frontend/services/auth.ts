import { apiClient } from "@/lib/api";
import type { LoginPayload, PasswordChangePayload, User } from "@/types";

type SessionResponse = { user: User | null; csrfToken: string };
let sessionRequest: Promise<SessionResponse> | null = null;

export const authService = {
  async login(payload: LoginPayload): Promise<User> {
    const data = await apiClient.post<SessionResponse>("/auth/login/", payload, { auth: false });
    apiClient.setCsrfToken(data.csrfToken);
    return data.user!;
  },

  async session(): Promise<SessionResponse> {
    sessionRequest ??= apiClient.get<SessionResponse>("/auth/session/", { auth: false })
      .then(data => { apiClient.setCsrfToken(data.csrfToken); return data; })
      .finally(() => { sessionRequest = null; });
    return sessionRequest;
  },

  async logout() {
    await apiClient.post("/auth/logout/");
    apiClient.setCsrfToken(null);
  },

  async fetchProfile(): Promise<User> {
    return apiClient.get<User>("/auth/profile/");
  },

  changePassword: (payload: PasswordChangePayload) =>
    apiClient.post<{ detail: string }>("/auth/change-password/", payload),

};

export const healthService = {
  check: () =>
    apiClient.get<{ status: string; service: string }>("/health/", {
      auth: false,
    }),
};

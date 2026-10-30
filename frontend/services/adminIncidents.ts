import { apiClient } from "@/lib/api";
import type {
  AdminIncidentReview,
  IncidentDetail,
  PaginatedResponse,
} from "@/types";

export const adminIncidentService = {
  listPendingReview: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/pending-review/"),

  listPendingChanges: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/pending-changes/"),

  listAwaitingAssignment: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/awaiting-action/"),

  listRejected: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/rejected-reports/"),

  getForReview: (id: number) =>
    apiClient.get<AdminIncidentReview>(`/incidents/${id}/`),

  verify: (id: number, comment?: string) =>
    apiClient.post<AdminIncidentReview>(`/incidents/${id}/verify/`, {
      comment: comment ?? "",
    }),

  reject: (id: number, comment: string) =>
    apiClient.post<AdminIncidentReview>(`/incidents/${id}/reject/`, { comment }),

  approveChanges: (id: number, comment = "") =>
    apiClient.post<AdminIncidentReview>(`/incidents/${id}/approve-changes/`, { comment }),

  rejectChanges: (id: number, comment: string) =>
    apiClient.post<AdminIncidentReview>(`/incidents/${id}/reject-changes/`, { comment }),

  assign: (
    id: number,
    payload: { assigned_official: number; priority?: string },
  ) => apiClient.post<AdminIncidentReview>(`/incidents/${id}/assign/`, payload),

  close: (id: number) =>
    apiClient.post<AdminIncidentReview>(`/incidents/${id}/close/`, { comment: "" }),
};

export type { IncidentDetail };

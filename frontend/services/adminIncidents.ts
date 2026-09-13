import { apiClient } from "@/lib/api";
import type {
  AdminIncidentReview,
  AdminReviewStats,
  IncidentDetail,
  PaginatedResponse,
} from "@/types";

export const adminIncidentService = {
  getReviewStats: () =>
    apiClient.get<AdminReviewStats>("/incidents/review-stats/"),

  listPendingReview: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/pending-review/"),

  listPendingChanges: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/pending-changes/"),

  listForwarded: () =>
    apiClient.get<PaginatedResponse<AdminIncidentReview>>("/incidents/forwarded-reports/"),

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
};

export type { IncidentDetail };

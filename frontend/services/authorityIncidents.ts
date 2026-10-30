import { apiClient } from "@/lib/api";
import type {
  IncidentDetail,
  OfficialIncident,
  PaginatedResponse,
} from "@/types";

export const officialIncidentService = {
  listActiveAssignments: () =>
    apiClient.get<PaginatedResponse<OfficialIncident>>("/incidents/assigned/"),

  listCompleted: () =>
    apiClient.get<PaginatedResponse<OfficialIncident>>("/incidents/completed/"),

  getById: (id: number) => apiClient.get<OfficialIncident>(`/incidents/${id}/`),

  startProgress: (id: number, comment?: string) =>
    apiClient.post<OfficialIncident>(`/incidents/${id}/start-progress/`, {
      comment: comment ?? "",
    }),

  resolve: (id: number, comment = "") =>
    apiClient.post<OfficialIncident>(`/incidents/${id}/resolve/`, { comment }),
};

export type { IncidentDetail };

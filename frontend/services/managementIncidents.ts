import { apiClient } from "@/lib/api";
import type {
  DeanIncident,
  IncidentAssignPayload,
  IncidentPriority,
  ManagementOverview,
  PaginatedResponse,
  ResponsibleParty,
} from "@/types";

export const deanIncidentService = {
  getManagementOverview: () =>
    apiClient.get<ManagementOverview>("/incidents/management-overview/"),

  listAwaitingAction: () =>
    apiClient.get<PaginatedResponse<DeanIncident>>("/incidents/awaiting-action/"),

  listCurrentlyUnderway: () =>
    apiClient.get<PaginatedResponse<DeanIncident>>("/incidents/currently-underway/"),

  listCompleted: () =>
    apiClient.get<PaginatedResponse<DeanIncident>>("/incidents/dean-completed/"),

  getById: (id: number) => apiClient.get<DeanIncident>(`/incidents/${id}/`),

  assign: (id: number, payload: IncidentAssignPayload) =>
    apiClient.post<DeanIncident>(`/incidents/${id}/assign/`, payload),

  setPriority: (id: number, priority: IncidentPriority) =>
    apiClient.patch<DeanIncident>(`/incidents/${id}/`, { priority }),

  close: (id: number, comment?: string) =>
    apiClient.post<DeanIncident>(`/incidents/${id}/close/`, { comment: comment ?? "" }),

  reopen: (id: number, comment?: string) =>
    apiClient.post<DeanIncident>(`/incidents/${id}/reopen/`, { comment: comment ?? "" }),
};

export const responsiblePartyService = {
  list: () => apiClient.get<ResponsibleParty[]>("/responsible-parties/"),
};

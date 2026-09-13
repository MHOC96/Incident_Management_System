import { apiClient } from "@/lib/api";
import type {
  Category,
  IncidentCreatePayload,
  IncidentDetail,
  IncidentImage,
  IncidentVoteResult,
  IncidentUpdatePayload,
  Location,
  PaginatedResponse,
  PublicIncident,
  StudentIncident,
} from "@/types";

export type PublicIncidentQuery = {
  q?: string;
  category?: string;
  location?: string;
  stage?: "" | "forwarded" | "in_progress" | "completed";
  ordering?: "recent" | "highest_votes";
};

function buildPublicQuery(params: PublicIncidentQuery = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export const incidentService = {
  listPublic: (params?: PublicIncidentQuery) =>
    apiClient.get<PaginatedResponse<PublicIncident>>(
      `/incidents/public/${buildPublicQuery(params)}`,
    ),

  getPublic: (id: number) =>
    apiClient.get<PublicIncident>(`/incidents/${id}/public/`),

  toggleVote: (id: number) =>
    apiClient.post<IncidentVoteResult>(`/incidents/${id}/vote/`),

  listMine: () => apiClient.get<PaginatedResponse<IncidentDetail>>("/incidents/"),

  getById: (id: number) => apiClient.get<StudentIncident>(`/incidents/${id}/`),

  submitChanges: (id: number, payload: IncidentUpdatePayload) =>
    apiClient.post<StudentIncident>(`/incidents/${id}/submit-changes/`, payload),

  delete: (id: number) => apiClient.delete<Record<string, never>>(`/incidents/${id}/`),

  create: (payload: IncidentCreatePayload) =>
    apiClient.post<IncidentDetail>("/incidents/", payload),

  uploadImage: (incidentId: number, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiClient.postFormData<IncidentImage>(
      `/incidents/${incidentId}/images/`,
      formData,
    );
  },
};

export const referenceService = {
  listCategories: () =>
    apiClient.get<Category[]>("/categories/", { auth: false }),

  listLocations: () =>
    apiClient.get<Location[]>("/locations/", { auth: false }),
};

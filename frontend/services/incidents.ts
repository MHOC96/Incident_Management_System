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
  page?: string;
  page_size?: string;
  q?: string;
  category?: string;
  location?: string;
  stage?: "" | "forwarded" | "in_progress" | "completed";
  ordering?: "recent" | "highest_votes";
};

export type PublicRegisterResponse = PaginatedResponse<PublicIncident> & {
  categories: Category[];
  locations: Location[];
};

const publicRegisterInflight = new Map<string, Promise<PublicRegisterResponse>>();

function buildPublicQuery(params: PublicIncidentQuery = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

export const incidentService = {
  listPublic: (params?: PublicIncidentQuery, signal?: AbortSignal) =>
    apiClient.get<PaginatedResponse<PublicIncident>>(
      `/incidents/public/${buildPublicQuery(params)}`,
      { signal, auth: false },
    ),

  /** Filter dropdowns + first page of results in one request (public register page). */
  listPublicRegister: (params?: PublicIncidentQuery, signal?: AbortSignal) => {
    const query = buildPublicQuery(params);
    const existing = publicRegisterInflight.get(query);
    if (existing) {
      return existing;
    }
    const promise = apiClient.get<PublicRegisterResponse>(
      `/incidents/public-register/${query}`,
      { signal, auth: false },
    );
    publicRegisterInflight.set(query, promise);
    void promise.finally(() => {
      publicRegisterInflight.delete(query);
    });
    return promise;
  },

  getPublic: (id: number) =>
    apiClient.get<PublicIncident>(`/incidents/${id}/public/`, { auth: false }),

  toggleVote: (id: number, upvoted: boolean) =>
    apiClient.post<IncidentVoteResult>(`/incidents/${id}/vote/`, { upvoted }),

  listMine: () => apiClient.get<PaginatedResponse<IncidentDetail>>("/incidents/"),

  getById: (id: number) => apiClient.get<StudentIncident>(`/incidents/${id}/`),

  submitChanges: (id: number, payload: IncidentUpdatePayload) =>
    apiClient.post<StudentIncident>(`/incidents/${id}/submit-changes/`, payload),

  delete: (id: number) => apiClient.delete<Record<string, never>>(`/incidents/${id}/`),

  create: (payload: IncidentCreatePayload) =>
    apiClient.post<IncidentDetail>("/incidents/", payload),

  uploadEvidence: (incidentId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postFormData<IncidentImage>(
      `/incidents/${incidentId}/images/`,
      formData,
    );
  },
};

/** @deprecated Use incidentService.uploadEvidence */
export function uploadIncidentImage(incidentId: number, file: File) {
  return incidentService.uploadEvidence(incidentId, file);
}

export const referenceService = {
  listCategories: (signal?: AbortSignal) =>
    apiClient.get<Category[]>("/categories/", { auth: false, signal }),

  listLocations: () =>
    apiClient.get<Location[]>("/locations/", { auth: false }),
};

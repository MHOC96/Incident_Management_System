import type { UserRole } from "@/types";

export function getIncidentDetailRoute(role: UserRole, incidentId: number): string {
  const routes: Record<UserRole, string> = {
    STUDENT: `/student/incidents/${incidentId}`,
    ADMIN: `/admin/incidents/${incidentId}`,
    LECTURER: `/student/incidents/${incidentId}`,
    AUTHORITY: `/authority/incidents/${incidentId}`,
    MANAGEMENT: `/management/incidents/${incidentId}`,
    SYSADMIN: `/admin/incidents/${incidentId}`,
  };
  return routes[role];
}

export function formatRoleLabel(role: string): string {
  return role.replaceAll("_", " ");
}

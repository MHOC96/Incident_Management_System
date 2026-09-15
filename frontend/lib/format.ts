import type {
  AccountStatus,
  IncidentPriority,
  IncidentStatus,
  IncidentVisibility,
  OfficialPosition,
  UserRole,
} from "@/types";

const statusLabels: Record<IncidentStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  FORWARDED_TO_DEAN: "Forwarded to Dean",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusStyles: Record<IncidentStatus, string> = {
  SUBMITTED: "text-text-secondary border-border",
  UNDER_REVIEW: "text-warning border-warning/30",
  VERIFIED: "text-success border-success/30",
  REJECTED: "text-danger border-danger/30",
  FORWARDED_TO_DEAN: "text-info border-info/30",
  ASSIGNED: "text-info border-info/30",
  IN_PROGRESS: "text-info border-info/30",
  RESOLVED: "text-success border-success/30",
  CLOSED: "text-success border-success/30",
};

export function getStatusLabel(status: IncidentStatus): string {
  return statusLabels[status];
}

export function getStatusClassName(status: IncidentStatus): string {
  return statusStyles[status];
}

const COLOMBO_TIME_ZONE = "Asia/Colombo";

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/** Date and time in Sri Lanka (Colombo) for timelines and operational timestamps. */
export function formatDateTimeColombo(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: COLOMBO_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

/** Place name only — never prefixes faculty (e.g. "Readima", not "Faculty … · Readima"). */
export function formatLocationPlace(location: {
  name: string;
  building: string;
  faculty?: string;
}): string {
  let place = (location.name || location.building || "").trim();
  if (!place) {
    return (location.faculty || "").trim();
  }

  const faculty = (location.faculty || "").trim();
  if (faculty) {
    const prefix = `${faculty} · `;
    if (place.toLowerCase().startsWith(prefix.toLowerCase())) {
      place = place.slice(prefix.length).trim();
    }
  }

  const separator = " · ";
  if (place.includes(separator)) {
    const parts = place.split(separator).map((part) => part.trim());
    const first = parts[0] ?? "";
    if (parts.length >= 2 && /faculty|commerce|management studies/i.test(first)) {
      return parts[parts.length - 1] ?? place;
    }
  }

  return place;
}

/** @deprecated Use formatLocationPlace — kept for existing imports. */
export function formatLocationLabel(location: {
  faculty: string;
  name: string;
  building: string;
}): string {
  return formatLocationPlace(location);
}

const priorityLabels: Record<IncidentPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const priorityStyles: Record<IncidentPriority, string> = {
  LOW: "text-text-secondary border-border",
  MEDIUM: "text-warning border-warning/30",
  HIGH: "text-info border-info/30",
  CRITICAL: "text-danger border-danger/30",
};

export function getPriorityLabel(priority: IncidentPriority): string {
  return priorityLabels[priority];
}

export function getPriorityClassName(priority: IncidentPriority): string {
  return priorityStyles[priority];
}

const visibilityLabels: Record<IncidentVisibility, string> = {
  PUBLIC: "Public",
  PRIVATE: "Private",
  RESTRICTED: "Restricted",
};

export function getVisibilityLabel(visibility: IncidentVisibility): string {
  return visibilityLabels[visibility];
}

const positionLabels: Record<OfficialPosition, string> = {
  VICE_CHANCELLOR: "Vice Chancellor",
  HOD: "Head of Department",
  MAINTENANCE_OFFICER: "Maintenance Officer",
  SECURITY_OFFICER: "Security Officer",
  OTHER: "Other",
};

export function getPositionLabel(position: OfficialPosition): string {
  return positionLabels[position];
}

const accountStatusLabels: Record<AccountStatus, string> = {
  INVITED: "Invited",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

const accountStatusStyles: Record<AccountStatus, string> = {
  INVITED: "text-warning border-warning/30",
  ACTIVE: "text-success border-success/30",
  INACTIVE: "text-text-secondary border-border",
  SUSPENDED: "text-danger border-danger/30",
};

export function getAccountStatusLabel(status: AccountStatus): string {
  return accountStatusLabels[status];
}

export function getAccountStatusClassName(status: AccountStatus): string {
  return accountStatusStyles[status];
}

const dashboardLabels: Record<UserRole, string> = {
  STUDENT: "My reports",
  ADMIN: "Review queue",
  DEAN: "Faculty management",
  OFFICIAL: "Assigned work",
};

export function getDashboardLabel(role: UserRole): string {
  return dashboardLabels[role];
}

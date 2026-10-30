export type UserRole =
  | "STUDENT"
  | "LECTURER"
  | "ADMIN"
  | "AUTHORITY"
  | "MANAGEMENT"
  | "SYSADMIN";

export type CaseType = "COMPLAINT" | "SUGGESTION";

export type ReporterPriority = "URGENT" | "NORMAL";

export type OfficialPosition =
  | "VICE_CHANCELLOR"
  | "HOD"
  | "MAINTENANCE_OFFICER"
  | "SECURITY_OFFICER"
  | "OTHER";

export type AccountStatus = "INVITED" | "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type IncidentStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NOT_STARTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "WAITING_FOR_INFORMATION"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED"
  | "REOPENED";

export type IncidentVisibility = "PUBLIC" | "PRIVATE" | "RESTRICTED";

export type IncidentPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  mc_number: string;
  role: UserRole;
  position: OfficialPosition | null;
  status: AccountStatus;
  created_at: string;
};

export type LoginPayload = {
  email?: string;
  mc_number?: string;
  password: string;
};

export type PasswordChangePayload = {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type ApiError = {
  detail?: string;
  [key: string]: unknown;
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
};

export type Location = {
  id: number;
  name: string;
  building: string;
  floor: string;
  faculty: string;
  is_active: boolean;
};

export type IncidentMediaType = "IMAGE" | "VIDEO";

export type IncidentImage = {
  id: number;
  media_type?: IncidentMediaType;
  cloudinary_url: string;
  original_filename: string;
  uploaded_at: string;
};

export type PublicIncident = {
  id: number;
  incident_number: string;
  title: string;
  description: string;
  case_type: CaseType;
  reporter_priority: ReporterPriority;
  category: Category;
  location: Location;
  status: IncidentStatus;
  priority: IncidentPriority | null;
  visibility: IncidentVisibility;
  images: IncidentImage[];
  vote_count: number;
  user_has_upvoted: boolean;
  created_at: string;
  updated_at: string;
  verified_at?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
};

export type IncidentVoteResult = {
  vote_count: number;
  user_has_upvoted: boolean;
};

export type IncidentDetail = PublicIncident & {
  reporter: number;
  reporter_name: string;
  admin_review_note: string;
  progress_note: string;
  resolution_statement: string;
  closure_note: string;
  reopen_reason: string;
};

export type IncidentRevisionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type IncidentRevisionChange = {
  field: "title" | "description" | "category" | "location" | "visibility";
  label: string;
  before: string;
  after: string;
};

export type IncidentRevision = {
  id: number;
  status: IncidentRevisionStatus;
  changes: IncidentRevisionChange[];
  submitted_by_name: string;
  submitted_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comment: string;
};

export type ReporterAdmin = {
  id: number;
  name: string;
  email: string;
  phone: string;
  mc_number: string;
};

export type AdminIncidentReview = Omit<IncidentDetail, "reporter" | "reporter_name"> & {
  reporter: ReporterAdmin;
  pending_revision: IncidentRevision | null;
  revision_history: IncidentRevision[];
  current_assignment?: Assignment | null;
};

export type Assignment = {
  id: number;
  incident: number;
  assigned_official: number;
  assigned_official_name: string;
  assigned_official_position: OfficialPosition | "" | null;
  assigned_by: number;
  assigned_by_name: string;
  responsible_party: number | null;
  comment: string;
  is_current: boolean;
  assigned_at: string;
};

export type ResponsibleParty = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  officials: number[];
};

export type DeanIncident = AdminIncidentReview & {
  current_assignment: Assignment | null;
};

export type ManagementOverviewCategory = {
  name: string;
  count: number;
};

export type ManagementOverviewAuthority = {
  id: number;
  name: string;
  position: string;
  assigned_total: number;
  in_progress: number;
  not_started: number;
  average_age_days: number;
};

export type ManagementOverview = {
  complaints: number;
  suggestions: number;
  priority_high: number;
  priority_standard: number;
  resolution_rate: number;
  average_resolution_days: number;
  top_categories: ManagementOverviewCategory[];
  authorities: ManagementOverviewAuthority[];
};

export type OfficialAccount = {
  id: number;
  name: string;
  email: string;
  phone: string;
  position: OfficialPosition;
  status: AccountStatus;
  created_at: string;
};

export type OfficialCreatePayload = {
  name: string;
  email: string;
  phone?: string;
  position: OfficialPosition;
};

export type IncidentAssignPayload = {
  assigned_official: number;
  responsible_party?: number | null;
  comment?: string;
  priority?: IncidentPriority | null;
};

export type OfficialIncident = IncidentDetail & {
  current_assignment: Assignment | null;
};

export type NotificationType =
  | "INCIDENT_SUBMITTED"
  | "INCIDENT_VERIFIED"
  | "INCIDENT_REJECTED"
  | "INCIDENT_ASSIGNED"
  | "INCIDENT_STATUS_CHANGED"
  | "INCIDENT_RESOLVED"
  | "INCIDENT_CLOSED";

export type Notification = {
  id: number;
  title: string;
  message: string;
  notification_type: NotificationType;
  related_incident: number | null;
  is_read: boolean;
  created_at: string;
};

export type StudentIncident = IncidentDetail & {
  current_assignment: Assignment | null;
  has_pending_changes: boolean;
  revision_history: IncidentRevision[];
};

export type IncidentCreatePayload = {
  title: string;
  description: string;
  category: number;
  location_name: string;
  case_type: CaseType;
  reporter_priority: ReporterPriority;
  visibility: IncidentVisibility;
};

export type IncidentUpdatePayload = IncidentCreatePayload;

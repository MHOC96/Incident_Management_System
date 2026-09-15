export type UserRole = "STUDENT" | "ADMIN" | "DEAN" | "OFFICIAL";

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
  | "VERIFIED"
  | "REJECTED"
  | "FORWARDED_TO_DEAN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

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

export type IncidentImage = {
  id: number;
  cloudinary_url: string;
  original_filename: string;
  uploaded_at: string;
};

export type PublicIncident = {
  id: number;
  incident_number: string;
  title: string;
  description: string;
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
};

export type AdminReviewStats = {
  pending_verification: number;
  verified: number;
  forwarded_to_dean: number;
  rejected: number;
  pending_changes: number;
};

export type Assignment = {
  id: number;
  incident: number;
  assigned_official: number;
  assigned_official_name: string;
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

export type DeanStats = {
  total_incidents: number;
  awaiting_action: number;
  assigned: number;
  in_progress: number;
  resolved_awaiting_closure: number;
  closed: number;
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

export type OfficialStats = {
  assigned: number;
  in_progress: number;
  resolved: number;
  total_assigned: number;
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
  visibility: IncidentVisibility;
};

export type IncidentUpdatePayload = IncidentCreatePayload;

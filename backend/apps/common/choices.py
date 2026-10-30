from django.db import models


class UserRole(models.TextChoices):
    STUDENT = "STUDENT", "Student"
    LECTURER = "LECTURER", "Lecturer"
    ADMIN = "ADMIN", "Administrator"
    AUTHORITY = "AUTHORITY", "Relevant Authority"
    MANAGEMENT = "MANAGEMENT", "Faculty Management"
    SYSADMIN = "SYSADMIN", "System Administrator"


class OfficialPosition(models.TextChoices):
    VICE_CHANCELLOR = "VICE_CHANCELLOR", "Vice Chancellor"
    HOD = "HOD", "Head of Department"
    MAINTENANCE_OFFICER = "MAINTENANCE_OFFICER", "Maintenance Officer"
    SECURITY_OFFICER = "SECURITY_OFFICER", "Security Officer"
    OTHER = "OTHER", "Other"


class AccountStatus(models.TextChoices):
    INVITED = "INVITED", "Invited"
    ACTIVE = "ACTIVE", "Active"
    INACTIVE = "INACTIVE", "Inactive"
    SUSPENDED = "SUSPENDED", "Suspended"


class CaseType(models.TextChoices):
    COMPLAINT = "COMPLAINT", "Complaint"
    SUGGESTION = "SUGGESTION", "Suggestion"


class ReporterPriority(models.TextChoices):
    URGENT = "URGENT", "Urgent"
    NORMAL = "NORMAL", "Normal"


class IncidentMediaType(models.TextChoices):
    IMAGE = "IMAGE", "Image"
    VIDEO = "VIDEO", "Video"


class IncidentStatus(models.TextChoices):
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    NOT_STARTED = "NOT_STARTED", "Not Started"
    ASSIGNED = "ASSIGNED", "Assigned"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    WAITING_FOR_INFORMATION = "WAITING_FOR_INFORMATION", "Waiting for Information"
    RESOLVED = "RESOLVED", "Solved"
    CLOSED = "CLOSED", "Closed"
    REJECTED = "REJECTED", "Rejected"
    REOPENED = "REOPENED", "Reopened"


class IncidentVisibility(models.TextChoices):
    PUBLIC = "PUBLIC", "Public"
    PRIVATE = "PRIVATE", "Private"
    RESTRICTED = "RESTRICTED", "Restricted"


class IncidentPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class NotificationType(models.TextChoices):
    INCIDENT_SUBMITTED = "INCIDENT_SUBMITTED", "Incident Submitted"
    INCIDENT_VERIFIED = "INCIDENT_VERIFIED", "Incident Verified"
    INCIDENT_REJECTED = "INCIDENT_REJECTED", "Incident Rejected"
    INCIDENT_ASSIGNED = "INCIDENT_ASSIGNED", "Incident Assigned"
    INCIDENT_STATUS_CHANGED = "INCIDENT_STATUS_CHANGED", "Incident Status Changed"
    INCIDENT_RESOLVED = "INCIDENT_RESOLVED", "Incident Resolved"
    INCIDENT_CLOSED = "INCIDENT_CLOSED", "Incident Closed"

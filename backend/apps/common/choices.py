from django.db import models


class UserRole(models.TextChoices):
    STUDENT = "STUDENT", "Student"
    ADMIN = "ADMIN", "Admin"
    DEAN = "DEAN", "Dean"
    OFFICIAL = "OFFICIAL", "Official"


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


class IncidentStatus(models.TextChoices):
    SUBMITTED = "SUBMITTED", "Submitted"
    UNDER_REVIEW = "UNDER_REVIEW", "Under Review"
    VERIFIED = "VERIFIED", "Verified"
    REJECTED = "REJECTED", "Rejected"
    FORWARDED_TO_DEAN = "FORWARDED_TO_DEAN", "Forwarded to Dean"
    ASSIGNED = "ASSIGNED", "Assigned"
    IN_PROGRESS = "IN_PROGRESS", "In Progress"
    RESOLVED = "RESOLVED", "Resolved"
    CLOSED = "CLOSED", "Closed"


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

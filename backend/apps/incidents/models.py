from django.conf import settings
from django.db import models

from apps.common.choices import (
    IncidentPriority,
    IncidentStatus,
    IncidentVisibility,
)


class IncidentRevisionStatus(models.TextChoices):
    PENDING = "PENDING", "Pending review"
    APPROVED = "APPROVED", "Approved"
    REJECTED = "REJECTED", "Rejected"


class IncidentNumberSequence(models.Model):
    year = models.PositiveIntegerField(primary_key=True)
    value = models.PositiveIntegerField(default=0)


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Location(models.Model):
    name = models.CharField(max_length=255)
    building = models.CharField(max_length=255, blank=True)
    floor = models.CharField(max_length=50, blank=True)
    faculty = models.CharField(max_length=255, blank=True, default="Faculty of Management Studies and Commerce")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        parts = [self.name]
        if self.building:
            parts.append(self.building)
        return " · ".join(parts)


class Incident(models.Model):
    incident_number = models.CharField(max_length=20, unique=True, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="incidents",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="incidents",
    )
    visibility = models.CharField(
        max_length=20,
        choices=IncidentVisibility.choices,
        default=IncidentVisibility.PRIVATE,
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_incidents",
    )
    status = models.CharField(
        max_length=30,
        choices=IncidentStatus.choices,
        default=IncidentStatus.SUBMITTED,
    )
    priority = models.CharField(
        max_length=20,
        choices=IncidentPriority.choices,
        blank=True,
        null=True,
    )
    verified_at = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)
    admin_review_note = models.TextField(blank=True)
    progress_note = models.TextField(blank=True)
    resolution_statement = models.TextField(blank=True)
    closure_note = models.TextField(blank=True)
    reopen_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["incident_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["visibility"]),
            models.Index(fields=["category"]),
            models.Index(fields=["location"]),
            models.Index(fields=["reporter"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["priority"]),
        ]

    def __str__(self):
        return f"{self.incident_number} — {self.title}"


class IncidentRevision(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_incident_revisions",
    )
    status = models.CharField(
        max_length=20,
        choices=IncidentRevisionStatus.choices,
        default=IncidentRevisionStatus.PENDING,
    )
    original_title = models.CharField(max_length=255)
    proposed_title = models.CharField(max_length=255)
    original_description = models.TextField()
    proposed_description = models.TextField()
    original_category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="original_incident_revisions"
    )
    proposed_category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="proposed_incident_revisions"
    )
    original_location = models.ForeignKey(
        Location, on_delete=models.PROTECT, related_name="original_incident_revisions"
    )
    proposed_location = models.ForeignKey(
        Location, on_delete=models.PROTECT, related_name="proposed_incident_revisions"
    )
    original_visibility = models.CharField(max_length=20, choices=IncidentVisibility.choices)
    proposed_visibility = models.CharField(max_length=20, choices=IncidentVisibility.choices)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_incident_revisions",
    )
    review_comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-submitted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["incident"],
                condition=models.Q(status=IncidentRevisionStatus.PENDING),
                name="one_pending_revision_per_incident",
            )
        ]
        indexes = [
            models.Index(fields=["status", "submitted_at"]),
            models.Index(fields=["incident", "status"]),
        ]

    def __str__(self):
        return f"Revision for {self.incident.incident_number} ({self.status})"


class IncidentImage(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="images",
    )
    cloudinary_public_id = models.CharField(max_length=255)
    cloudinary_url = models.URLField(max_length=500)
    original_filename = models.CharField(max_length=255, blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="uploaded_incident_images",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Image for {self.incident.incident_number}"


class IncidentVote(models.Model):
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incident_votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["incident", "user"],
                name="unique_incident_vote_per_user",
            ),
        ]
        indexes = [
            models.Index(
                fields=["incident", "created_at"],
                name="inc_vote_incident_created_idx",
            ),
        ]

    def __str__(self):
        return f"Vote for {self.incident.incident_number}"

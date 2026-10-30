from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.assignments.models import Assignment
from apps.common.choices import AccountStatus, IncidentStatus, NotificationType, UserRole
from apps.incidents.models import Incident
from apps.incidents.services import (
    InvalidStatusTransitionError,
    authority_resolve_incident,
    authority_start_progress,
    transition_incident,
)
from apps.notifications.models import Notification

User = get_user_model()


@transaction.atomic
def assign_incident(
    incident,
    *,
    assigned_official,
    assigned_by,
    responsible_party=None,
    comment="",
    priority=None,
):
    locked = Incident.objects.select_for_update().get(pk=incident.pk)
    incident.status = locked.status
    if assigned_official.role != UserRole.AUTHORITY:
        raise ValueError("Assigned user must be a relevant authority.")
    if assigned_official.status != AccountStatus.ACTIVE:
        raise ValueError("Assigned authority must have an active account.")

    incident.assignments.filter(is_current=True).update(is_current=False)

    assignment = Assignment.objects.create(
        incident=incident,
        assigned_official=assigned_official,
        assigned_by=assigned_by,
        responsible_party=responsible_party,
        comment=comment.strip(),
        is_current=True,
    )

    if priority:
        incident.priority = priority
        incident.save(update_fields=["priority", "updated_at"])

    if incident.status in {
        IncidentStatus.NOT_STARTED,
        IncidentStatus.REOPENED,
    }:
        transition_incident(incident, IncidentStatus.ASSIGNED)
    elif incident.status not in {
        IncidentStatus.ASSIGNED,
        IncidentStatus.IN_PROGRESS,
    }:
        raise InvalidStatusTransitionError(incident.status, IncidentStatus.ASSIGNED)

    Notification.objects.create(
        user=assigned_official,
        title="Case assigned",
        message=f"You have been assigned case {incident.incident_number}.",
        notification_type=NotificationType.INCIDENT_ASSIGNED,
        related_incident=incident,
    )

    Notification.objects.create(
        user=incident.reporter,
        title="Case assigned",
        message=f"Your case {incident.incident_number} has been assigned for action.",
        notification_type=NotificationType.INCIDENT_ASSIGNED,
        related_incident=incident,
    )

    return assignment


@transaction.atomic
def close_incident(incident, *, closed_by, comment=""):
    transition_incident(incident, IncidentStatus.CLOSED, closed_at=timezone.now())

    Notification.objects.create(
        user=incident.reporter,
        title="Case closed",
        message=f"Your case {incident.incident_number} has been closed.",
        notification_type=NotificationType.INCIDENT_CLOSED,
        related_incident=incident,
    )

    return incident


def start_incident_progress(incident):
    authority_start_progress(incident)

    Notification.objects.create(
        user=incident.reporter,
        title="Work started",
        message=f"Work has started on case {incident.incident_number}.",
        notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
        related_incident=incident,
    )

    return incident


def resolve_assigned_incident(incident):
    authority_resolve_incident(incident, resolved_at=timezone.now())

    Notification.objects.create(
        user=incident.reporter,
        title="Case solved",
        message=f"Your case {incident.incident_number} has been marked as solved.",
        notification_type=NotificationType.INCIDENT_RESOLVED,
        related_incident=incident,
    )

    Notification.objects.bulk_create(
        [
            Notification(
                user=staff,
                title="Case ready for closure",
                message=f"Case {incident.incident_number} has been solved and awaits administrator closure.",
                notification_type=NotificationType.INCIDENT_RESOLVED,
                related_incident=incident,
            )
            for staff in User.objects.filter(
                role__in={UserRole.ADMIN, UserRole.MANAGEMENT},
                status=AccountStatus.ACTIVE,
            )
        ]
    )

    return incident


def official_start_progress(incident):
    return start_incident_progress(incident)


def official_resolve_incident(incident, *, resolved_at):
    return authority_resolve_incident(incident, resolved_at=resolved_at)

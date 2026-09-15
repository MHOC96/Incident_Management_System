from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.assignments.models import Assignment
from apps.incidents.models import Incident
from apps.common.choices import AccountStatus, IncidentStatus, NotificationType, UserRole
from apps.incidents.services import (
    InvalidStatusTransitionError,
    official_resolve_incident,
    official_start_progress,
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
    # Serialize assignment changes even when this service is called outside the API.
    locked = Incident.objects.select_for_update().get(pk=incident.pk)
    incident.status = locked.status
    if assigned_official.role != UserRole.OFFICIAL:
        raise ValueError("Assigned user must be an official.")
    if assigned_official.status != AccountStatus.ACTIVE:
        raise ValueError("Assigned official must have an active account.")

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

    if incident.status == IncidentStatus.FORWARDED_TO_DEAN:
        transition_incident(incident, IncidentStatus.ASSIGNED)
    elif incident.status not in {
        IncidentStatus.ASSIGNED,
        IncidentStatus.IN_PROGRESS,
    }:
        raise InvalidStatusTransitionError(incident.status, IncidentStatus.ASSIGNED)

    Notification.objects.create(
        user=assigned_official,
        title="Incident assigned",
        message=f"You have been assigned incident {incident.incident_number}.",
        notification_type=NotificationType.INCIDENT_ASSIGNED,
        related_incident=incident,
    )

    Notification.objects.create(
        user=incident.reporter,
        title="Incident assigned",
        message=f"Your incident {incident.incident_number} has been assigned for resolution.",
        notification_type=NotificationType.INCIDENT_ASSIGNED,
        related_incident=incident,
    )

    return assignment


@transaction.atomic
def close_incident(incident, *, closed_by, comment=""):
    transition_incident(incident, IncidentStatus.CLOSED, closed_at=timezone.now())

    Notification.objects.create(
        user=incident.reporter,
        title="Incident closed",
        message=f"Your incident {incident.incident_number} has been closed.",
        notification_type=NotificationType.INCIDENT_CLOSED,
        related_incident=incident,
    )

    return incident


def start_incident_progress(incident):
    official_start_progress(incident)

    Notification.objects.create(
        user=incident.reporter,
        title="Work started",
        message=f"Work has started on incident {incident.incident_number}.",
        notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
        related_incident=incident,
    )

    return incident


def resolve_assigned_incident(incident):
    official_resolve_incident(incident, resolved_at=timezone.now())

    Notification.objects.create(
        user=incident.reporter,
        title="Incident resolved",
        message=f"Your incident {incident.incident_number} has been marked as resolved.",
        notification_type=NotificationType.INCIDENT_RESOLVED,
        related_incident=incident,
    )

    Notification.objects.bulk_create(
        [
            Notification(
                user=dean,
                title="Incident ready for closure",
                message=(
                    f"Incident {incident.incident_number} has been resolved and awaits dean review."
                ),
                notification_type=NotificationType.INCIDENT_RESOLVED,
                related_incident=incident,
            )
            for dean in User.objects.filter(
                role=UserRole.DEAN, status=AccountStatus.ACTIVE
            )
        ]
    )

    return incident

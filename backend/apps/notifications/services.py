from django.contrib.auth import get_user_model

from apps.common.choices import AccountStatus, NotificationType, UserRole
from apps.notifications.models import Notification

User = get_user_model()


def notify_user(*, user, title, message, notification_type, related_incident=None):
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type,
        related_incident=related_incident,
    )


def notify_admins_of_submission(incident):
    admins = User.objects.filter(role=UserRole.ADMIN, status=AccountStatus.ACTIVE)
    Notification.objects.bulk_create(
        [
            Notification(
                user=admin,
                title="New incident submitted",
                message=f"{incident.incident_number}: {incident.title}",
                notification_type=NotificationType.INCIDENT_SUBMITTED,
                related_incident=incident,
            )
            for admin in admins
        ]
    )


def notify_admins_of_revision(incident):
    recipients = User.objects.filter(role=UserRole.ADMIN, status=AccountStatus.ACTIVE)
    Notification.objects.bulk_create(
        [
            Notification(
                user=recipient,
                title="Incident changes need review",
                message=f"{incident.incident_number}: {incident.title}",
                notification_type=NotificationType.INCIDENT_SUBMITTED,
                related_incident=incident,
            )
            for recipient in recipients
        ]
    )

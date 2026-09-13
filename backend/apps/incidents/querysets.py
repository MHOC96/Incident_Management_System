from django.db.models import BooleanField, Count, Exists, OuterRef, Prefetch, Value

from apps.assignments.models import Assignment
from apps.common.choices import IncidentStatus, IncidentVisibility, UserRole
from apps.incidents.models import Incident, IncidentRevision, IncidentVote

PUBLIC_VISIBLE_STATUSES = (
    IncidentStatus.VERIFIED,
    IncidentStatus.FORWARDED_TO_DEAN,
    IncidentStatus.ASSIGNED,
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.RESOLVED,
    IncidentStatus.CLOSED,
)

CURRENT_ASSIGNMENT_PREFETCH = Prefetch(
    "assignments",
    queryset=Assignment.objects.filter(is_current=True).select_related(
        "assigned_official",
        "assigned_by",
        "responsible_party",
    ),
    to_attr="prefetched_current_assignments",
)

REVISION_PREFETCH = Prefetch(
    "revisions",
    queryset=IncidentRevision.objects.select_related(
        "submitted_by",
        "reviewed_by",
        "original_category",
        "proposed_category",
        "original_location",
        "proposed_location",
    ),
)


def optimized_incident_queryset():
    return Incident.objects.select_related(
        "category",
        "location",
        "reporter",
    ).prefetch_related(
        "images",
        CURRENT_ASSIGNMENT_PREFETCH,
        REVISION_PREFETCH,
    )


def public_incident_queryset(user=None):
    queryset = Incident.objects.filter(
        visibility=IncidentVisibility.PUBLIC,
        status__in=PUBLIC_VISIBLE_STATUSES,
    ).select_related("category", "location").prefetch_related("images").annotate(
        vote_count=Count("votes", distinct=True),
    )
    if user and user.is_authenticated and user.role == UserRole.STUDENT:
        return queryset.annotate(
            user_has_upvoted=Exists(
                IncidentVote.objects.filter(incident=OuterRef("pk"), user=user),
            ),
        )
    return queryset.annotate(
        user_has_upvoted=Value(False, output_field=BooleanField()),
    )

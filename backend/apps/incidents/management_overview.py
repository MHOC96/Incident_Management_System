from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Q
from django.db.models.functions import Coalesce, Now

from apps.assignments.models import Assignment
from apps.common.choices import (
    AccountStatus,
    CaseType,
    IncidentPriority,
    IncidentStatus,
    UserRole,
)
from apps.incidents.models import Category, Incident

User = get_user_model()

OPEN_AUTHORITY_STATUSES = {
    IncidentStatus.ASSIGNED,
    IncidentStatus.IN_PROGRESS,
    IncidentStatus.RESOLVED,
}

ACCEPTED_EXCLUDE_STATUSES = {
    IncidentStatus.SUBMITTED,
    IncidentStatus.UNDER_REVIEW,
    IncidentStatus.REJECTED,
}


def build_management_overview():
    base = Incident.objects.all()

    summary = base.aggregate(
        complaints=Count("id", filter=Q(case_type=CaseType.COMPLAINT)),
        suggestions=Count("id", filter=Q(case_type=CaseType.SUGGESTION)),
        priority_high=Count(
            "id",
            filter=Q(priority__in={IncidentPriority.HIGH, IncidentPriority.CRITICAL}),
        ),
        priority_standard=Count(
            "id",
            filter=Q(priority__in={IncidentPriority.LOW, IncidentPriority.MEDIUM}),
        ),
        accepted_count=Count("id", filter=~Q(status__in=ACCEPTED_EXCLUDE_STATUSES)),
        closed_count=Count("id", filter=Q(status=IncidentStatus.CLOSED)),
    )

    accepted_count = summary["accepted_count"] or 0
    closed_count = summary["closed_count"] or 0
    resolution_rate = round(100 * closed_count / accepted_count, 1) if accepted_count else 0.0

    resolution_duration = ExpressionWrapper(
        F("closed_at") - Coalesce(F("verified_at"), F("created_at")),
        output_field=DurationField(),
    )
    avg_resolution = (
        base.filter(status=IncidentStatus.CLOSED, closed_at__isnull=False)
        .aggregate(avg=Avg(resolution_duration))
        .get("avg")
    )
    average_resolution_days = (
        round(avg_resolution.total_seconds() / 86400, 1) if avg_resolution else 0.0
    )

    top_categories = list(
        Category.objects.annotate(count=Count("incidents"))
        .filter(count__gt=0)
        .order_by("-count", "name")[:4]
        .values("name", "count")
    )

    assignment_age = ExpressionWrapper(
        Now() - F("assigned_at"),
        output_field=DurationField(),
    )
    authority_rows = (
        Assignment.objects.filter(
            is_current=True,
            incident__status__in=OPEN_AUTHORITY_STATUSES,
            assigned_official__role=UserRole.AUTHORITY,
            assigned_official__status=AccountStatus.ACTIVE,
        )
        .values(
            "assigned_official_id",
            "assigned_official__name",
            "assigned_official__position",
        )
        .annotate(
            assigned_total=Count("id"),
            in_progress=Count("id", filter=Q(incident__status=IncidentStatus.IN_PROGRESS)),
            not_started=Count("id", filter=Q(incident__status=IncidentStatus.ASSIGNED)),
            avg_age=Avg(assignment_age),
        )
        .order_by("-assigned_total", "assigned_official__name")
    )

    authorities = []
    for row in authority_rows:
        avg_age = row["avg_age"]
        average_age_days = round(avg_age.total_seconds() / 86400, 1) if avg_age else 0.0
        authorities.append(
            {
                "id": row["assigned_official_id"],
                "name": row["assigned_official__name"] or "",
                "position": row["assigned_official__position"] or "",
                "assigned_total": row["assigned_total"],
                "in_progress": row["in_progress"],
                "not_started": row["not_started"],
                "average_age_days": average_age_days,
            }
        )

    return {
        "complaints": summary["complaints"],
        "suggestions": summary["suggestions"],
        "priority_high": summary["priority_high"],
        "priority_standard": summary["priority_standard"],
        "resolution_rate": resolution_rate,
        "average_resolution_days": average_resolution_days,
        "top_categories": top_categories,
        "authorities": authorities,
    }

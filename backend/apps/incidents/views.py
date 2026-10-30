from django.db import transaction
from django.db.models import Case, Count, Exists, IntegerField, OuterRef, Q, Value, When
from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle

from apps.assignments.services import (
    assign_incident,
    close_incident,
    resolve_assigned_incident,
    start_incident_progress,
)
from apps.common.authorization import (
    user_can_admin_review_incident,
    user_can_assign_incident,
    user_can_close_incident,
    user_can_modify_incident,
    user_can_reopen_incident,
    user_can_resolve_incident,
    user_can_start_progress_incident,
    user_can_verify_incident,
)
from apps.common.choices import IncidentStatus, NotificationType, UserRole
from apps.common.permissions import (
    IsActiveUser,
    IsAdmin,
    IsAdminOrManagement,
    IsAuthority,
    IsManagement,
    IsReporter,
    IsStaffRole,
)
from apps.incidents.cloudinary_service import upload_incident_media
from apps.incidents.management_overview import build_management_overview
from apps.incidents.models import (
    Category,
    Incident,
    IncidentImage,
    IncidentRevision,
    IncidentRevisionStatus,
    IncidentVote,
    Location,
)
from apps.incidents.permissions import IncidentObjectPermission
from apps.incidents.serializers import (
    CategorySerializer,
    IncidentActionSerializer,
    IncidentAdminReviewSerializer,
    IncidentAssignSerializer,
    IncidentCreateSerializer,
    IncidentDeanDetailSerializer,
    IncidentManagementDetailSerializer,
    IncidentDetailSerializer,
    IncidentImageSerializer,
    IncidentOfficialDetailSerializer,
    IncidentPriorityUpdateSerializer,
    IncidentRejectSerializer,
    IncidentRevisionDecisionSerializer,
    IncidentResolveSerializer,
    IncidentStudentDetailSerializer,
    IncidentStudentUpdateSerializer,
    LocationSerializer,
    PublicIncidentSerializer,
)
from apps.incidents.services import (
    InvalidStatusTransitionError,
    admin_reject_incident,
    admin_verify_and_forward,
    is_valid_status_transition,
    transition_incident,
)
from apps.incidents.querysets import (
    PUBLIC_VISIBLE_STATUSES,
    optimized_incident_queryset,
    public_incident_queryset,
)
from apps.incidents.utils import generate_incident_number
from apps.notifications.models import Notification
from apps.notifications.services import notify_admins_of_revision, notify_admins_of_submission

PENDING_REVIEW_STATUSES = {
    IncidentStatus.SUBMITTED,
    IncidentStatus.UNDER_REVIEW,
}


class IncidentCreateThrottle(UserRateThrottle):
    scope = "incident_create"


def _public_filter_locations_queryset():
    return Location.objects.filter(
        is_active=True,
        incidents__visibility="PUBLIC",
        incidents__status__in=PUBLIC_VISIBLE_STATUSES,
    ).distinct()


def apply_public_list_filters(queryset, request):
    stage = request.query_params.get("stage")
    if stage == "forwarded":
        queryset = queryset.filter(
            status__in=[
                IncidentStatus.NOT_STARTED,
                IncidentStatus.ASSIGNED,
            ],
        )
    elif stage == "in_progress":
        queryset = queryset.filter(status=IncidentStatus.IN_PROGRESS)
    elif stage == "completed":
        queryset = queryset.filter(
            status__in=[IncidentStatus.RESOLVED, IncidentStatus.CLOSED],
        )

    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(
            Q(incident_number__icontains=search)
            | Q(title__icontains=search)
            | Q(category__name__icontains=search)
            | Q(location__name__icontains=search),
        )

    category = request.query_params.get("category")
    if category and category.isdigit():
        queryset = queryset.filter(category_id=int(category))

    location = request.query_params.get("location")
    if location and location.isdigit():
        queryset = queryset.filter(location_id=int(location))

    ordering = request.query_params.get("ordering", "recent")
    if ordering == "highest_votes":
        queryset = queryset.order_by("-vote_count", "-created_at")
    else:
        queryset = queryset.order_by("-created_at")
    return queryset


def apply_staff_dashboard_filters(queryset, request):
    """Optional filters for administrator/management queue listings."""
    date_from = request.query_params.get("date_from", "").strip()
    date_to = request.query_params.get("date_to", "").strip()
    if date_from:
        queryset = queryset.filter(created_at__date__gte=date_from)
    if date_to:
        queryset = queryset.filter(created_at__date__lte=date_to)

    category = request.query_params.get("category", "").strip()
    if category.isdigit():
        queryset = queryset.filter(category_id=int(category))

    authority = request.query_params.get("authority", "").strip()
    if authority.isdigit():
        from apps.assignments.models import Assignment

        queryset = queryset.filter(
            pk__in=Assignment.objects.filter(
                assigned_official_id=int(authority),
                is_current=True,
            ).values("incident_id")
        )

    priority = request.query_params.get("priority", "").strip()
    if priority in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
        queryset = queryset.filter(priority=priority)
    elif priority == "NOT_SET":
        queryset = queryset.filter(priority__isnull=True)
    elif priority == "REPORTER_URGENT":
        queryset = queryset.filter(reporter_priority="URGENT")
    elif priority == "REPORTER_NORMAL":
        queryset = queryset.filter(reporter_priority="NORMAL")

    status = request.query_params.get("status", "").strip()
    if status in IncidentStatus.values:
        queryset = queryset.filter(status=status)

    case_type = request.query_params.get("case_type", "").strip()
    if case_type in {"COMPLAINT", "SUGGESTION"}:
        queryset = queryset.filter(case_type=case_type)

    return queryset


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class LocationListView(generics.ListAPIView):
    # Free-text locations from private/unreviewed reports are not public reference data.
    queryset = _public_filter_locations_queryset()
    serializer_class = LocationSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class IncidentViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    permission_classes = [IsActiveUser, IncidentObjectPermission]

    def dispatch(self, request, *args, **kwargs):
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            with transaction.atomic():
                return super().dispatch(request, *args, **kwargs)
        return super().dispatch(request, *args, **kwargs)

    def get_throttles(self):
        if self.action == "create":
            return [IncidentCreateThrottle()]
        return super().get_throttles()

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return public_incident_queryset(user)

        queryset = optimized_incident_queryset(detail=bool(self.kwargs.get("pk")))
        queryset = queryset.annotate(priority_rank=Case(
            When(priority="CRITICAL", then=Value(4)), When(priority="HIGH", then=Value(3)),
            When(priority="MEDIUM", then=Value(2)), When(priority="LOW", then=Value(1)),
            default=Value(0), output_field=IntegerField(),
        ))
        if self.request.method not in {"GET", "HEAD", "OPTIONS"}:
            queryset = queryset.select_for_update(of=("self",))

        if user.role in {UserRole.ADMIN, UserRole.MANAGEMENT}:
            return queryset

        if user.role == UserRole.AUTHORITY:
            from apps.assignments.models import Assignment
            return queryset.filter(pk__in=Assignment.objects.filter(
                assigned_official=user, is_current=True,
            ).values("incident_id"))

        return queryset.filter(reporter=user)

    def _counts_queryset(self):
        user = self.request.user
        queryset = Incident.objects.all()
        if user.role in {UserRole.ADMIN, UserRole.MANAGEMENT}:
            return queryset
        if user.role == UserRole.AUTHORITY:
            from apps.assignments.models import Assignment

            return queryset.filter(
                pk__in=Assignment.objects.filter(
                    assigned_official=user,
                    is_current=True,
                ).values("incident_id")
            )
        if user.role in {UserRole.STUDENT, UserRole.LECTURER}:
            return queryset.filter(reporter=user)
        return queryset.none()

    def get_serializer_class(self):
        if self.action == "create":
            return IncidentCreateSerializer
        if self.action in {"list_public", "retrieve_public"}:
            return PublicIncidentSerializer
        if self.action in {
            "retrieve", "pending_review", "pending_changes", "forwarded_reports", "rejected_reports"
        } and self.request.user.role == UserRole.ADMIN:
            return IncidentAdminReviewSerializer
        if self.request.user.is_authenticated and self.request.user.role == UserRole.ADMIN:
            if self.action in {"verify", "reject", "approve_changes", "reject_changes"}:
                return IncidentAdminReviewSerializer
        return IncidentDetailSerializer

    def get_permissions(self):
        if self.action in {"list_public", "list_public_register", "retrieve_public"}:
            return [AllowAny()]
        if self.action in {"create", "destroy"}:
            return [IsReporter()]
        if self.action == "toggle_vote":
            return [IsReporter()]
        if self.action in {
            "pending_review", "pending_changes", "forwarded_reports", "rejected_reports", "review_stats"
        }:
            return [IsAdmin()]
        if self.action in {"dean_stats", "management_overview"}:
            return [IsManagement()]
        if self.action in {
            "verify",
            "reject",
            "assign",
            "close",
            "approve_changes",
            "reject_changes",
            "reopen",
        }:
            return [IsAdmin()]
        if self.action == "queue_counts":
            return [IsActiveUser()]
        if self.action in {"currently_underway", "dean_completed"}:
            return [IsAdminOrManagement()]
        if self.action == "awaiting_action":
            return [IsAdminOrManagement()]
        if self.action in {"assigned", "official_completed", "official_stats"}:
            return [IsAuthority()]
        if self.action in {"start_progress", "resolve"}:
            return [IsAuthority()]
        return super().get_permissions()

    def retrieve(self, request, *args, **kwargs):
        incident = self.get_object()
        if request.user.role == UserRole.ADMIN:
            serializer = IncidentAdminReviewSerializer(incident)
        elif request.user.role == UserRole.MANAGEMENT:
            serializer = IncidentManagementDetailSerializer(incident)
        elif request.user.role == UserRole.AUTHORITY:
            serializer = IncidentOfficialDetailSerializer(incident)
        elif request.user.role == UserRole.STUDENT:
            serializer = IncidentStudentDetailSerializer(incident)
        else:
            serializer = IncidentDetailSerializer(incident)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        incident = self.get_object()
        if request.user.role != UserRole.MANAGEMENT:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentPriorityUpdateSerializer(
            incident,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(IncidentManagementDetailSerializer(incident).data)

    def destroy(self, request, *args, **kwargs):
        incident = self.get_object()
        if incident.status not in {
            IncidentStatus.SUBMITTED,
            IncidentStatus.UNDER_REVIEW,
            IncidentStatus.REJECTED,
        }:
            return Response(
                {"detail": "Reports cannot be deleted after they have been approved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        incident.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def perform_create(self, serializer):
        with transaction.atomic():
            serializer.save(
                incident_number=generate_incident_number(),
                status=IncidentStatus.SUBMITTED,
            )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        incident = Incident.objects.select_related(
            "category",
            "location",
            "reporter",
        ).prefetch_related("images").get(pk=serializer.instance.pk)
        notify_admins_of_submission(incident)
        return Response(
            IncidentDetailSerializer(incident).data,
            status=status.HTTP_201_CREATED,
        )

    def _notify_reporter(self, incident, *, title, message, notification_type):
        Notification.objects.create(
            user=incident.reporter,
            title=title,
            message=message,
            notification_type=notification_type,
            related_incident=incident,
        )

    @action(detail=False, methods=["get"], url_path="queue-counts")
    def queue_counts(self, request):
        pending_revision = IncidentRevision.objects.filter(
            incident=OuterRef("pk"),
            status=IncidentRevisionStatus.PENDING,
        )
        filters = {
            UserRole.ADMIN: {
                "review": Q(status__in=PENDING_REVIEW_STATUSES),
                "changes": Q(Exists(pending_revision)),
                "assignment": Q(
                    status__in=[IncidentStatus.NOT_STARTED, IncidentStatus.REOPENED]
                ),
                "underway": Q(
                    status__in={
                        IncidentStatus.ASSIGNED,
                        IncidentStatus.IN_PROGRESS,
                        IncidentStatus.RESOLVED,
                    }
                ),
                "rejected": Q(status=IncidentStatus.REJECTED),
                "completed": Q(status=IncidentStatus.CLOSED),
            },
            UserRole.MANAGEMENT: {
                "assignment": Q(
                    status__in=[IncidentStatus.NOT_STARTED, IncidentStatus.REOPENED]
                ),
                "underway": Q(status__in=[IncidentStatus.ASSIGNED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED]),
                "completed": Q(status=IncidentStatus.CLOSED),
            },
            UserRole.AUTHORITY: {
                "active": Q(
                    status__in={
                        IncidentStatus.ASSIGNED,
                        IncidentStatus.IN_PROGRESS,
                        IncidentStatus.REOPENED,
                    }
                ),
                "completed": Q(status__in=[IncidentStatus.RESOLVED, IncidentStatus.CLOSED]),
            },
            UserRole.STUDENT: {
                "total": Q(),
                "underReview": Q(status__in=PENDING_REVIEW_STATUSES),
                "inProgress": Q(
                    status__in=[
                        IncidentStatus.NOT_STARTED,
                        IncidentStatus.ASSIGNED,
                        IncidentStatus.IN_PROGRESS,
                        IncidentStatus.REOPENED,
                        IncidentStatus.WAITING_FOR_INFORMATION,
                    ]
                ),
                "resolved": Q(status__in=[IncidentStatus.RESOLVED, IncidentStatus.CLOSED]),
            },
            UserRole.LECTURER: {
                "total": Q(),
                "underReview": Q(status__in=PENDING_REVIEW_STATUSES),
                "inProgress": Q(
                    status__in=[
                        IncidentStatus.NOT_STARTED,
                        IncidentStatus.ASSIGNED,
                        IncidentStatus.IN_PROGRESS,
                        IncidentStatus.REOPENED,
                        IncidentStatus.WAITING_FOR_INFORMATION,
                    ]
                ),
                "resolved": Q(status__in=[IncidentStatus.RESOLVED, IncidentStatus.CLOSED]),
            },
        }
        role_filters = filters.get(request.user.role)
        if role_filters is None:
            return Response(
                {"detail": "Queue counts are not available for this role."},
                status=status.HTTP_403_FORBIDDEN,
            )
        queryset = self._counts_queryset()
        if request.user.role in {UserRole.ADMIN, UserRole.MANAGEMENT, UserRole.AUTHORITY}:
            queryset = apply_staff_dashboard_filters(queryset, request)
        return Response(
            queryset.aggregate(
                **{
                    key: Count("id", distinct=True, filter=condition)
                    for key, condition in role_filters.items()
                }
            )
        )

    @action(detail=False, methods=["get"], url_path="official-stats")
    def official_stats(self, request):
        queryset = self.get_queryset()
        return Response(
            queryset.aggregate(
                assigned=Count(
                    "id",
                    distinct=True,
                    filter=Q(
                        status__in={
                            IncidentStatus.ASSIGNED,
                            IncidentStatus.REOPENED,
                        }
                    ),
                ),
                in_progress=Count(
                    "id",
                    distinct=True,
                    filter=Q(status=IncidentStatus.IN_PROGRESS),
                ),
                resolved=Count("id", distinct=True, filter=Q(status=IncidentStatus.RESOLVED)),
                total_assigned=Count("id", distinct=True),
            )
        )

    @action(detail=False, methods=["get"], url_path="assigned")
    def assigned(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(
                status__in={
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.IN_PROGRESS,
                    IncidentStatus.REOPENED,
                }
            ),
            request,
        ).order_by("-priority_rank", "-updated_at", "-pk")
        page = self.paginate_queryset(queryset)
        serializer = IncidentOfficialDetailSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="completed")
    def official_completed(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(
                status__in={
                    IncidentStatus.RESOLVED,
                    IncidentStatus.CLOSED,
                }
            ),
            request,
        ).order_by("-updated_at")
        page = self.paginate_queryset(queryset)
        serializer = IncidentOfficialDetailSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="dean-stats")
    def dean_stats(self, request):
        queryset = self.get_queryset()
        return Response(
            queryset.aggregate(
                total_incidents=Count("id"),
                awaiting_action=Count(
                    "id",
                    filter=Q(
                        status__in={
                            IncidentStatus.NOT_STARTED,
                            IncidentStatus.REOPENED,
                        }
                    ),
                ),
                assigned=Count("id", filter=Q(status=IncidentStatus.ASSIGNED)),
                in_progress=Count("id", filter=Q(status=IncidentStatus.IN_PROGRESS)),
                resolved_awaiting_closure=Count(
                    "id",
                    filter=Q(status=IncidentStatus.RESOLVED),
                ),
                closed=Count("id", filter=Q(status=IncidentStatus.CLOSED)),
            )
        )

    @action(detail=False, methods=["get"], url_path="management-overview")
    def management_overview(self, request):
        return Response(build_management_overview())

    @action(detail=False, methods=["get"], url_path="awaiting-action")
    def awaiting_action(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(
                status__in=[IncidentStatus.NOT_STARTED, IncidentStatus.REOPENED]
            ),
            request,
        ).order_by("-priority_rank", "created_at", "pk")
        page = self.paginate_queryset(queryset)
        serializer_class = (
            IncidentManagementDetailSerializer
            if request.user.role == UserRole.MANAGEMENT
            else IncidentDeanDetailSerializer
        )
        serializer = serializer_class(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="currently-underway")
    def currently_underway(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(
                status__in={
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.IN_PROGRESS,
                    IncidentStatus.RESOLVED,
                }
            ),
            request,
        ).order_by("-priority_rank", "-updated_at", "-pk")
        page = self.paginate_queryset(queryset)
        serializer_class = (
            IncidentManagementDetailSerializer
            if request.user.role == UserRole.MANAGEMENT
            else IncidentDeanDetailSerializer
        )
        serializer = serializer_class(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="dean-completed")
    def dean_completed(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(status=IncidentStatus.CLOSED),
            request,
        ).order_by("-closed_at", "-updated_at")
        page = self.paginate_queryset(queryset)
        serializer_class = (
            IncidentManagementDetailSerializer
            if request.user.role == UserRole.MANAGEMENT
            else IncidentDeanDetailSerializer
        )
        serializer = serializer_class(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="pending-review")
    def pending_review(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(status__in=PENDING_REVIEW_STATUSES),
            request,
        ).order_by("created_at")
        page = self.paginate_queryset(queryset)
        serializer = IncidentAdminReviewSerializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="pending-changes")
    def pending_changes(self, request):
        pending_revision = IncidentRevision.objects.filter(
            incident=OuterRef("pk"),
            status=IncidentRevisionStatus.PENDING,
        )
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(Exists(pending_revision)),
            request,
        ).order_by("-updated_at")
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(
            IncidentAdminReviewSerializer(page, many=True).data
        )

    @action(detail=False, methods=["get"], url_path="forwarded-reports")
    def forwarded_reports(self, request):
        queryset = self.get_queryset().filter(
            status__in={
                IncidentStatus.NOT_STARTED,
                IncidentStatus.ASSIGNED,
                IncidentStatus.IN_PROGRESS,
                IncidentStatus.RESOLVED,
                IncidentStatus.CLOSED,
            }
        ).order_by("-updated_at")
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(
            IncidentAdminReviewSerializer(page, many=True).data
        )

    @action(detail=False, methods=["get"], url_path="rejected-reports")
    def rejected_reports(self, request):
        queryset = apply_staff_dashboard_filters(
            self.get_queryset().filter(status=IncidentStatus.REJECTED),
            request,
        ).order_by("-updated_at")
        page = self.paginate_queryset(queryset)
        return self.get_paginated_response(
            IncidentAdminReviewSerializer(page, many=True).data
        )

    @action(detail=False, methods=["get"], url_path="review-stats")
    def review_stats(self, request):
        queryset = self.get_queryset()
        return Response(
            queryset.aggregate(
                pending_verification=Count(
                    "id",
                    distinct=True,
                    filter=Q(status__in=PENDING_REVIEW_STATUSES),
                ),
                verified=Count("id", distinct=True, filter=Q(status=IncidentStatus.NOT_STARTED)),
                forwarded_to_dean=Count(
                    "id",
                    distinct=True,
                    filter=Q(status=IncidentStatus.NOT_STARTED),
                ),
                rejected=Count("id", distinct=True, filter=Q(status=IncidentStatus.REJECTED)),
                pending_changes=Count(
                    "id",
                    distinct=True,
                    filter=Q(revisions__status=IncidentRevisionStatus.PENDING),
                ),
            )
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="submit-changes",
        permission_classes=[IsReporter],
    )
    def submit_changes(self, request, pk=None):
        incident = self.get_object()
        if incident.reporter_id != request.user.id:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        if incident.revisions.filter(status=IncidentRevisionStatus.PENDING).exists():
            return Response(
                {"detail": "Changes are already waiting for admin review."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IncidentStudentUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.resolve_values()
        if not any(getattr(incident, field) != value for field, value in values.items()):
            return Response(
                {"detail": "Change at least one incident detail before submitting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if incident.status in {
            IncidentStatus.SUBMITTED,
            IncidentStatus.UNDER_REVIEW,
            IncidentStatus.REJECTED,
        }:
            for field, value in values.items():
                setattr(incident, field, value)
            incident.status = IncidentStatus.SUBMITTED
            incident.admin_review_note = ""
            incident.save()
            notify_admins_of_submission(incident)
        else:
            IncidentRevision.objects.create(
                incident=incident,
                submitted_by=request.user,
                original_title=incident.title,
                proposed_title=values["title"],
                original_description=incident.description,
                proposed_description=values["description"],
                original_category=incident.category,
                proposed_category=values["category"],
                original_location=incident.location,
                proposed_location=values["location"],
                original_visibility=incident.visibility,
                proposed_visibility=values["visibility"],
            )
            notify_admins_of_revision(incident)

        incident = self.get_queryset().get(pk=incident.pk)
        return Response(IncidentStudentDetailSerializer(incident).data)

    def _get_pending_revision(self, incident):
        return incident.revisions.filter(
            status=IncidentRevisionStatus.PENDING
        ).select_related("proposed_category", "proposed_location").first()

    @action(
        detail=True,
        methods=["post"],
        url_path="approve-changes",
        permission_classes=[IsAdmin],
    )
    def approve_changes(self, request, pk=None):
        incident = self.get_object()
        if not user_can_admin_review_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        revision = self._get_pending_revision(incident)
        if not revision:
            return Response(
                {"detail": "No pending changes were found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        decision = IncidentRevisionDecisionSerializer(data=request.data)
        decision.is_valid(raise_exception=True)
        with transaction.atomic():
            incident.title = revision.proposed_title
            incident.description = revision.proposed_description
            incident.category = revision.proposed_category
            incident.location = revision.proposed_location
            incident.visibility = revision.proposed_visibility
            incident.save()
            revision.status = IncidentRevisionStatus.APPROVED
            revision.reviewed_by = request.user
            revision.reviewed_at = timezone.now()
            revision.review_comment = decision.validated_data.get("comment", "").strip()
            revision.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])
        self._notify_reporter(
            incident,
            title="Incident changes approved",
            message=f"Your changes to {incident.incident_number} are now active.",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
        )
        incident = self.get_queryset().get(pk=incident.pk)
        return Response(IncidentAdminReviewSerializer(incident).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="reject-changes",
        permission_classes=[IsAdmin],
    )
    def reject_changes(self, request, pk=None):
        incident = self.get_object()
        if not user_can_admin_review_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
        revision = self._get_pending_revision(incident)
        if not revision:
            return Response(
                {"detail": "No pending changes were found."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        decision = IncidentRejectSerializer(data=request.data)
        decision.is_valid(raise_exception=True)
        revision.status = IncidentRevisionStatus.REJECTED
        revision.reviewed_by = request.user
        revision.reviewed_at = timezone.now()
        revision.review_comment = decision.validated_data["comment"].strip()
        revision.save(update_fields=["status", "reviewed_by", "reviewed_at", "review_comment"])
        self._notify_reporter(
            incident,
            title="Incident changes not approved",
            message=f"The proposed changes to {incident.incident_number} were not approved. Review the reason in the incident.",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
        )
        incident = self.get_queryset().get(pk=incident.pk)
        return Response(IncidentAdminReviewSerializer(incident).data)

    @action(
        detail=True,
        methods=["post"],
        url_path="images",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request, pk=None):
        incident = self.get_object()
        if incident.status == IncidentStatus.CLOSED:
            raise ValidationError({"file": "Closed incidents cannot accept new evidence."})
        if incident.images.count() >= 5:
            raise ValidationError({"file": "A report can include up to five evidence files."})

        if request.user.role in {UserRole.STUDENT, UserRole.LECTURER}:
            if incident.reporter_id != request.user.id:
                return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            if incident.status != IncidentStatus.SUBMITTED:
                return Response(
                    {"detail": "Evidence can only be added while the case is submitted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif not user_can_modify_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        uploaded_file = (
            request.FILES.get("file")
            or request.FILES.get("image")
            or request.FILES.get("video")
        )
        if not uploaded_file:
            raise ValidationError({"file": "An image or video file is required."})

        try:
            upload_result = upload_incident_media(uploaded_file, incident.incident_number)
        except ValidationError as exc:
            detail = exc.detail if hasattr(exc, "detail") else {"file": str(exc)}
            if isinstance(detail, list):
                detail = {"file": detail[0]}
            raise ValidationError(detail) from exc
        except ValueError as exc:
            raise ValidationError({"file": str(exc)}) from exc
        except Exception as exc:
            raise ValidationError({"file": "We couldn't upload the file. Please try again."}) from exc

        image = IncidentImage.objects.create(
            incident=incident,
            media_type=upload_result["media_type"],
            resource_format=upload_result.get("format", ""),
            cloudinary_public_id=upload_result["public_id"],
            cloudinary_url=upload_result["secure_url"],
            original_filename=getattr(uploaded_file, "name", ""),
            uploaded_by=request.user,
        )

        return Response(
            IncidentImageSerializer(image).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["get"], url_path="public")
    def list_public(self, request):
        queryset = apply_public_list_filters(
            public_incident_queryset(request.user),
            request,
        )
        page = self.paginate_queryset(queryset)
        serializer = PublicIncidentSerializer(
            page,
            many=True,
            context={"request": request},
        )
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], url_path="public-register")
    def list_public_register(self, request):
        """Categories, locations, and paginated public cases in one response (register page)."""
        categories = CategorySerializer(
            Category.objects.filter(is_active=True),
            many=True,
        ).data
        locations = LocationSerializer(_public_filter_locations_queryset(), many=True).data
        queryset = apply_public_list_filters(
            public_incident_queryset(request.user),
            request,
        )
        page = self.paginate_queryset(queryset)
        serializer = PublicIncidentSerializer(
            page,
            many=True,
            context={"request": request},
        )
        response = self.get_paginated_response(serializer.data)
        response.data["categories"] = categories
        response.data["locations"] = locations
        return response

    @action(detail=True, methods=["get"], url_path="public")
    def retrieve_public(self, request, pk=None):
        incident = public_incident_queryset(request.user).filter(pk=pk).first()
        if not incident:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = PublicIncidentSerializer(incident, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="vote")
    def toggle_vote(self, request, pk=None):
        incident = Incident.objects.select_for_update().filter(
            pk=pk, visibility="PUBLIC", status__in=PUBLIC_VISIBLE_STATUSES,
        ).first()
        if not incident:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        desired = request.data.get("upvoted")
        if desired is not None and not isinstance(desired, bool):
            raise ValidationError({"upvoted": "Use true or false."})
        with transaction.atomic():
            vote, created = IncidentVote.objects.get_or_create(
                incident=incident,
                user=request.user,
            )
            if desired is False or (desired is None and not created):
                vote.delete()
            upvoted = desired if desired is not None else created

        return Response(
            {
                "vote_count": IncidentVote.objects.filter(incident=incident).count(),
                "user_has_upvoted": upvoted,
            },
        )

    def _transition(self, incident, new_status, extra=None):
        if not is_valid_status_transition(incident.status, new_status):
            return Response(
                {"detail": f"Cannot transition from {incident.status} to {new_status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        incident.status = new_status
        now = timezone.now()

        if new_status == IncidentStatus.NOT_STARTED:
            incident.verified_at = now
        elif new_status == IncidentStatus.RESOLVED:
            incident.resolved_at = now
        elif new_status == IncidentStatus.CLOSED:
            incident.closed_at = now

        if extra:
            for key, value in extra.items():
                setattr(incident, key, value)

        incident.save()
        return Response(IncidentDetailSerializer(incident).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def verify(self, request, pk=None):
        incident = self.get_object()
        if not user_can_verify_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")

        try:
            admin_verify_and_forward(incident, verified_at=timezone.now())
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.admin_review_note = comment.strip()
        incident.save(update_fields=["admin_review_note", "updated_at"])
        self._notify_reporter(
            incident,
            title="Incident verified",
            message=f"Your incident {incident.incident_number} has been verified and forwarded for action.",
            notification_type=NotificationType.INCIDENT_VERIFIED,
        )

        incident.refresh_from_db()
        return Response(IncidentAdminReviewSerializer(incident).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def reject(self, request, pk=None):
        incident = self.get_object()
        if not user_can_admin_review_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data["comment"]

        try:
            admin_reject_incident(incident)
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.admin_review_note = comment.strip()
        incident.save(update_fields=["admin_review_note", "updated_at"])
        self._notify_reporter(
            incident,
            title="Incident rejected",
            message=f"Your incident {incident.incident_number} was rejected. Review the reason in the incident details.",
            notification_type=NotificationType.INCIDENT_REJECTED,
        )

        incident.refresh_from_db()
        return Response(IncidentAdminReviewSerializer(incident).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def assign(self, request, pk=None):
        incident = self.get_object()
        if not user_can_assign_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            assign_incident(
                incident,
                assigned_official=data["assigned_official"],
                assigned_by=request.user,
                responsible_party=data.get("responsible_party"),
                comment=data.get("comment", ""),
                priority=data.get("priority"),
            )
        except (InvalidStatusTransitionError, ValueError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.refresh_from_db()
        return Response(IncidentDeanDetailSerializer(incident).data)

    @action(detail=True, methods=["post"], url_path="start-progress", permission_classes=[IsAuthority])
    def start_progress(self, request, pk=None):
        incident = self.get_object()
        if not user_can_start_progress_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")

        try:
            start_incident_progress(incident)
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.progress_note = comment.strip()
        incident.save(update_fields=["progress_note", "updated_at"])

        incident.refresh_from_db()
        return Response(IncidentOfficialDetailSerializer(incident).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAuthority])
    def resolve(self, request, pk=None):
        incident = self.get_object()
        if not user_can_resolve_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentResolveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data["comment"]

        try:
            resolve_assigned_incident(incident)
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.resolution_statement = comment.strip()
        incident.save(update_fields=["resolution_statement", "updated_at"])

        incident.refresh_from_db()
        return Response(IncidentOfficialDetailSerializer(incident).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdmin])
    def close(self, request, pk=None):
        incident = self.get_object()
        if not user_can_close_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")

        try:
            close_incident(incident, closed_by=request.user, comment=comment)
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.closure_note = comment.strip()
        incident.save(update_fields=["closure_note", "updated_at"])

        incident.refresh_from_db()
        return Response(IncidentDeanDetailSerializer(incident).data)

    @action(detail=True, methods=["post"], url_path="reopen", permission_classes=[IsAdmin])
    def reopen(self, request, pk=None):
        incident = self.get_object()
        if not user_can_reopen_incident(request.user, incident):
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        serializer = IncidentActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.validated_data.get("comment", "")

        try:
            transition_incident(incident, IncidentStatus.REOPENED)
        except InvalidStatusTransitionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        incident.reopen_reason = comment.strip()
        incident.save(update_fields=["reopen_reason", "updated_at"])

        Notification.objects.create(
            user=incident.reporter,
            title="Incident returned for additional work",
            message=f"Incident {incident.incident_number} requires further action.",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
            related_incident=incident,
        )

        assignment = incident.assignments.filter(is_current=True).select_related(
            "assigned_official"
        ).first()
        if assignment:
            Notification.objects.create(
                user=assignment.assigned_official,
                title="Incident returned for additional work",
                message=f"Please continue work on {incident.incident_number}.",
                notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
                related_incident=incident,
            )

        incident.refresh_from_db()
        return Response(IncidentDeanDetailSerializer(incident).data)

from rest_framework import serializers

from apps.accounts.models import User
from apps.assignments.models import Assignment, ResponsibleParty
from apps.common.choices import AccountStatus, IncidentPriority, UserRole
from apps.incidents.models import (
    Category,
    Incident,
    IncidentImage,
    IncidentRevision,
    IncidentRevisionStatus,
    Location,
)


def get_current_assignment_data(obj):
    prefetched = getattr(obj, "prefetched_current_assignments", None)
    if prefetched is not None:
        assignment = prefetched[0] if prefetched else None
    else:
        assignment = obj.assignments.filter(is_current=True).select_related(
            "assigned_official",
            "assigned_by",
            "responsible_party",
        ).first()
    if not assignment:
        return None
    return AssignmentSerializer(assignment).data


class ReporterAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "mc_number",
        ]
        read_only_fields = fields


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "is_active"]


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "building", "floor", "faculty", "is_active"]


class IncidentImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentImage
        fields = [
            "id",
            "cloudinary_url",
            "original_filename",
            "uploaded_at",
        ]
        read_only_fields = fields


class IncidentRevisionSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.CharField(source="submitted_by.name", read_only=True)
    reviewed_by_name = serializers.CharField(source="reviewed_by.name", read_only=True)
    changes = serializers.SerializerMethodField()

    class Meta:
        model = IncidentRevision
        fields = [
            "id",
            "status",
            "changes",
            "submitted_by_name",
            "submitted_at",
            "reviewed_by_name",
            "reviewed_at",
            "review_comment",
        ]
        read_only_fields = fields

    def get_changes(self, obj):
        values = [
            ("title", "Title", obj.original_title, obj.proposed_title),
            ("description", "Description", obj.original_description, obj.proposed_description),
            ("category", "Category", obj.original_category.name, obj.proposed_category.name),
            ("location", "Location", obj.original_location.name, obj.proposed_location.name),
            (
                "visibility",
                "Visibility",
                obj.get_original_visibility_display(),
                obj.get_proposed_visibility_display(),
            ),
        ]
        return [
            {"field": field, "label": label, "before": before, "after": after}
            for field, label, before, after in values
            if before != after
        ]


class IncidentRevisionDecisionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True, max_length=2000)


class PublicIncidentSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = IncidentImageSerializer(many=True, read_only=True)
    vote_count = serializers.IntegerField(read_only=True)
    user_has_upvoted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "incident_number",
            "title",
            "description",
            "category",
            "location",
            "status",
            "priority",
            "visibility",
            "images",
            "vote_count",
            "user_has_upvoted",
            "created_at",
            "updated_at",
            "verified_at",
            "resolved_at",
            "closed_at",
        ]
        read_only_fields = fields


class IncidentAdminReviewSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = IncidentImageSerializer(many=True, read_only=True)
    reporter = ReporterAdminSerializer(read_only=True)
    pending_revision = serializers.SerializerMethodField()
    revision_history = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "incident_number",
            "title",
            "description",
            "category",
            "location",
            "status",
            "priority",
            "visibility",
            "reporter",
            "images",
            "admin_review_note",
            "progress_note",
            "resolution_statement",
            "closure_note",
            "reopen_reason",
            "pending_revision",
            "revision_history",
            "created_at",
            "updated_at",
            "verified_at",
            "resolved_at",
            "closed_at",
        ]
        read_only_fields = fields

    def get_pending_revision(self, obj):
        revision = obj.revisions.filter(status=IncidentRevisionStatus.PENDING).first()
        return IncidentRevisionSerializer(revision).data if revision else None

    def get_revision_history(self, obj):
        return IncidentRevisionSerializer(obj.revisions.all(), many=True).data


class IncidentDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = IncidentImageSerializer(many=True, read_only=True)
    reporter_name = serializers.CharField(source="reporter.name", read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "incident_number",
            "title",
            "description",
            "category",
            "location",
            "status",
            "priority",
            "visibility",
            "reporter",
            "reporter_name",
            "images",
            "admin_review_note",
            "progress_note",
            "resolution_statement",
            "closure_note",
            "reopen_reason",
            "created_at",
            "updated_at",
            "verified_at",
            "resolved_at",
            "closed_at",
        ]
        read_only_fields = [
            "id",
            "incident_number",
            "status",
            "reporter",
            "reporter_name",
            "created_at",
            "updated_at",
            "verified_at",
            "resolved_at",
            "closed_at",
        ]


class IncidentDeanDetailSerializer(IncidentAdminReviewSerializer):
    current_assignment = serializers.SerializerMethodField()

    class Meta(IncidentAdminReviewSerializer.Meta):
        fields = IncidentAdminReviewSerializer.Meta.fields + ["current_assignment"]

    def get_current_assignment(self, obj):
        return get_current_assignment_data(obj)


class IncidentResolveSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, min_length=5)


class IncidentOfficialDetailSerializer(IncidentDetailSerializer):
    current_assignment = serializers.SerializerMethodField()

    class Meta(IncidentDetailSerializer.Meta):
        fields = IncidentDetailSerializer.Meta.fields + ["current_assignment"]

    def get_current_assignment(self, obj):
        return get_current_assignment_data(obj)


class IncidentStudentDetailSerializer(IncidentDetailSerializer):
    current_assignment = serializers.SerializerMethodField()
    pending_revision = serializers.SerializerMethodField()
    revision_history = serializers.SerializerMethodField()

    class Meta(IncidentDetailSerializer.Meta):
        fields = IncidentDetailSerializer.Meta.fields + [
            "current_assignment",
            "pending_revision",
            "revision_history",
        ]

    def get_current_assignment(self, obj):
        return get_current_assignment_data(obj)

    def get_pending_revision(self, obj):
        revision = obj.revisions.filter(status=IncidentRevisionStatus.PENDING).first()
        return IncidentRevisionSerializer(revision).data if revision else None

    def get_revision_history(self, obj):
        return IncidentRevisionSerializer(obj.revisions.all(), many=True).data


class IncidentCreateSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(
        required=False,
        allow_blank=False,
        max_length=255,
        write_only=True,
        trim_whitespace=True,
    )

    class Meta:
        model = Incident
        fields = [
            "title",
            "description",
            "category",
            "location",
            "location_name",
            "visibility",
        ]
        extra_kwargs = {
            "location": {"required": False},
        }

    def validate_category(self, value):
        if not value.is_active:
            raise serializers.ValidationError("Selected category is not available.")
        return value

    def validate_location(self, value):
        if value and not value.is_active:
            raise serializers.ValidationError("Selected location is not available.")
        return value

    def validate_location_name(self, value):
        normalized = value.strip()
        if len(normalized) < 2:
            raise serializers.ValidationError(
                "Location must be at least 2 characters."
            )
        return normalized

    def validate(self, attrs):
        location = attrs.get("location")
        location_name = attrs.get("location_name")

        if location and location_name:
            attrs.pop("location_name", None)
        elif not location and not location_name:
            raise serializers.ValidationError(
                {"location_name": "Please enter a location."}
            )
        return attrs

    def create(self, validated_data):
        location_name = validated_data.pop("location_name", None)
        if location_name:
            validated_data["location"] = self._resolve_location(location_name)
        validated_data["reporter"] = self.context["request"].user
        return super().create(validated_data)

    @staticmethod
    def _resolve_location(name: str) -> Location:
        existing = Location.objects.filter(name__iexact=name, is_active=True).first()
        if existing:
            return existing
        return Location.objects.create(name=name, is_active=True)


class IncidentStudentUpdateSerializer(IncidentCreateSerializer):
    class Meta(IncidentCreateSerializer.Meta):
        fields = IncidentCreateSerializer.Meta.fields

    def create(self, validated_data):
        raise NotImplementedError

    def resolve_values(self):
        values = dict(self.validated_data)
        location_name = values.pop("location_name", None)
        if location_name:
            values["location"] = self._resolve_location(location_name)
        return values


class IncidentActionSerializer(serializers.Serializer):
    comment = serializers.CharField(required=False, allow_blank=True)


class IncidentRejectSerializer(serializers.Serializer):
    comment = serializers.CharField(required=True, min_length=5)


class IncidentAssignSerializer(serializers.Serializer):
    assigned_official = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role=UserRole.OFFICIAL, status=AccountStatus.ACTIVE),
    )
    responsible_party = serializers.PrimaryKeyRelatedField(
        queryset=ResponsibleParty.objects.filter(is_active=True),
        required=False,
        allow_null=True,
    )
    comment = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.ChoiceField(
        choices=IncidentPriority.choices,
        required=False,
        allow_null=True,
    )


class IncidentPriorityUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = ["priority"]


class AssignmentSerializer(serializers.ModelSerializer):
    assigned_official_name = serializers.CharField(
        source="assigned_official.name",
        read_only=True,
    )
    assigned_by_name = serializers.CharField(source="assigned_by.name", read_only=True)

    class Meta:
        model = Assignment
        fields = [
            "id",
            "incident",
            "assigned_official",
            "assigned_official_name",
            "assigned_by",
            "assigned_by_name",
            "responsible_party",
            "comment",
            "is_current",
            "assigned_at",
        ]
        read_only_fields = [
            "id",
            "assigned_by",
            "assigned_by_name",
            "is_current",
            "assigned_at",
        ]


class ResponsiblePartySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponsibleParty
        fields = ["id", "name", "description", "is_active", "officials"]
        read_only_fields = ["id"]

    def validate_officials(self, value):
        invalid = [user for user in value if user.role != UserRole.OFFICIAL]
        if invalid:
            raise serializers.ValidationError("All assigned users must be officials.")
        return value

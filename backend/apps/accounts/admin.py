from django.contrib import admin

from apps.accounts.models import User
from apps.assignments.models import Assignment, ResponsibleParty
from apps.incidents.models import Category, Incident, IncidentImage, Location
from apps.notifications.models import Notification


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "name", "role", "position", "status", "is_active"]
    list_filter = ["role", "status", "is_active"]
    search_fields = ["email", "name", "mc_number"]
    ordering = ["email"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "is_active"]
    search_fields = ["name", "slug"]


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "building", "floor", "is_active"]
    search_fields = ["name", "building"]


class IncidentImageInline(admin.TabularInline):
    model = IncidentImage
    extra = 0
    readonly_fields = ["cloudinary_url", "uploaded_at"]


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        "incident_number",
        "title",
        "status",
        "visibility",
        "priority",
        "reporter",
        "created_at",
    ]
    list_filter = ["status", "visibility", "priority", "category"]
    search_fields = ["incident_number", "title"]
    inlines = [IncidentImageInline]


@admin.register(ResponsibleParty)
class ResponsiblePartyAdmin(admin.ModelAdmin):
    list_display = ["name", "is_active"]
    filter_horizontal = ["officials"]


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ["incident", "assigned_official", "is_current", "assigned_at"]
    list_filter = ["is_current"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "notification_type", "is_read", "created_at"]
    list_filter = ["notification_type", "is_read"]

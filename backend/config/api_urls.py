from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import (
    CustomTokenRefreshView,
    HealthCheckView,
    LoginView,
    OfficialAccountViewSet,
    OfficialActivateView,
    ProfileView,
    StudentPasswordChangeView,
)
from apps.assignments.views import AssignmentViewSet, ResponsiblePartyViewSet
from apps.incidents.views import CategoryListView, IncidentViewSet, LocationListView
from apps.notifications.views import NotificationViewSet

router = DefaultRouter()
router.register("incidents", IncidentViewSet, basename="incident")
router.register("responsible-parties", ResponsiblePartyViewSet, basename="responsible-party")
router.register("assignments", AssignmentViewSet, basename="assignment")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("officials", OfficialAccountViewSet, basename="official")

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("auth/activate/", OfficialActivateView.as_view(), name="official-activate"),
    path("auth/login/", LoginView.as_view(), name="token-obtain-pair"),
    path("auth/refresh/", CustomTokenRefreshView.as_view(), name="token-refresh"),
    path("auth/profile/", ProfileView.as_view(), name="profile"),
    path("auth/change-password/", StudentPasswordChangeView.as_view(), name="change-password"),
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("locations/", LocationListView.as_view(), name="location-list"),
    path("", include(router.urls)),
]

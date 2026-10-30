from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.common.choices import AccountStatus, UserRole


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.status == AccountStatus.ACTIVE
        )


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.STUDENT


class IsLecturer(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.LECTURER


class IsReporter(BasePermission):
    """Student or lecturer — may submit cases."""

    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.STUDENT,
            UserRole.LECTURER,
        }


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.ADMIN


class IsManagement(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.MANAGEMENT


class IsAuthority(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.AUTHORITY


class IsSysAdmin(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role == UserRole.SYSADMIN


# Backward-compatible aliases (remove after full rename)
IsDean = IsManagement
IsOfficial = IsAuthority


class IsAdminOrManagement(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
        }


IsAdminOrDean = IsAdminOrManagement


class IsAdminManagementOrSysAdmin(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.SYSADMIN,
        }


class IsManagementOrSysAdmin(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.MANAGEMENT,
            UserRole.SYSADMIN,
        }


class IsManagementOrAuthority(BasePermission):
    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.MANAGEMENT,
            UserRole.AUTHORITY,
        }


IsDeanOrOfficial = IsManagementOrAuthority


class IsStaffRole(BasePermission):
    """Administrator, management, authority, or system administrator."""

    def has_permission(self, request, view):
        return IsActiveUser().has_permission(request, view) and request.user.role in {
            UserRole.ADMIN,
            UserRole.MANAGEMENT,
            UserRole.AUTHORITY,
            UserRole.SYSADMIN,
        }


class ReadOnly(BasePermission):
    def has_permission(self, request, view):
        return request.method in SAFE_METHODS

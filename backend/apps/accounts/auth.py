from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import AuthenticationFailed

from apps.common.choices import AccountStatus

def account_is_allowed(user) -> bool:
    return bool(user and user.is_active and user.status == AccountStatus.ACTIVE)


class ActiveSessionAuthentication(SessionAuthentication):
    def authenticate_header(self, request):
        return "Session"

    def authenticate(self, request):
        result = super().authenticate(request)
        if result and not account_is_allowed(result[0]):
            raise AuthenticationFailed("This account is not active.")
        return result

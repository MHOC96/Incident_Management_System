from django.contrib.auth import get_user_model, login, logout, update_session_auth_hash
from django.middleware.csrf import get_token
from smtplib import SMTPException
import hashlib
from rest_framework.authentication import SessionAuthentication
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView
from apps.accounts.serializers import (
    LoginSerializer,
    OfficialAccountSerializer,
    OfficialActivateSerializer,
    OfficialCreateSerializer,
    OfficialStatusSerializer,
    StudentPasswordChangeSerializer,
    UserProfileSerializer,
)
from apps.accounts.services import activate_official_account, create_official_invitation
from apps.common.choices import UserRole
from apps.common.permissions import IsActiveUser, IsDean, IsStudent

User = get_user_model()


class RegistrationThrottle(AnonRateThrottle):
    scope = "registration"


class LoginThrottle(UserRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        identifier = str(request.user.pk) if request.user.is_authenticated else str(
            request.data.get("mc_number") or request.data.get("email") or self.get_ident(request)
        ).strip().casefold().replace(" ", "")
        return self.cache_format % {"scope": self.scope, "ident": hashlib.sha256(identifier.encode()).hexdigest()}


class OfficialActivateView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [RegistrationThrottle]

    def post(self, request):
        serializer = OfficialActivateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = activate_official_account(
                token=serializer.validated_data["token"],
                password=serializer.validated_data["password"],
            )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            OfficialAccountSerializer(user).data,
            status=status.HTTP_200_OK,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsActiveUser]

    def get_object(self):
        return self.request.user


class StudentPasswordChangeView(APIView):
    permission_classes = [IsStudent]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        serializer = StudentPasswordChangeSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        update_session_auth_hash(request, user)
        return Response({"detail": "Password updated."})


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "incident-management-api"})


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginThrottle]

    def post(self, request):
        SessionAuthentication().enforce_csrf(request)
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user, backend="django.contrib.auth.backends.ModelBackend")
        return Response({"user": UserProfileSerializer(user).data, "csrfToken": get_token(request)})


class SessionView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "user": UserProfileSerializer(request.user).data if request.user.is_authenticated else None,
            "csrfToken": get_token(request),
        })


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        SessionAuthentication().enforce_csrf(request)
        logout(request)
        return Response({"detail": "Signed out."})


class OfficialAccountViewSet(viewsets.ModelViewSet):
    permission_classes = [IsDean]
    http_method_names = ["get", "post", "patch", "head", "options"]
    pagination_class = None

    def get_queryset(self):
        return User.objects.filter(role=UserRole.OFFICIAL).order_by("name")

    def get_serializer_class(self):
        if self.action == "create":
            return OfficialCreateSerializer
        if self.action in {"partial_update", "update"}:
            return OfficialStatusSerializer
        return OfficialAccountSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = create_official_invitation(
                dean=request.user,
                validated_data=serializer.validated_data,
            )
        except (SMTPException, OSError):
            return Response({"detail": "The invitation email could not be sent. Please try again."}, status=503)
        return Response(
            OfficialAccountSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = OfficialStatusSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OfficialAccountSerializer(user).data)

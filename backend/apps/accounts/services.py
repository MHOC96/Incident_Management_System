import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.common.choices import AccountStatus, UserRole


@transaction.atomic
def create_official_invitation(*, dean, validated_data):
    token = secrets.token_urlsafe(48)
    expires_at = timezone.now() + timedelta(days=7)

    user = User.objects.create_user(
        email=validated_data["email"],
        password=secrets.token_urlsafe(32),
        name=validated_data["name"],
        phone=validated_data.get("phone", ""),
        role=UserRole.OFFICIAL,
        position=validated_data["position"],
        status=AccountStatus.INVITED,
    )
    user.set_unusable_password()
    user.is_active = False
    user.activation_token = token
    user.activation_token_expires_at = expires_at
    user.save(
        update_fields=[
            "password",
            "is_active",
            "activation_token",
            "activation_token_expires_at",
            "status",
            "updated_at",
        ]
    )

    activation_url = f"{settings.FRONTEND_URL.rstrip('/')}/activate?token={token}"
    send_mail(
        subject="Activate your USJ Incident Management official account",
        message=(
            f"Hello {user.name},\n\n"
            f"An official account has been created for you on the USJ Incident "
            f"Reporting & Resolution Management System.\n\n"
            f"Please activate your account and set your password using the link below:\n"
            f"{activation_url}\n\n"
            f"This link expires in 7 days.\n\n"
            f"University of Sri Jayewardenepura"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return user


@transaction.atomic
def activate_official_account(*, token: str, password: str) -> User:
    try:
        user = User.objects.select_for_update().get(
            activation_token=token,
            role=UserRole.OFFICIAL,
            status=AccountStatus.INVITED,
        )
    except User.DoesNotExist as exc:
        raise ValueError("Invalid or expired activation link.") from exc

    if not user.activation_token_expires_at or user.activation_token_expires_at < timezone.now():
        raise ValueError("This activation link has expired.")

    user.set_password(password)
    user.status = AccountStatus.ACTIVE
    user.is_active = True
    user.activation_token = ""
    user.activation_token_expires_at = None
    user.save(
        update_fields=[
            "password",
            "status",
            "is_active",
            "activation_token",
            "activation_token_expires_at",
            "updated_at",
        ]
    )
    return user

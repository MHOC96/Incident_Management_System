from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed

from apps.accounts.auth import account_is_allowed
from apps.accounts.models import User
from apps.common.choices import AccountStatus, UserRole
from apps.common.validators import (
    validate_account_password,
    validate_mc_number,
    validate_sri_lanka_phone,
)


class UserSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "name", "role", "position"]
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "mc_number",
            "role",
            "position",
            "status",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "mc_number",
            "role",
            "position",
            "status",
            "created_at",
        ]

    def validate_phone(self, value):
        if not value:
            return ""
        try:
            return validate_sri_lanka_phone(value, required=False)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False, allow_blank=True)
    mc_number = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    default_error_messages = {
        "no_active_account": "No active account found with the given credentials",
    }

    def validate(self, attrs):
        email = (attrs.get("email") or "").strip()
        mc_number = (attrs.get("mc_number") or "").strip()
        password = attrs.get("password") or ""

        if email and mc_number:
            raise serializers.ValidationError(
                "Use MC number for student sign-in or email for staff sign-in, not both."
            )
        if not email and not mc_number:
            raise serializers.ValidationError(
                "Enter your MC number or staff email."
            )

        user = None
        if mc_number:
            try:
                normalized = validate_mc_number(mc_number)
            except ValueError as exc:
                raise serializers.ValidationError({"mc_number": str(exc)}) from exc
            user = User.objects.filter(
                mc_number=normalized,
                role=UserRole.STUDENT,
            ).first()
        else:
            user = (
                User.objects.filter(email__iexact=email)
                .exclude(role=UserRole.STUDENT)
                .first()
            )

        # Match password hashing cost for unknown accounts.
        if user is None:
            User().set_password(password)
        if not user or not user.check_password(password) or not account_is_allowed(user):
            raise AuthenticationFailed(
                self.default_error_messages["no_active_account"],
                code="no_active_account",
            )

        return {"user": user}


class StudentPasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if getattr(user, "role", None) != UserRole.STUDENT:
            raise serializers.ValidationError("Only students can change a password here.")
        if not user.check_password(attrs["current_password"]):
            raise serializers.ValidationError(
                {"current_password": "Current password is incorrect."}
            )
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Passwords do not match."}
            )
        if user.check_password(attrs["new_password"]):
            raise serializers.ValidationError(
                {"new_password": "Choose a password that is different from the current one."}
            )
        try:
            attrs["new_password"] = validate_account_password(attrs["new_password"])
        except ValueError as exc:
            raise serializers.ValidationError({"new_password": str(exc)}) from exc
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        return user


class OfficialCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "name",
            "email",
            "phone",
            "position",
        ]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_phone(self, value):
        if not value:
            return ""
        try:
            return validate_sri_lanka_phone(value, required=False)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc


class OfficialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "position",
            "status",
            "created_at",
        ]
        read_only_fields = fields


class OfficialStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["status"]

    def validate_status(self, value):
        if value not in {AccountStatus.ACTIVE, AccountStatus.INACTIVE}:
            raise serializers.ValidationError("Only active or inactive status is allowed.")
        return value

    def update(self, instance, validated_data):
        instance.status = validated_data["status"]
        instance.is_active = instance.status == AccountStatus.ACTIVE
        instance.save(update_fields=["status", "is_active", "updated_at"])
        return instance


class OfficialActivateSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(required=True, min_length=8)
    password_confirm = serializers.CharField(required=True, min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            attrs["password"] = validate_account_password(attrs["password"])
        except ValueError as exc:
            raise serializers.ValidationError({"password": str(exc)}) from exc
        return attrs

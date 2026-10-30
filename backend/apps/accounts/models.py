from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

from apps.common.choices import AccountStatus, OfficialPosition, UserRole
from apps.common.validators import normalize_mc_number


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.STUDENT)
        extra_fields.setdefault("status", AccountStatus.ACTIVE)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("role", UserRole.SYSADMIN)
        extra_fields.setdefault("status", AccountStatus.ACTIVE)
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None

    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    mc_number = models.CharField(max_length=50, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT)
    position = models.CharField(
        max_length=30,
        choices=OfficialPosition.choices,
        blank=True,
        null=True,
    )
    status = models.CharField(
        max_length=20,
        choices=AccountStatus.choices,
        default=AccountStatus.ACTIVE,
    )
    activation_token = models.CharField(max_length=128, blank=True)
    activation_token_expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["status"]),
            models.Index(fields=["mc_number"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["mc_number"],
                condition=~models.Q(mc_number=""),
                name="unique_nonempty_mc_number",
            ),
        ]

    def save(self, *args, **kwargs):
        if self.mc_number:
            self.mc_number = normalize_mc_number(self.mc_number)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.email})"

    @property
    def is_student(self):
        return self.role == UserRole.STUDENT

    @property
    def is_admin(self):
        return self.role == UserRole.ADMIN

    @property
    def is_management(self):
        return self.role == UserRole.MANAGEMENT

    @property
    def is_authority(self):
        return self.role == UserRole.AUTHORITY

    @property
    def is_dean(self):
        return self.is_management

    @property
    def is_official(self):
        return self.is_authority

    @property
    def is_active_account(self):
        return self.status == AccountStatus.ACTIVE and self.is_active

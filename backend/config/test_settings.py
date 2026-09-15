"""Isolated local test database; never connects to the deployment database."""
from .settings import *  # noqa: F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
SECURE_SSL_REDIRECT = False
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

User = get_user_model()


class SessionSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(email="session@example.com", password="Secure123Pass", name="Admin", role="ADMIN")
        self.client = APIClient(enforce_csrf_checks=True)
        self.payload = {"email": self.user.email, "password": "Secure123Pass"}

    def sign_in(self):
        token = self.client.get("/api/auth/session/").json()["csrfToken"]
        response = self.client.post("/api/auth/login/", self.payload, format="json", HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code, 200)
        return response.json()["csrfToken"]

    def test_login_requires_csrf_even_when_anonymous(self):
        self.assertEqual(self.client.post("/api/auth/login/", self.payload, format="json").status_code, 403)

    def test_logout_invalidates_stolen_session_cookie(self):
        csrf = self.sign_in()
        cookie = self.client.cookies[settings.SESSION_COOKIE_NAME]
        self.assertTrue(cookie["httponly"])
        stolen = cookie.value
        self.assertTrue(Session.objects.filter(session_key=stolen).exists())
        self.assertEqual(self.client.post("/api/auth/logout/", HTTP_X_CSRFTOKEN=csrf).status_code, 200)
        self.assertFalse(Session.objects.filter(session_key=stolen).exists())
        attacker = APIClient()
        attacker.cookies[settings.SESSION_COOKIE_NAME] = stolen
        self.assertEqual(attacker.get("/api/auth/profile/").status_code, 401)

    def test_logout_and_updates_require_csrf(self):
        self.sign_in()
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 403)
        self.assertEqual(self.client.patch("/api/auth/profile/", {"name": "Changed"}, format="json").status_code, 403)

    def test_untrusted_origin_rejected(self):
        token = self.client.get("/api/auth/session/").json()["csrfToken"]
        response = self.client.post("/api/auth/login/", self.payload, format="json", HTTP_X_CSRFTOKEN=token, HTTP_ORIGIN="https://evil.example")
        self.assertEqual(response.status_code, 403)

    def test_suspended_session_cannot_access_api(self):
        self.sign_in()
        self.user.status = "SUSPENDED"
        self.user.save()
        self.assertEqual(self.client.get("/api/incidents/").status_code, 401)

    def test_session_responses_not_cached_and_no_tokens_returned(self):
        self.sign_in()
        response = self.client.get("/api/auth/session/")
        self.assertIn("no-store", response["Cache-Control"])
        self.assertNotIn("access", response.json())
        self.assertNotIn("refresh", response.json())

    def test_legacy_refresh_endpoint_removed(self):
        self.assertEqual(self.client.post("/api/auth/refresh/", {"refresh": "old"}).status_code, 404)

    @override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.db.DatabaseCache", "LOCATION": "application_cache"}})
    def test_shared_throttle_cache_table_is_available(self):
        cache.set("session-test", "available", timeout=10)
        self.assertEqual(cache.get("session-test"), "available")
        cache.delete("session-test")

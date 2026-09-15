from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.student_email import student_email_from_mc
from apps.common.choices import AccountStatus, IncidentStatus, UserRole
from apps.common.authorization import user_can_admin_review_incident, user_can_close_incident
from apps.incidents.models import Category, Incident, Location
from apps.incidents.services import admin_verify_and_forward
from apps.notifications.models import Notification

User = get_user_model()


class StudentEmailTests(TestCase):
    def test_student_email_from_mc(self):
        self.assertEqual(student_email_from_mc("112257"), "112257@mgt.sjp.ac.lk")
        self.assertEqual(student_email_from_mc(" mc 99 "), "mc99@mgt.sjp.ac.lk")


class PermissionFoundationTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            email="student@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
        )
        self.admin = User.objects.create_user(
            email="admin@usj.lk",
            password="testpass123",
            name="Test Admin",
            role=UserRole.ADMIN,
        )
        self.dean = User.objects.create_user(
            email="dean@usj.lk",
            password="testpass123",
            name="Test Dean",
            role=UserRole.DEAN,
        )
        category = Category.objects.create(name="Maintenance", slug="maintenance")
        location = Location.objects.create(name="Block B")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00001",
            title="Broken door",
            description="Door is damaged",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.UNDER_REVIEW,
        )

    def test_student_cannot_review_incident(self):
        self.assertFalse(user_can_admin_review_incident(self.student, self.incident))

    def test_admin_can_review_submitted_incident(self):
        self.incident.status = IncidentStatus.SUBMITTED
        self.assertTrue(user_can_admin_review_incident(self.admin, self.incident))

    def test_admin_can_review_under_review_incident(self):
        self.assertTrue(user_can_admin_review_incident(self.admin, self.incident))

    def test_student_cannot_close_incident(self):
        self.incident.status = IncidentStatus.RESOLVED
        self.assertFalse(user_can_close_incident(self.student, self.incident))

    def test_dean_can_close_resolved_incident(self):
        self.incident.status = IncidentStatus.RESOLVED
        self.assertTrue(user_can_close_incident(self.dean, self.incident))


class AdminReviewFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
        )
        self.admin = User.objects.create_user(
            email="admin@usj.lk",
            password="testpass123",
            name="Test Admin",
            role=UserRole.ADMIN,
        )
        category = Category.objects.create(name="Maintenance", slug="maintenance")
        location = Location.objects.create(name="Block B")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00002",
            title="Broken tap",
            description="Tap is leaking",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.SUBMITTED,
        )
        self.client.force_authenticate(user=self.admin)

    def test_verify_forwards_incident_to_dean(self):
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/verify/",
            {"comment": "Verified for action."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.FORWARDED_TO_DEAN)
        self.assertIsNotNone(self.incident.verified_at)
        self.assertTrue(
            Notification.objects.filter(
                user=self.student,
                related_incident=self.incident,
            ).exists()
        )

    def test_reject_requires_comment(self):
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/reject/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_reject_marks_incident_rejected(self):
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/reject/",
            {"comment": "Insufficient evidence provided."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.REJECTED)

    def test_pending_review_lists_submitted_incidents(self):
        response = self.client.get("/api/incidents/pending-review/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

    def test_admin_verify_service_chain(self):
        admin_verify_and_forward(self.incident, verified_at=timezone.now())
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.FORWARDED_TO_DEAN)


class AuthEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_student_registration_is_disabled(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "name": "Bad Actor",
                "email": "bad@usj.lk",
                "phone": "+94770000000",
                "mc_number": "MC123",
                "password": "securepass1",
                "password_confirm": "securepass1",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_student_logs_in_with_mc_and_cpm(self):
        User.objects.create_user(
            email="112257@mgt.sjp.ac.lk",
            password="25660",
            name="Student 112257",
            role=UserRole.STUDENT,
            mc_number="112257",
        )
        response = self.client.post(
            "/api/auth/login/",
            {"mc_number": "112257", "password": "25660"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("user", response.json())
        self.assertNotIn("access", response.json())

    def test_student_cannot_log_in_with_email(self):
        User.objects.create_user(
            email="112257@mgt.sjp.ac.lk",
            password="25660",
            name="Student 112257",
            role=UserRole.STUDENT,
            mc_number="112257",
        )
        response = self.client.post(
            "/api/auth/login/",
            {"email": "112257@mgt.sjp.ac.lk", "password": "25660"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_student_can_change_password(self):
        student = User.objects.create_user(
            email="112208@mgt.sjp.ac.lk",
            password="25661",
            name="Student 112208",
            role=UserRole.STUDENT,
            mc_number="112208",
        )
        self.client.force_authenticate(user=student)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "25661",
                "new_password": "CampusPass1",
                "new_password_confirm": "CampusPass1",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.client.force_authenticate(user=None)
        old_login = self.client.post(
            "/api/auth/login/",
            {"mc_number": "112208", "password": "25661"},
            format="json",
        )
        self.assertEqual(old_login.status_code, 401)
        new_login = self.client.post(
            "/api/auth/login/",
            {"mc_number": "112208", "password": "CampusPass1"},
            format="json",
        )
        self.assertEqual(new_login.status_code, 200)

    def test_staff_change_password_endpoint_is_student_only(self):
        admin = User.objects.create_user(
            email="admin-password@usj.lk",
            password="testpass123",
            name="Test Admin",
            role=UserRole.ADMIN,
        )
        self.client.force_authenticate(user=admin)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "current_password": "testpass123",
                "new_password": "CampusPass1",
                "new_password_confirm": "CampusPass1",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_inactive_official_cannot_login(self):
        official = User.objects.create_user(
            email="official@usj.lk",
            password="testpass123",
            name="Test Official",
            role=UserRole.OFFICIAL,
        )
        official.status = AccountStatus.INACTIVE
        official.save(update_fields=["status", "updated_at"])

        response = self.client.post(
            "/api/auth/login/",
            {"email": "official@usj.lk", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_deactivating_official_blocks_login(self):
        dean = User.objects.create_user(
            email="dean@usj.lk",
            password="testpass123",
            name="Test Dean",
            role=UserRole.DEAN,
        )
        official = User.objects.create_user(
            email="official2@usj.lk",
            password="testpass123",
            name="Test Official",
            role=UserRole.OFFICIAL,
        )
        self.client.force_authenticate(user=dean)
        response = self.client.patch(
            f"/api/officials/{official.id}/",
            {"status": AccountStatus.INACTIVE},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        official.refresh_from_db()
        self.assertFalse(official.is_active)

        self.client.force_authenticate(user=None)
        response = self.client.post(
            "/api/auth/login/",
            {"email": "official2@usj.lk", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_profile_cannot_change_mc_number(self):
        student = User.objects.create_user(
            email="student-profile@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
            mc_number="MC999",
            phone="+94771111111",
        )
        self.client.force_authenticate(user=student)
        response = self.client.patch(
            "/api/auth/profile/",
            {"mc_number": "MC000", "name": "Updated Student"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        student.refresh_from_db()
        self.assertEqual(student.mc_number, "MC999")
        self.assertEqual(student.name, "Updated Student")

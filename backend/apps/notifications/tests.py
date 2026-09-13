from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.assignments.services import assign_incident
from apps.common.choices import IncidentStatus, NotificationType, UserRole
from apps.incidents.models import Category, Incident, Location
from apps.notifications.models import Notification

User = get_user_model()


class NotificationFlowTests(TestCase):
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
        self.dean = User.objects.create_user(
            email="dean@usj.lk",
            password="testpass123",
            name="Test Dean",
            role=UserRole.DEAN,
        )
        self.official = User.objects.create_user(
            email="official@usj.lk",
            password="testpass123",
            name="Test Official",
            role=UserRole.OFFICIAL,
        )
        category = Category.objects.create(name="Maintenance", slug="maintenance")
        location = Location.objects.create(name="Block B")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00020",
            title="Broken window",
            description="Window is cracked",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.SUBMITTED,
        )

    def test_incident_submission_notifies_admins(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            "/api/incidents/",
            {
                "title": "New leak",
                "description": "Water leaking in corridor",
                "category": self.incident.category_id,
                "location": self.incident.location_id,
                "visibility": "PRIVATE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            Notification.objects.filter(
                user=self.admin,
                notification_type=NotificationType.INCIDENT_SUBMITTED,
            ).exists()
        )

    def test_mark_notification_read(self):
        notification = Notification.objects.create(
            user=self.student,
            title="Test",
            message="Test message",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
            related_incident=self.incident,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.patch(
            f"/api/notifications/{notification.id}/",
            {"is_read": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_unread_count(self):
        Notification.objects.create(
            user=self.student,
            title="Unread",
            message="Unread message",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
            related_incident=self.incident,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/notifications/unread-count/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 1)

    def test_mark_all_notifications_read(self):
        Notification.objects.create(
            user=self.student,
            title="Unread one",
            message="First unread message",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
            related_incident=self.incident,
        )
        Notification.objects.create(
            user=self.student,
            title="Unread two",
            message="Second unread message",
            notification_type=NotificationType.INCIDENT_STATUS_CHANGED,
            related_incident=self.incident,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.post("/api/notifications/mark-all-read/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["updated"], 2)
        self.assertEqual(
            Notification.objects.filter(user=self.student, is_read=False).count(),
            0,
        )

    def test_dean_can_reopen_resolved_incident(self):
        self.incident.status = IncidentStatus.FORWARDED_TO_DEAN
        self.incident.save(update_fields=["status", "updated_at"])
        assign_incident(
            self.incident,
            assigned_official=self.official,
            assigned_by=self.dean,
        )
        self.incident.status = IncidentStatus.RESOLVED
        self.incident.save(update_fields=["status", "updated_at"])

        self.client.force_authenticate(user=self.dean)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/reopen/",
            {"comment": "Please finish remaining repairs."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.IN_PROGRESS)
        self.assertEqual(self.incident.reopen_reason, "Please finish remaining repairs.")

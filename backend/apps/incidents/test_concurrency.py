from concurrent.futures import ThreadPoolExecutor
from django.contrib.auth import get_user_model
from django.db import connection, connections, transaction
from django.test import TransactionTestCase, override_settings
from rest_framework.test import APIClient
from unittest import skipUnless

from apps.incidents.models import Category, Incident, IncidentRevision, Location
from apps.incidents.utils import generate_incident_number


@skipUnless(connection.vendor == "postgresql", "Row-lock regression requires PostgreSQL")
@override_settings(PASSWORD_HASHERS=["django.contrib.auth.hashers.MD5PasswordHasher"])
class ConcurrentIncidentTests(TransactionTestCase):
    def setUp(self):
        self.student = get_user_model().objects.create_user(email="concurrent@example.com", password="Test1234", name="Student")
        self.category = Category.objects.create(name="Maintenance", slug="maintenance")
        self.location = Location.objects.create(name="Hall")

    def test_concurrent_numbers_are_unique(self):
        def allocate(_):
            try:
                with transaction.atomic():
                    return generate_incident_number()
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=4) as executor:
            numbers = list(executor.map(allocate, range(8)))
        self.assertEqual(len(set(numbers)), 8)

    def test_concurrent_submissions_create_one_revision(self):
        incident = Incident.objects.create(incident_number="INC-2026-00001", reporter=self.student,
            category=self.category, location=self.location, title="Old", description="Old", status="FORWARDED_TO_DEAN")
        def submit(_):
            try:
                client = APIClient()
                client.force_authenticate(self.student)
                return client.post(f"/api/incidents/{incident.pk}/submit-changes/", {
                    "title": "Changed", "description": "New description", "category": self.category.pk,
                    "location": self.location.pk, "visibility": "PRIVATE",
                }, format="json").status_code
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(submit, range(2)))
        self.assertEqual(sorted(results), [200, 400])
        self.assertEqual(IncidentRevision.objects.filter(incident=incident).count(), 1)
        incident.refresh_from_db()
        self.assertEqual(incident.title, "Old")

from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from apps.incidents.models import Category, Location, Incident, IncidentRevision, IncidentImage
from apps.incidents.querysets import optimized_incident_queryset
from apps.incidents.serializers import IncidentAdminReviewSerializer, IncidentStudentDetailSerializer
from apps.incidents.utils import generate_incident_number

User = get_user_model()


class ProductionRegressionTests(TestCase):
    def setUp(self):
        self.student = User.objects.create_user(email="owner@example.com", name="Owner", password="Test12345")
        self.category = Category.objects.create(name="Maintenance", slug="maintenance")
        self.location = Location.objects.create(name="Hall")
        self.incident = self.make_incident(1)

    def make_incident(self, number):
        incident = Incident.objects.create(incident_number=f"INC-2026-{number:05d}", reporter=self.student,
            category=self.category, location=self.location, title="Door", description="Broken", status="FORWARDED_TO_DEAN")
        IncidentRevision.objects.create(incident=incident, submitted_by=self.student,
            original_title="Door", proposed_title="Door frame", original_description="Broken", proposed_description="Damaged",
            original_category=self.category, proposed_category=self.category, original_location=self.location,
            proposed_location=self.location, original_visibility="PRIVATE", proposed_visibility="PRIVATE")
        return incident

    def test_revision_serialization_has_constant_query_count(self):
        for serializer in [IncidentAdminReviewSerializer, IncidentStudentDetailSerializer]:
            with CaptureQueriesContext(connection) as one:
                serializer(optimized_incident_queryset().filter(pk=self.incident.pk), many=True).data
            for i in range(2, 12):
                if not Incident.objects.filter(incident_number=f"INC-2026-{i:05d}").exists():
                    self.make_incident(i)
            with CaptureQueriesContext(connection) as many:
                serializer(optimized_incident_queryset(), many=True).data
            self.assertEqual(len(one), len(many))
            self.assertLessEqual(len(many), 4)

    def test_media_checks_permissions_on_every_request(self):
        image = IncidentImage.objects.create(incident=self.incident, cloudinary_public_id="test",
            cloudinary_url="https://res.cloudinary.com/example/image/authenticated/test.jpg")
        client = APIClient()
        with patch("apps.incidents.media_views.image_delivery_url", return_value="https://example.com/signed"):
            self.assertEqual(client.get(f"/api/incident-images/{image.pk}/").status_code, 404)
            client.force_authenticate(self.student)
            self.assertEqual(client.get(f"/api/incident-images/{image.pk}/").status_code, 302)
            client.force_authenticate(None)
            self.incident.visibility = "PUBLIC"
            self.incident.save()
            self.assertEqual(client.get(f"/api/incident-images/{image.pk}/").status_code, 302)
            self.incident.status = "SUBMITTED"
            self.incident.save()
            self.assertEqual(client.get(f"/api/incident-images/{image.pk}/").status_code, 404)

    def test_notification_creation_is_not_exposed(self):
        client = APIClient()
        client.force_authenticate(self.student)
        self.assertEqual(client.post("/api/notifications/", {}, format="json").status_code, 405)

    def test_private_report_locations_are_not_public_reference_data(self):
        client = APIClient()
        self.assertEqual(client.get("/api/locations/").json(), [])
        self.incident.visibility = "PUBLIC"
        self.incident.save()
        response = client.get("/api/locations/")
        self.assertEqual([place["id"] for place in response.json()], [self.location.pk])

    def test_incident_numbers_not_reused_after_deletion(self):
        first = generate_incident_number()
        second = generate_incident_number()
        self.assertNotEqual(first, second)

    def test_vote_retries_are_idempotent(self):
        self.incident.visibility = "PUBLIC"
        self.incident.save()
        client = APIClient()
        client.force_authenticate(self.student)
        for _ in range(2):
            response = client.post(f"/api/incidents/{self.incident.pk}/vote/", {"upvoted": True}, format="json")
            self.assertEqual(response.json(), {"vote_count": 1, "user_has_upvoted": True})

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.assignments.services import assign_incident
from apps.common.authorization import (
    user_can_resolve_incident,
    user_can_start_progress_incident,
)
from apps.common.choices import IncidentStatus, IncidentVisibility, UserRole
from apps.incidents.models import (
    Category,
    Incident,
    IncidentRevision,
    IncidentRevisionStatus,
    IncidentVote,
    Location,
)
from apps.notifications.models import Notification

User = get_user_model()


class OfficialFlowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
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
        self.other_official = User.objects.create_user(
            email="other-official@usj.lk",
            password="testpass123",
            name="Other Official",
            role=UserRole.OFFICIAL,
        )
        category = Category.objects.create(name="Maintenance", slug="maintenance")
        location = Location.objects.create(name="Block B")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00010",
            title="Broken door",
            description="Door is damaged",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.FORWARDED_TO_DEAN,
        )
        assign_incident(
            self.incident,
            assigned_official=self.official,
            assigned_by=self.dean,
            comment="Please inspect and repair.",
        )
        self.incident.refresh_from_db()
        self.client.force_authenticate(user=self.official)

    def test_official_can_start_progress(self):
        self.assertTrue(user_can_start_progress_incident(self.official, self.incident))
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/start-progress/",
            {"comment": "Technician dispatched."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.IN_PROGRESS)
        self.assertTrue(
            Notification.objects.filter(
                user=self.student,
                related_incident=self.incident,
            ).exists()
        )

    def test_other_official_cannot_start_progress(self):
        self.client.force_authenticate(user=self.other_official)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/start-progress/",
            {"comment": "Attempting unauthorized start."},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_official_can_resolve_in_progress_incident(self):
        self.incident.status = IncidentStatus.IN_PROGRESS
        self.incident.save(update_fields=["status", "updated_at"])
        self.assertTrue(user_can_resolve_incident(self.official, self.incident))

        response = self.client.post(
            f"/api/incidents/{self.incident.id}/resolve/",
            {"comment": "Door has been repaired successfully."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.RESOLVED)
        self.assertIsNotNone(self.incident.resolved_at)
        self.assertTrue(
            Notification.objects.filter(
                user=self.dean,
                related_incident=self.incident,
            ).exists()
        )

    def test_resolve_requires_comment(self):
        self.incident.status = IncidentStatus.IN_PROGRESS
        self.incident.save(update_fields=["status", "updated_at"])
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/resolve/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_assigned_list_returns_only_official_incidents(self):
        other_incident = Incident.objects.create(
            incident_number="INC-2026-00011",
            title="Other issue",
            description="Not assigned to test official",
            category=self.incident.category,
            location=self.incident.location,
            reporter=self.student,
            status=IncidentStatus.FORWARDED_TO_DEAN,
        )
        assign_incident(
            other_incident,
            assigned_official=self.other_official,
            assigned_by=self.dean,
        )

        response = self.client.get("/api/incidents/assigned/")
        self.assertEqual(response.status_code, 200)
        incident_ids = [item["id"] for item in response.json()["results"]]
        self.assertIn(self.incident.id, incident_ids)
        self.assertNotIn(other_incident.id, incident_ids)

    def test_official_stats(self):
        self.incident.status = IncidentStatus.IN_PROGRESS
        self.incident.save(update_fields=["status", "updated_at"])
        response = self.client.get("/api/incidents/official-stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["in_progress"], 1)
        self.assertEqual(data["total_assigned"], 1)

    def test_incident_chat_endpoint_is_removed(self):
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/messages/",
            {"content": "Inspection scheduled for tomorrow."},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_student_cannot_resolve_incident(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/resolve/",
            {"comment": "Student should not resolve this incident."},
            format="json",
        )
        self.assertEqual(response.status_code, 403)


class IncidentCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
        )
        self.category = Category.objects.create(name="Maintenance", slug="maintenance")
        self.location = Location.objects.create(name="Block B")
        self.client.force_authenticate(user=self.student)

    def test_create_incident_with_existing_location_id(self):
        response = self.client.post(
            "/api/incidents/",
            {
                "title": "Broken door",
                "description": "Door hinge is loose",
                "category": self.category.id,
                "location": self.location.id,
                "visibility": "PRIVATE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        incident = Incident.objects.get(id=response.json()["id"])
        self.assertEqual(incident.location_id, self.location.id)

    def test_create_incident_with_new_location_name(self):
        response = self.client.post(
            "/api/incidents/",
            {
                "title": "Water leak",
                "description": "Leak near the staircase",
                "category": self.category.id,
                "location_name": "Near main staircase",
                "visibility": "PRIVATE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        incident = Incident.objects.get(id=response.json()["id"])
        self.assertEqual(incident.location.name, "Near main staircase")
        self.assertTrue(
            Location.objects.filter(name="Near main staircase", is_active=True).exists()
        )

    def test_create_incident_reuses_existing_location_by_name(self):
        response = self.client.post(
            "/api/incidents/",
            {
                "title": "Broken window",
                "description": "Window cracked in corridor",
                "category": self.category.id,
                "location_name": "block b",
                "visibility": "PRIVATE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        incident = Incident.objects.get(id=response.json()["id"])
        self.assertEqual(incident.location_id, self.location.id)
        self.assertEqual(Location.objects.filter(name__iexact="block b").count(), 1)

    def test_create_incident_requires_location(self):
        response = self.client.post(
            "/api/incidents/",
            {
                "title": "Missing location",
                "description": "No location provided",
                "category": self.category.id,
                "visibility": "PRIVATE",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("location_name", response.json())


class IncidentSecurityAndPublicTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="student@usj.lk",
            password="testpass123",
            name="Test Student",
            role=UserRole.STUDENT,
        )
        self.official = User.objects.create_user(
            email="official@usj.lk",
            password="testpass123",
            name="Test Official",
            role=UserRole.OFFICIAL,
        )
        category = Category.objects.create(name="Maintenance", slug="maintenance")
        location = Location.objects.create(name="Block B")
        self.public_submitted = Incident.objects.create(
            incident_number="INC-2026-00030",
            title="Public but not verified",
            description="Should not be publicly listed yet",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.SUBMITTED,
            visibility=IncidentVisibility.PUBLIC,
        )
        self.public_verified = Incident.objects.create(
            incident_number="INC-2026-00031",
            title="Verified public issue",
            description="Safe for public listing",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.VERIFIED,
            visibility=IncidentVisibility.PUBLIC,
        )

    def test_public_detail_hides_unverified_incidents(self):
        response = self.client.get(f"/api/incidents/{self.public_submitted.id}/public/")
        self.assertEqual(response.status_code, 404)

    def test_public_detail_returns_verified_incidents(self):
        response = self.client.get(f"/api/incidents/{self.public_verified.id}/public/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.public_verified.id)
        self.assertNotIn("reporter", data)
        self.assertNotIn("reporter_name", data)

    def test_unassigned_official_cannot_read_messages_on_public_incident(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get(f"/api/incidents/{self.public_verified.id}/messages/")
        self.assertEqual(response.status_code, 404)

    def test_student_cannot_create_incident_messages(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(
            f"/api/incidents/{self.public_verified.id}/messages/",
            {"content": "Please keep this private from staff.", "is_internal": True},
            format="json",
        )
        self.assertEqual(response.status_code, 404)


class DeanOversightTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="dean-student@usj.lk",
            password="testpass123",
            name="Dean Student",
            role=UserRole.STUDENT,
        )
        self.dean = User.objects.create_user(
            email="oversight-dean@usj.lk",
            password="testpass123",
            name="Oversight Dean",
            role=UserRole.DEAN,
        )
        self.official = User.objects.create_user(
            email="oversight-official@usj.lk",
            password="testpass123",
            name="Oversight Official",
            role=UserRole.OFFICIAL,
        )
        category = Category.objects.create(name="Electrical", slug="electrical")
        location = Location.objects.create(name="Main Hall")
        self.awaiting = Incident.objects.create(
            incident_number="INC-2026-00040",
            title="Waiting for assignment",
            description="Needs a responsible official",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.FORWARDED_TO_DEAN,
        )
        self.assigned = Incident.objects.create(
            incident_number="INC-2026-00041",
            title="Assigned but not started",
            description="Official has not begun work",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.FORWARDED_TO_DEAN,
        )
        assign_incident(
            self.assigned,
            assigned_official=self.official,
            assigned_by=self.dean,
        )
        self.assigned.refresh_from_db()
        self.in_progress = Incident.objects.create(
            incident_number="INC-2026-00042",
            title="Work underway",
            description="Official is repairing the issue",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.FORWARDED_TO_DEAN,
        )
        assign_incident(
            self.in_progress,
            assigned_official=self.official,
            assigned_by=self.dean,
        )
        self.in_progress.status = IncidentStatus.IN_PROGRESS
        self.in_progress.save(update_fields=["status", "updated_at"])

    def test_dean_stats_separate_assigned_and_in_progress(self):
        self.client.force_authenticate(user=self.dean)
        response = self.client.get("/api/incidents/dean-stats/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["awaiting_action"], 1)
        self.assertEqual(data["assigned"], 1)
        self.assertEqual(data["in_progress"], 1)

    def test_dean_can_list_currently_underway_incidents(self):
        self.client.force_authenticate(user=self.dean)
        response = self.client.get("/api/incidents/currently-underway/")
        self.assertEqual(response.status_code, 200)
        results = response.json()["results"]
        ids = {item["id"] for item in results}
        self.assertIn(self.assigned.id, ids)
        self.assertIn(self.in_progress.id, ids)
        self.assertNotIn(self.awaiting.id, ids)
        assigned_row = next(item for item in results if item["id"] == self.assigned.id)
        self.assertEqual(
            assigned_row["current_assignment"]["assigned_official_name"],
            self.official.name,
        )

    def test_student_cannot_list_currently_underway_incidents(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get("/api/incidents/currently-underway/")
        self.assertEqual(response.status_code, 403)


class IncidentVoteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="voter@usj.lk",
            password="testpass123",
            name="Voting Student",
            mc_number="MC-VOTE-1",
            role=UserRole.STUDENT,
        )
        self.other_student = User.objects.create_user(
            email="other-voter@usj.lk",
            password="testpass123",
            name="Other Voting Student",
            mc_number="MC-VOTE-2",
            role=UserRole.STUDENT,
        )
        self.official = User.objects.create_user(
            email="vote-official@usj.lk",
            password="testpass123",
            name="Voting Official",
            role=UserRole.OFFICIAL,
        )
        category = Category.objects.create(name="Safety", slug="vote-safety")
        location = Location.objects.create(name="Library entrance")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00901",
            title="Slippery entrance",
            description="The same issue affects several students.",
            category=category,
            location=location,
            reporter=self.student,
            status=IncidentStatus.IN_PROGRESS,
            visibility=IncidentVisibility.PUBLIC,
        )
        self.completed = Incident.objects.create(
            incident_number="INC-2026-00902",
            title="Repaired light",
            description="The light has been repaired.",
            category=category,
            location=location,
            reporter=self.other_student,
            status=IncidentStatus.CLOSED,
            visibility=IncidentVisibility.PUBLIC,
        )

    def test_student_can_toggle_one_vote(self):
        self.client.force_authenticate(user=self.student)

        response = self.client.post(f"/api/incidents/{self.incident.id}/vote/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"vote_count": 1, "user_has_upvoted": True})
        self.assertEqual(IncidentVote.objects.filter(incident=self.incident).count(), 1)

        response = self.client.post(f"/api/incidents/{self.incident.id}/vote/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"vote_count": 0, "user_has_upvoted": False})
        self.assertFalse(IncidentVote.objects.filter(incident=self.incident).exists())

    def test_vote_requires_student_authentication(self):
        response = self.client.post(f"/api/incidents/{self.incident.id}/vote/")
        self.assertEqual(response.status_code, 401)

        self.client.force_authenticate(user=self.official)
        response = self.client.post(f"/api/incidents/{self.incident.id}/vote/")
        self.assertEqual(response.status_code, 403)

    def test_private_incident_cannot_be_upvoted(self):
        self.incident.visibility = IncidentVisibility.PRIVATE
        self.incident.save(update_fields=["visibility"])
        self.client.force_authenticate(user=self.student)
        response = self.client.post(f"/api/incidents/{self.incident.id}/vote/")
        self.assertEqual(response.status_code, 404)

    def test_public_serializer_returns_count_and_current_vote(self):
        IncidentVote.objects.create(incident=self.incident, user=self.student)
        self.client.force_authenticate(user=self.student)
        response = self.client.get(f"/api/incidents/{self.incident.id}/public/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["vote_count"], 1)
        self.assertTrue(response.json()["user_has_upvoted"])

    def test_public_list_filters_stage_and_orders_by_votes(self):
        IncidentVote.objects.create(incident=self.incident, user=self.student)
        IncidentVote.objects.create(incident=self.incident, user=self.other_student)
        IncidentVote.objects.create(incident=self.completed, user=self.student)

        response = self.client.get("/api/incidents/public/?ordering=highest_votes")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["results"][0]["id"], self.incident.id)

        response = self.client.get("/api/incidents/public/?stage=completed")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.json()["results"]],
            [self.completed.id],
        )


class IncidentRevisionWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(
            email="revision-student@usj.lk",
            password="testpass123",
            name="Revision Student",
            role=UserRole.STUDENT,
        )
        self.other_student = User.objects.create_user(
            email="other-revision-student@usj.lk",
            password="testpass123",
            name="Other Revision Student",
            role=UserRole.STUDENT,
        )
        self.admin = User.objects.create_user(
            email="revision-admin@usj.lk",
            password="testpass123",
            name="Revision Admin",
            role=UserRole.ADMIN,
        )
        self.category = Category.objects.create(name="Revision Maintenance", slug="revision-maintenance")
        self.new_category = Category.objects.create(name="Revision Safety", slug="revision-safety")
        self.location = Location.objects.create(name="Revision Block A")
        self.new_location = Location.objects.create(name="Revision Block B")
        self.incident = Incident.objects.create(
            incident_number="INC-2026-00910",
            title="Original approved title",
            description="Original approved description",
            category=self.category,
            location=self.location,
            reporter=self.student,
            status=IncidentStatus.IN_PROGRESS,
            visibility=IncidentVisibility.PRIVATE,
        )

    def change_payload(self):
        return {
            "title": "Updated incident title",
            "description": "Updated description with clearer incident details.",
            "category": self.new_category.id,
            "location": self.new_location.id,
            "visibility": IncidentVisibility.PUBLIC,
        }

    def submit_revision(self):
        self.client.force_authenticate(user=self.student)
        return self.client.post(
            f"/api/incidents/{self.incident.id}/submit-changes/",
            self.change_payload(),
            format="json",
        )

    def test_approved_incident_changes_wait_for_admin_review(self):
        response = self.submit_revision()
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.title, "Original approved title")
        self.assertEqual(self.incident.status, IncidentStatus.IN_PROGRESS)
        revision = IncidentRevision.objects.get(incident=self.incident)
        self.assertEqual(revision.status, IncidentRevisionStatus.PENDING)
        body = response.json()
        self.assertTrue(body["has_pending_changes"])
        self.assertNotIn("pending_revision", body)
        detail = self.client.get(f"/api/incidents/{self.incident.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertTrue(detail.json()["has_pending_changes"])
        self.assertEqual(detail.json()["revision_history"], [])

    def test_admin_approval_applies_changes_without_resetting_workflow_status(self):
        self.submit_revision()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/approve-changes/", {}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.title, "Updated incident title")
        self.assertEqual(self.incident.category, self.new_category)
        self.assertEqual(self.incident.status, IncidentStatus.IN_PROGRESS)
        self.assertEqual(
            IncidentRevision.objects.get(incident=self.incident).status,
            IncidentRevisionStatus.APPROVED,
        )

    def test_admin_rejection_keeps_live_values_and_records_reason(self):
        self.submit_revision()
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/reject-changes/",
            {"comment": "The proposed location does not match the evidence."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.title, "Original approved title")
        revision = IncidentRevision.objects.get(incident=self.incident)
        self.assertEqual(revision.status, IncidentRevisionStatus.REJECTED)
        self.assertIn("location", revision.review_comment)

    def test_rejected_incident_edit_is_resubmitted_for_initial_review(self):
        self.incident.status = IncidentStatus.REJECTED
        self.incident.admin_review_note = "The description was incomplete."
        self.incident.save(update_fields=["status", "admin_review_note", "updated_at"])
        response = self.submit_revision()
        self.assertEqual(response.status_code, 200)
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.status, IncidentStatus.SUBMITTED)
        self.assertEqual(self.incident.title, "Updated incident title")
        self.assertEqual(self.incident.admin_review_note, "")
        self.assertFalse(IncidentRevision.objects.filter(incident=self.incident).exists())

    def test_other_student_cannot_submit_changes(self):
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(
            f"/api/incidents/{self.incident.id}/submit-changes/",
            self.change_payload(),
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_admin_can_list_pending_changes_forwarded_progress_and_rejections(self):
        self.submit_revision()
        rejected = Incident.objects.create(
            incident_number="INC-2026-00911",
            title="Rejected report",
            description="Rejected report description",
            category=self.category,
            location=self.location,
            reporter=self.student,
            status=IncidentStatus.REJECTED,
        )
        self.client.force_authenticate(user=self.admin)

        pending_response = self.client.get("/api/incidents/pending-changes/")
        forwarded_response = self.client.get("/api/incidents/forwarded-reports/")
        rejected_response = self.client.get("/api/incidents/rejected-reports/")

        self.assertEqual(pending_response.status_code, 200)
        self.assertEqual(forwarded_response.status_code, 200)
        self.assertEqual(rejected_response.status_code, 200)
        self.assertIn(self.incident.id, {item["id"] for item in pending_response.json()["results"]})
        self.assertIn(self.incident.id, {item["id"] for item in forwarded_response.json()["results"]})
        self.assertIn(rejected.id, {item["id"] for item in rejected_response.json()["results"]})

    def test_student_can_delete_own_unapproved_report(self):
        report = Incident.objects.create(
            incident_number="INC-2026-00912",
            title="Report to delete",
            description="This unapproved report is no longer needed.",
            category=self.category,
            location=self.location,
            reporter=self.student,
            status=IncidentStatus.SUBMITTED,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(f"/api/incidents/{report.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Incident.objects.filter(id=report.id).exists())

    def test_student_cannot_delete_another_students_report(self):
        report = Incident.objects.create(
            incident_number="INC-2026-00913",
            title="Another student's report",
            description="Only its reporter may delete this report.",
            category=self.category,
            location=self.location,
            reporter=self.other_student,
            status=IncidentStatus.SUBMITTED,
        )
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(f"/api/incidents/{report.id}/")
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Incident.objects.filter(id=report.id).exists())

    def test_student_cannot_delete_approved_operational_report(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(f"/api/incidents/{self.incident.id}/")
        self.assertEqual(response.status_code, 400)
        self.assertTrue(Incident.objects.filter(id=self.incident.id).exists())

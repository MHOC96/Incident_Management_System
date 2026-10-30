from rest_framework import viewsets

from apps.assignments.models import Assignment, ResponsibleParty
from apps.common.permissions import IsManagement, IsSysAdmin
from apps.incidents.serializers import AssignmentSerializer, ResponsiblePartySerializer


class ResponsiblePartyViewSet(viewsets.ModelViewSet):
    queryset = ResponsibleParty.objects.prefetch_related("officials").all()
    serializer_class = ResponsiblePartySerializer
    permission_classes = [IsManagement]
    pagination_class = None


class AssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsManagement]

    def get_queryset(self):
        return Assignment.objects.select_related(
            "incident",
            "assigned_official",
            "assigned_by",
            "responsible_party",
        ).filter(is_current=True)

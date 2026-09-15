from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from apps.common.authorization import user_can_view_incident
from apps.incidents.cloudinary_service import image_delivery_url
from apps.incidents.models import IncidentImage
from apps.incidents.querysets import PUBLIC_VISIBLE_STATUSES


class IncidentImageView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        image = get_object_or_404(IncidentImage.objects.select_related("incident"), pk=pk)
        incident = image.incident
        public = incident.visibility == "PUBLIC" and incident.status in PUBLIC_VISIBLE_STATUSES
        if not public and not user_can_view_incident(request.user, incident):
            raise NotFound()
        return HttpResponseRedirect(image_delivery_url(image))

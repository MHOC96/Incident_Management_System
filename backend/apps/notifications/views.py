from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.common.permissions import IsActiveUser
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationMarkReadSerializer, NotificationSerializer


class NotificationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsActiveUser]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user).select_related(
            "related_incident"
        )
        unread = self.request.query_params.get("unread")
        if unread == "true":
            queryset = queryset.filter(is_read=False)
        return queryset

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return NotificationMarkReadSerializer
        return NotificationSerializer

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"count": count})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True
        )
        return Response({"updated": updated})

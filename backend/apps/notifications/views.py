from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, READ_ONLY_ROLES, RoleActionPermission
from .models import NotificationTemplate
from .serializers import NotificationTemplateSerializer


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    queryset = NotificationTemplate.objects.all().order_by("key")
    serializer_class = NotificationTemplateSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": ADMIN_ROLES,
        "update": ADMIN_ROLES,
        "partial_update": ADMIN_ROLES,
        "destroy": ADMIN_ROLES,
    }

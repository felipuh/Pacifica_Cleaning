from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, OPERATIONS_ROLES, READ_ONLY_ROLES, RoleActionPermission
from .models import WorkerProfile
from .serializers import WorkerProfileSerializer


class WorkerProfileViewSet(viewsets.ModelViewSet):
    queryset = WorkerProfile.objects.all().order_by("full_name")
    serializer_class = WorkerProfileSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": OPERATIONS_ROLES,
        "update": OPERATIONS_ROLES,
        "partial_update": OPERATIONS_ROLES,
        "destroy": ADMIN_ROLES,
    }

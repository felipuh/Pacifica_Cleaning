from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, OPERATIONS_ROLES, QUALITY_ROLES, READ_ONLY_ROLES, RoleActionPermission
from .models import WorkOrder
from .serializers import WorkOrderSerializer


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related("customer", "property", "quote").prefetch_related("assignments").all()
    serializer_class = WorkOrderSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": OPERATIONS_ROLES,
        "update": OPERATIONS_ROLES | QUALITY_ROLES,
        "partial_update": OPERATIONS_ROLES | QUALITY_ROLES,
        "destroy": ADMIN_ROLES,
    }

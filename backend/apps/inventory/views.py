from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, OPERATIONS_ROLES, READ_ONLY_ROLES, RoleActionPermission
from .models import InventoryItem, StockMovement
from .serializers import InventoryItemSerializer, StockMovementSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by("name")
    serializer_class = InventoryItemSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": OPERATIONS_ROLES,
        "update": OPERATIONS_ROLES,
        "partial_update": OPERATIONS_ROLES,
        "destroy": ADMIN_ROLES,
    }


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related("item", "work_order").all()
    serializer_class = StockMovementSerializer
    permission_classes = [RoleActionPermission]
    action_roles = InventoryItemViewSet.action_roles

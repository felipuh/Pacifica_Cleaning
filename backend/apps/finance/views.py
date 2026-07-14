from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, FINANCE_ROLES, READ_ONLY_ROLES, RoleActionPermission
from .models import Expense, Payment
from .serializers import ExpenseSerializer, PaymentSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("customer", "work_order").all().order_by("-paid_at", "-created_at")
    serializer_class = PaymentSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": FINANCE_ROLES,
        "update": FINANCE_ROLES,
        "partial_update": FINANCE_ROLES,
        "destroy": ADMIN_ROLES,
    }


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.select_related("work_order").all().order_by("-incurred_at", "-created_at")
    serializer_class = ExpenseSerializer
    permission_classes = [RoleActionPermission]
    action_roles = PaymentViewSet.action_roles

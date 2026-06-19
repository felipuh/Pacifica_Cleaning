from rest_framework import viewsets

from apps.core.permissions import ADMIN_ROLES, READ_ONLY_ROLES, SALES_ROLES, RoleActionPermission
from .models import Campaign, Coupon
from .serializers import CampaignSerializer, CouponSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all().order_by("-starts_at")
    serializer_class = CampaignSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": SALES_ROLES,
        "update": SALES_ROLES,
        "partial_update": SALES_ROLES,
        "destroy": ADMIN_ROLES,
    }


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by("code")
    serializer_class = CouponSerializer
    permission_classes = [RoleActionPermission]
    action_roles = CampaignViewSet.action_roles

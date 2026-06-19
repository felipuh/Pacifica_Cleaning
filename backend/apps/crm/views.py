from rest_framework import permissions, viewsets
from rest_framework.throttling import AnonRateThrottle

from apps.core.permissions import READ_ONLY_ROLES, SALES_ROLES, RoleActionPermission
from .models import Contact, Customer, Lead, Property
from .serializers import ContactSerializer, CustomerSerializer, LeadSerializer, PropertySerializer, PublicLeadSerializer


class PublicLeadThrottle(AnonRateThrottle):
    rate = "5/hour"


class PublicLeadPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "create":
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        roles = getattr(view, "action_roles", {}).get(view.action, READ_ONLY_ROLES)
        return request.user.role in roles


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by("-created_at")
    permission_classes = [PublicLeadPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "update": SALES_ROLES,
        "partial_update": SALES_ROLES,
        "destroy": SALES_ROLES,
    }

    def get_serializer_class(self):
        if self.action == "create" and not self.request.user.is_authenticated:
            return PublicLeadSerializer
        return LeadSerializer

    def get_throttles(self):
        if self.action == "create" and not self.request.user.is_authenticated:
            return [PublicLeadThrottle()]
        return super().get_throttles()


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("display_name")
    serializer_class = CustomerSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": SALES_ROLES,
        "update": SALES_ROLES,
        "partial_update": SALES_ROLES,
        "destroy": SALES_ROLES,
    }


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.select_related("customer").all()
    serializer_class = ContactSerializer
    permission_classes = [RoleActionPermission]
    action_roles = CustomerViewSet.action_roles


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("customer").all()
    serializer_class = PropertySerializer
    permission_classes = [RoleActionPermission]
    action_roles = CustomerViewSet.action_roles

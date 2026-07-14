from django.db import transaction
from django.db.models import Q
from rest_framework import decorators, permissions, response, serializers, status, viewsets
from rest_framework.throttling import AnonRateThrottle

from apps.core.permissions import READ_ONLY_ROLES, SALES_ROLES, RoleActionPermission
from .models import Contact, Customer, Lead, LeadActivity, Property
from .serializers import ContactSerializer, CustomerSerializer, LeadActivitySerializer, LeadSerializer, PropertySerializer, PublicLeadSerializer


ALLOWED_ORDERING = {"created_at", "updated_at", "full_name", "status", "next_follow_up_at"}


class LeadActivityInputSerializer(serializers.Serializer):
    activity_type = serializers.ChoiceField(choices=["note", "contact"])
    detail = serializers.CharField(max_length=4000)


class LeadConversionSerializer(serializers.Serializer):
    customer_type = serializers.ChoiceField(choices=Customer.CustomerType.choices, required=False)


def _filtered_queryset(request, queryset, search_fields, status_field="status"):
    search = request.query_params.get("search", "").strip()
    if search:
        query = Q()
        for field in search_fields:
            query |= Q(**{f"{field}__icontains": search})
        queryset = queryset.filter(query)
    selected_status = request.query_params.get("status")
    if selected_status:
        queryset = queryset.filter(**{status_field: selected_status})
    ordering = request.query_params.get("ordering", "")
    field = ordering.removeprefix("-")
    if field in ALLOWED_ORDERING:
        queryset = queryset.order_by(ordering)
    return queryset


class PublicLeadThrottle(AnonRateThrottle):
    scope = "public_lead"
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
    queryset = Lead.objects.select_related("assigned_to").prefetch_related("activities").all().order_by("-created_at")
    permission_classes = [PublicLeadPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "update": SALES_ROLES,
        "partial_update": SALES_ROLES,
        "destroy": SALES_ROLES,
        "archive": SALES_ROLES,
        "convert": SALES_ROLES,
        "add_activity": SALES_ROLES,
        "create_quote": SALES_ROLES,
    }

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("archived") != "true":
            queryset = queryset.filter(is_archived=False)
        return _filtered_queryset(self.request, queryset, ("full_name", "email", "phone", "requested_service"))

    def perform_update(self, serializer):
        previous = self.get_object()
        old_status, old_assignee = previous.status, previous.assigned_to_id
        lead = serializer.save()
        if old_status != lead.status:
            LeadActivity.objects.create(lead=lead, activity_type="status", detail=f"Estado: {old_status} → {lead.status}", created_by=self.request.user)
        if old_assignee != lead.assigned_to_id:
            LeadActivity.objects.create(lead=lead, activity_type="assignment", detail="Responsable actualizado.", created_by=self.request.user)

    @decorators.action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        lead = self.get_object()
        lead.is_archived = True
        lead.save(update_fields=["is_archived", "updated_at"])
        return response.Response(self.get_serializer(lead).data)

    @decorators.action(detail=True, methods=["post"], url_path="activities")
    def add_activity(self, request, pk=None):
        serializer = LeadActivityInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        activity = LeadActivity.objects.create(lead=self.get_object(), created_by=request.user, **serializer.validated_data)
        return response.Response(LeadActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"])
    def convert(self, request, pk=None):
        payload = LeadConversionSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        with transaction.atomic():
            lead = Lead.objects.select_for_update().get(pk=self.get_object().pk)
            if hasattr(lead, "converted_customer"):
                raise serializers.ValidationError("Este lead ya fue convertido.")
            duplicate = Customer.objects.filter(is_archived=False).filter(Q(email__iexact=lead.email) | Q(phone=lead.phone)).first()
            if duplicate:
                raise serializers.ValidationError({"duplicate_customer_id": str(duplicate.pk), "detail": "Existe un cliente con el mismo correo o teléfono."})
            customer = Customer.objects.create(
                display_name=lead.full_name,
                email=lead.email,
                phone=lead.phone,
                preferred_language=lead.preferred_language,
                customer_type=payload.validated_data.get("customer_type", Customer.CustomerType.INDIVIDUAL),
                consent_data_processing=lead.consent_data_processing,
                consent_marketing=lead.consent_marketing,
                referral_source=lead.source,
                source_lead=lead,
            )
            lead.status = Lead.Status.WON
            lead.save(update_fields=["status", "updated_at"])
            LeadActivity.objects.create(lead=lead, activity_type="conversion", detail=f"Convertido en cliente {customer.pk}.", created_by=request.user)
        return response.Response(CustomerSerializer(customer).data, status=status.HTTP_201_CREATED)

    @decorators.action(detail=True, methods=["post"], url_path="create-quote")
    def create_quote(self, request, pk=None):
        lead = self.get_object()
        if not hasattr(lead, "converted_customer"):
            raise serializers.ValidationError("Convierta el lead en cliente antes de cotizar.")
        from apps.services.serializers import QuoteSerializer

        data = request.data.copy()
        data["customer"] = str(lead.converted_customer.pk)
        data["source_lead"] = str(lead.pk)
        serializer = QuoteSerializer(data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        quote = serializer.save()
        return response.Response(serializer.to_representation(quote), status=status.HTTP_201_CREATED)

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
        "archive": SALES_ROLES,
    }

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("archived") != "true":
            queryset = queryset.filter(is_archived=False)
        return _filtered_queryset(self.request, queryset, ("display_name", "legal_name", "email", "phone"))

    @decorators.action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        customer = self.get_object()
        customer.is_archived = True
        customer.status = Customer.Status.INACTIVE
        customer.save(update_fields=["is_archived", "status", "updated_at"])
        return response.Response(self.get_serializer(customer).data)


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.select_related("customer").all()
    serializer_class = ContactSerializer
    permission_classes = [RoleActionPermission]
    action_roles = CustomerViewSet.action_roles


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.select_related("customer").all().order_by("name")
    serializer_class = PropertySerializer
    permission_classes = [RoleActionPermission]
    action_roles = CustomerViewSet.action_roles

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get("active") != "false":
            queryset = queryset.filter(is_active=True)
        customer = self.request.query_params.get("customer")
        if customer:
            queryset = queryset.filter(customer_id=customer)
        return _filtered_queryset(self.request, queryset, ("name", "address", "zone"), status_field="is_active")

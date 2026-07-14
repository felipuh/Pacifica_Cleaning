from rest_framework import serializers

from apps.core.permissions import SENSITIVE_ACCESS_ROLES

from .models import Communication, Contact, Customer, Lead, LeadActivity, Property


class LeadActivitySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = LeadActivity
        fields = "__all__"
        read_only_fields = ("lead", "created_by")


class PublicLeadSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "full_name",
            "email",
            "phone",
            "preferred_language",
            "source",
            "utm",
            "requested_service",
            "message",
            "consent_data_processing",
            "consent_marketing",
            "website",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        if attrs.pop("website", ""):
            raise serializers.ValidationError("No se pudo procesar la solicitud.")
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError("Debe indicar correo o telefono.")
        if not attrs.get("consent_data_processing"):
            raise serializers.ValidationError("El consentimiento de tratamiento de datos es obligatorio.")
        return attrs


class LeadSerializer(serializers.ModelSerializer):
    activities = LeadActivitySerializer(many=True, read_only=True)
    converted_customer_id = serializers.UUIDField(source="converted_customer.id", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.get_full_name", read_only=True)

    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        email = attrs.get("email", getattr(self.instance, "email", ""))
        phone = attrs.get("phone", getattr(self.instance, "phone", ""))
        consent = attrs.get("consent_data_processing", getattr(self.instance, "consent_data_processing", False))
        if not email and not phone:
            raise serializers.ValidationError("Debe indicar correo o telefono.")
        if not consent:
            raise serializers.ValidationError("El consentimiento de tratamiento de datos es obligatorio.")
        assignee = attrs.get("assigned_to")
        if assignee and (not assignee.is_active or assignee.role not in {"superadmin", "managing_partner", "operations", "sales"}):
            raise serializers.ValidationError({"assigned_to": "El responsable debe ser un usuario activo y elegible."})
        return attrs


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"

    def validate(self, attrs):
        email = attrs.get("email", getattr(self.instance, "email", ""))
        phone = attrs.get("phone", getattr(self.instance, "phone", ""))
        qs = Customer.objects.exclude(pk=getattr(self.instance, "pk", None))
        if email and qs.filter(email__iexact=email, is_archived=False).exists():
            raise serializers.ValidationError({"email": "Ya existe un cliente activo con este correo."})
        if phone and qs.filter(phone=phone, is_archived=False).exists():
            raise serializers.ValidationError({"phone": "Ya existe un cliente activo con este teléfono."})
        return attrs


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"


class PropertySerializer(serializers.ModelSerializer):
    masked_access = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = "__all__"

    def get_masked_access(self, obj) -> str:
        return obj.masked_access()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        role = getattr(getattr(request, "user", None), "role", None)
        if role not in SENSITIVE_ACCESS_ROLES:
            if data.get("access_instructions"):
                data["access_instructions"] = instance.masked_access()
            if data.get("alarm_notes"):
                data["alarm_notes"] = "Registrado; visible solo para roles autorizados."
        return data


class CommunicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Communication
        fields = "__all__"

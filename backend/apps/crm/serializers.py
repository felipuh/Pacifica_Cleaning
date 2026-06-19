from rest_framework import serializers

from apps.core.permissions import SENSITIVE_ACCESS_ROLES

from .models import Communication, Contact, Customer, Lead, Property


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
    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        if not attrs.get("email") and not attrs.get("phone"):
            raise serializers.ValidationError("Debe indicar correo o telefono.")
        if not attrs.get("consent_data_processing"):
            raise serializers.ValidationError("El consentimiento de tratamiento de datos es obligatorio.")
        return attrs


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"


class PropertySerializer(serializers.ModelSerializer):
    masked_access = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = "__all__"

    def get_masked_access(self, obj):
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

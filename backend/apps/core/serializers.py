from rest_framework import serializers

from .models import AuditLog, ConsentRecord, PrivateAttachment


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"
        read_only_fields = fields


class ConsentRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsentRecord
        fields = "__all__"


class PrivateAttachmentSerializer(serializers.ModelSerializer):
    signed_url = serializers.CharField(read_only=True)

    class Meta:
        model = PrivateAttachment
        fields = "__all__"
        read_only_fields = ("sha256", "size_bytes", "mime_type", "uploaded_by")

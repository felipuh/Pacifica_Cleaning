from rest_framework import serializers

from .models import WorkerProfile


class WorkerProfileSerializer(serializers.ModelSerializer):
    independence_risk_flags = serializers.ListField(read_only=True)

    class Meta:
        model = WorkerProfile
        fields = "__all__"

from rest_framework import serializers

from .models import Assignment, ChecklistResult, Incident, QualityReview, WorkOrder, WorkOrderStatusHistory


class WorkOrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.get_full_name", read_only=True)
    class Meta:
        model = WorkOrderStatusHistory
        fields = "__all__"


class AssignmentSerializer(serializers.ModelSerializer):
    worker_name = serializers.CharField(source="worker.full_name", read_only=True)
    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("work_order",)


class WorkOrderSerializer(serializers.ModelSerializer):
    assignments = AssignmentSerializer(many=True, required=False)
    status_history = WorkOrderStatusHistorySerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source="customer.display_name", read_only=True)
    property_name = serializers.CharField(source="property.name", read_only=True)

    class Meta:
        model = WorkOrder
        fields = "__all__"

    def validate(self, attrs):
        scheduled_start = attrs.get("scheduled_start", getattr(self.instance, "scheduled_start", None))
        scheduled_end = attrs.get("scheduled_end", getattr(self.instance, "scheduled_end", None))
        if scheduled_start and scheduled_end and scheduled_end <= scheduled_start:
            raise serializers.ValidationError("La hora final debe ser posterior a la inicial.")
        return attrs

    def create(self, validated_data):
        assignments = validated_data.pop("assignments", [])
        work_order = WorkOrder(**validated_data)
        work_order.full_clean()
        work_order.save()
        for assignment in assignments:
            obj = Assignment(work_order=work_order, **assignment)
            obj.full_clean()
            obj.save()
        return work_order

    def update(self, instance, validated_data):
        assignments = validated_data.pop("assignments", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.full_clean()
        instance.save()
        if assignments is not None:
            instance.assignments.all().delete()
            for assignment in assignments:
                obj = Assignment(work_order=instance, **assignment)
                obj.full_clean()
                obj.save()
        return instance


class ChecklistResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistResult
        fields = "__all__"


class QualityReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityReview
        fields = "__all__"

    def validate(self, attrs):
        score = attrs.get("score", getattr(self.instance, "score", None))
        nps = attrs.get("nps", getattr(self.instance, "nps", None))
        rework_cost = attrs.get("rework_cost", getattr(self.instance, "rework_cost", 0))
        if score is not None and not 1 <= score <= 5:
            raise serializers.ValidationError({"score": "La puntuación debe estar entre 1 y 5."})
        if nps is not None and not -100 <= nps <= 100:
            raise serializers.ValidationError({"nps": "El NPS debe estar entre -100 y 100."})
        if rework_cost < 0:
            raise serializers.ValidationError({"rework_cost": "El costo de retrabajo no puede ser negativo."})
        return attrs


class IncidentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = "__all__"

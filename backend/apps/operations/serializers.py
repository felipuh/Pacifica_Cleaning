from rest_framework import serializers

from .models import Assignment, ChecklistResult, QualityReview, WorkOrder


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = "__all__"
        read_only_fields = ("work_order",)


class WorkOrderSerializer(serializers.ModelSerializer):
    assignments = AssignmentSerializer(many=True, required=False)

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
        work_order = WorkOrder.objects.create(**validated_data)
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

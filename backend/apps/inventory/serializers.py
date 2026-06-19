from rest_framework import serializers

from .models import InventoryItem, StockMovement


class InventoryItemSerializer(serializers.ModelSerializer):
    below_minimum = serializers.BooleanField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = "__all__"


class StockMovementSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockMovement
        fields = "__all__"

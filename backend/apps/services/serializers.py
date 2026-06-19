from rest_framework import serializers

from .models import PriceVersion, Quote, QuoteLine, Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = "__all__"


class PriceVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceVersion
        fields = "__all__"


class QuoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLine
        fields = ("id", "service", "description", "quantity", "estimated_hours", "unit_price", "tax_rate", "expected_cost", "line_total", "margin_estimate")
        read_only_fields = ("line_total", "margin_estimate")

    def validate(self, attrs):
        quantity = attrs.get("quantity", 1)
        estimated_hours = attrs.get("estimated_hours", 0)
        if quantity <= 0:
            raise serializers.ValidationError("La cantidad debe ser positiva.")
        if estimated_hours < 0:
            raise serializers.ValidationError("Las horas estimadas no pueden ser negativas.")
        if attrs.get("unit_price", 0) < 0 or attrs.get("expected_cost", 0) < 0:
            raise serializers.ValidationError("Precios y costos no pueden ser negativos.")
        return attrs


class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True)

    class Meta:
        model = Quote
        fields = "__all__"
        read_only_fields = ("subtotal", "tax", "total", "margin_estimate", "accepted_at")

    def validate(self, attrs):
        discount = attrs.get("discount", getattr(self.instance, "discount", 0))
        if discount < 0:
            raise serializers.ValidationError("El descuento no puede ser negativo.")
        lines = attrs.get("lines")
        if lines is not None:
            subtotal = sum(((line.get("estimated_hours") or line.get("quantity", 1)) * line["unit_price"]) for line in lines)
            if discount > subtotal:
                raise serializers.ValidationError("El descuento no puede superar el subtotal.")
        elif self.instance and discount > self.instance.subtotal:
            raise serializers.ValidationError("El descuento no puede superar el subtotal.")
        return attrs

    def create(self, validated_data):
        lines = validated_data.pop("lines", [])
        quote = Quote.objects.create(**validated_data)
        for line in lines:
            QuoteLine.objects.create(quote=quote, **line)
        quote.recalculate()
        quote.save(update_fields=["subtotal", "tax", "total", "margin_estimate", "updated_at"])
        return quote

    def update(self, instance, validated_data):
        lines = validated_data.pop("lines", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if lines is not None:
            instance.lines.all().delete()
            for line in lines:
                QuoteLine.objects.create(quote=instance, **line)
        instance.recalculate()
        instance.save(update_fields=["subtotal", "tax", "total", "margin_estimate", "updated_at"])
        return instance

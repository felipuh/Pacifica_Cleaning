import hashlib
import hmac

from django.conf import settings
from django.http import FileResponse, HttpResponseForbidden
from django.db.models import Avg, Count, F, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.crm.models import Customer, Lead
from apps.finance.models import Expense, Payment
from apps.inventory.models import InventoryItem
from apps.operations.models import Incident, QualityReview, WorkOrder
from apps.services.models import Quote

from .permissions import role_permission, READ_ONLY_ROLES

from .models import PrivateAttachment


def private_file(request, pk):
    expires = request.GET.get("expires", "")
    token = request.GET.get("token", "")
    if not expires.isdigit() or int(expires) < int(timezone.now().timestamp()):
        return HttpResponseForbidden("Expired private file URL.")
    expected = hashlib.sha256(f"{pk}:{expires}:{settings.SECRET_KEY}".encode()).hexdigest()
    if not token or not hmac.compare_digest(token, expected):
        return HttpResponseForbidden("Invalid private file URL.")
    attachment = PrivateAttachment.objects.get(pk=pk)
    return FileResponse(attachment.file.open("rb"), content_type=attachment.mime_type)


@extend_schema(
    responses=inline_serializer(
        name="DashboardMetricsResponse",
        fields={
            "leads_new": serializers.IntegerField(),
            "leads_pending": serializers.IntegerField(),
            "quotes_pending": serializers.IntegerField(),
            "quotes_sent": serializers.IntegerField(),
            "quotes_accepted": serializers.IntegerField(),
            "services_upcoming": serializers.IntegerField(),
            "services_completed": serializers.IntegerField(),
            "recurrent_customers": serializers.IntegerField(),
            "estimated_revenue": serializers.DecimalField(max_digits=14, decimal_places=2),
            "confirmed_revenue": serializers.DecimalField(max_digits=14, decimal_places=2),
            "conversion_rate": serializers.FloatField(),
            "finance_by_currency": serializers.ListField(child=serializers.DictField()),
            "quality_average": serializers.FloatField(allow_null=True),
            "rework_rate": serializers.FloatField(),
            "open_incidents": serializers.IntegerField(),
            "high_incidents": serializers.IntegerField(),
            "inventory_below_minimum": serializers.IntegerField(),
            "recent_activity": serializers.ListField(child=serializers.DictField()),
            "generated_at": serializers.DateTimeField(),
        },
    )
)
@api_view(["GET"])
@permission_classes([role_permission(*READ_ONLY_ROLES)])
def dashboard(request):
    now = timezone.now()
    leads = Lead.objects.filter(is_archived=False)
    quotes = Quote.objects.all()
    work_orders = WorkOrder.objects.all()
    total_leads = leads.count()
    won_leads = leads.filter(status=Lead.Status.WON).count()
    recurrent_customers = Customer.objects.annotate(service_count=Count("work_orders")).filter(service_count__gte=2, is_archived=False).count()
    estimated = quotes.filter(status__in=[Quote.Status.SENT, Quote.Status.ACCEPTED]).aggregate(value=Sum("total"))["value"] or 0
    confirmed = Payment.objects.aggregate(value=Sum("amount"))["value"] or 0
    payments_by_currency = {row["currency"]: row["total"] for row in Payment.objects.values("currency").annotate(total=Sum("amount"))}
    expenses_by_currency = {row["currency"]: row["total"] for row in Expense.objects.values("currency").annotate(total=Sum("amount"))}
    finance_by_currency = []
    for currency in sorted(payments_by_currency.keys() | expenses_by_currency.keys()):
        income = payments_by_currency.get(currency, 0)
        expenses = expenses_by_currency.get(currency, 0)
        finance_by_currency.append({"currency": currency, "income": income, "expenses": expenses, "margin": income - expenses})
    quality_reviews = QualityReview.objects.all()
    quality_count = quality_reviews.count()
    rework_count = quality_reviews.filter(rework_required=True).count()
    recent = [
        {"type": "lead", "id": str(item.pk), "label": item.full_name, "status": item.status, "at": item.updated_at}
        for item in leads.order_by("-updated_at")[:5]
    ]
    recent += [
        {"type": "service", "id": str(item.pk), "label": item.property.name, "status": item.status, "at": item.updated_at}
        for item in work_orders.select_related("property").order_by("-updated_at")[:5]
    ]
    recent.sort(key=lambda item: item["at"], reverse=True)
    return Response(
        {
            "leads_new": leads.filter(status=Lead.Status.NEW).count(),
            "leads_pending": leads.filter(status__in=[Lead.Status.NEW, Lead.Status.CONTACTED, Lead.Status.QUALIFIED]).count(),
            "quotes_pending": quotes.filter(status=Quote.Status.DRAFT).count(),
            "quotes_sent": quotes.filter(status=Quote.Status.SENT).count(),
            "quotes_accepted": quotes.filter(status=Quote.Status.ACCEPTED).count(),
            "services_upcoming": work_orders.filter(scheduled_start__gte=now, status__in=[WorkOrder.Status.PLANNED, WorkOrder.Status.CONFIRMED]).count(),
            "services_completed": work_orders.filter(status=WorkOrder.Status.COMPLETED).count(),
            "recurrent_customers": recurrent_customers,
            "estimated_revenue": estimated,
            "confirmed_revenue": confirmed,
            "conversion_rate": round((won_leads / total_leads * 100), 2) if total_leads else 0,
            "finance_by_currency": finance_by_currency,
            "quality_average": quality_reviews.aggregate(value=Avg("score"))["value"],
            "rework_rate": round((rework_count / quality_count * 100), 2) if quality_count else 0,
            "open_incidents": Incident.objects.filter(resolved_at__isnull=True).count(),
            "high_incidents": Incident.objects.filter(severity="high", resolved_at__isnull=True).count(),
            "inventory_below_minimum": InventoryItem.objects.filter(stock_on_hand__lte=F("minimum_stock")).count(),
            "recent_activity": recent[:10],
            "generated_at": now,
        }
    )

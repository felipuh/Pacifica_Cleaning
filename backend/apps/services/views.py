from django.http import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from rest_framework import decorators, response, viewsets

from apps.core.permissions import ADMIN_ROLES, READ_ONLY_ROLES, SALES_ROLES, RoleActionPermission
from apps.operations.serializers import WorkOrderSerializer
from .models import PriceVersion, Quote, Service
from .serializers import ConvertQuoteToWorkOrderSerializer, PriceVersionSerializer, QuoteSerializer, ServiceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.filter(is_active=True).order_by("name_es")
    serializer_class = ServiceSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": ADMIN_ROLES,
        "update": ADMIN_ROLES,
        "partial_update": ADMIN_ROLES,
        "destroy": ADMIN_ROLES,
    }


class PriceVersionViewSet(viewsets.ModelViewSet):
    queryset = PriceVersion.objects.select_related("service").all()
    serializer_class = PriceVersionSerializer
    permission_classes = [RoleActionPermission]
    action_roles = ServiceViewSet.action_roles


class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.select_related("customer", "property").prefetch_related("lines").all().order_by("-created_at")
    serializer_class = QuoteSerializer
    permission_classes = [RoleActionPermission]
    action_roles = {
        "list": READ_ONLY_ROLES,
        "retrieve": READ_ONLY_ROLES,
        "create": SALES_ROLES,
        "update": SALES_ROLES,
        "partial_update": SALES_ROLES,
        "destroy": ADMIN_ROLES,
        "accept": SALES_ROLES,
        "convert_to_work_order": SALES_ROLES,
        "pdf": SALES_ROLES,
    }

    @decorators.action(detail=True, methods=["post"])
    def accept(self, request, pk=None):
        quote = self.get_object()
        quote.accept()
        return response.Response(self.get_serializer(quote).data)

    @decorators.action(detail=True, methods=["post"], url_path="convert-to-work-order")
    def convert_to_work_order(self, request, pk=None):
        quote = self.get_object()
        serializer = ConvertQuoteToWorkOrderSerializer(data=request.data, context={"quote": quote})
        serializer.is_valid(raise_exception=True)
        work_order = serializer.save()
        return response.Response(WorkOrderSerializer(work_order, context={"request": request}).data, status=201)

    @decorators.action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        quote = self.get_object()
        from io import BytesIO

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle(f"Cotizacion {quote.id}")
        pdf.drawString(72, 740, "Pacifica Cleaning")
        pdf.drawString(72, 710, f"Cliente: {quote.customer.display_name}")
        pdf.drawString(72, 690, f"Propiedad: {quote.property.name}")
        y = 650
        for line in quote.lines.all():
            pdf.drawString(72, y, f"{line.description}: {quote.currency} {line.line_total}")
            y -= 22
        pdf.drawString(72, y - 20, f"Total: {quote.currency} {quote.total}")
        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        return FileResponse(buffer, filename=f"cotizacion-{quote.id}.pdf", as_attachment=True)

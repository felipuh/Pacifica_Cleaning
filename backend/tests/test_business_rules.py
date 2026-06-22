from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory

from apps.crm.models import Customer, Property
from apps.crm.serializers import PropertySerializer, PublicLeadSerializer
from apps.inventory.models import InventoryItem, StockMovement
from apps.operations.serializers import WorkOrderSerializer
from apps.operations.models import Assignment, WorkOrder
from apps.people.models import WorkerProfile
from apps.services.models import Quote, QuoteLine, Service
from apps.services.serializers import ConvertQuoteToWorkOrderSerializer


class BusinessRulesTests(TestCase):
    def setUp(self):
        self.customer = Customer.objects.create(display_name="Cliente Demo", email="demo@example.com")
        self.property = Property.objects.create(
            customer=self.customer,
            name="Casa Demo",
            address="Tempate",
            zone="Tempate",
            bedrooms=2,
            bathrooms=Decimal("1.0"),
        )
        self.service = Service.objects.create(
            name_es="Limpieza residencial",
            name_en="Residential cleaning",
            slug="residencial",
            description_es="Servicio residencial",
            pricing_mode=Service.PricingMode.HOURLY,
        )

    def test_quote_recalculates_totals(self):
        quote = Quote.objects.create(
            customer=self.customer,
            property=self.property,
            valid_until=timezone.localdate() + timedelta(days=15),
            discount=Decimal("1000.00"),
        )
        QuoteLine.objects.create(
            quote=quote,
            service=self.service,
            description="Dos horas",
            estimated_hours=Decimal("2.00"),
            unit_price=Decimal("10000.00"),
            expected_cost=Decimal("9000.00"),
        )
        quote.recalculate()
        self.assertEqual(quote.subtotal, Decimal("20000.00"))
        self.assertEqual(quote.total, Decimal("21470.000000"))

    def test_assignment_overlap_is_rejected(self):
        user = get_user_model().objects.create_user(username="worker@example.com", email="worker@example.com", password="Password-12345")
        worker = WorkerProfile.objects.create(worker_type=WorkerProfile.WorkerType.EMPLOYEE, full_name="Persona Demo", phone="8888-8888", user=user)
        start = timezone.now() + timedelta(days=1)
        first = WorkOrder.objects.create(customer=self.customer, property=self.property, scheduled_start=start, scheduled_end=start + timedelta(hours=2))
        second = WorkOrder.objects.create(customer=self.customer, property=self.property, scheduled_start=start + timedelta(minutes=30), scheduled_end=start + timedelta(hours=3))
        Assignment.objects.create(work_order=first, worker=worker)
        overlapping = Assignment(work_order=second, worker=worker)
        with self.assertRaises(ValidationError):
            overlapping.full_clean()

    def test_stock_cannot_go_negative(self):
        item = InventoryItem.objects.create(name="Desinfectante", category="Producto", stock_on_hand=Decimal("1.00"))
        movement = StockMovement(item=item, movement_type=StockMovement.MovementType.OUT, quantity=Decimal("2.00"))
        with self.assertRaises(ValidationError):
            movement.save()

    def test_contractor_independence_risk_flags(self):
        worker = WorkerProfile.objects.create(
            worker_type=WorkerProfile.WorkerType.CONTRACTOR,
            full_name="Prestador Demo",
            phone="8888-0000",
            contractor_exclusivity=True,
            contractor_fixed_schedule=True,
        )
        self.assertEqual(worker.independence_risk_flags(), ["Exclusividad", "Horario impuesto"])

    def test_public_lead_serializer_rejects_honeypot_and_ignores_internal_fields(self):
        serializer = PublicLeadSerializer(
            data={
                "full_name": "Cliente Web",
                "phone": "8888-1111",
                "consent_data_processing": True,
                "status": "won",
                "assigned_to": "00000000-0000-0000-0000-000000000000",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        lead = serializer.save()
        self.assertEqual(lead.status, "new")
        self.assertIsNone(lead.assigned_to)

        spam = PublicLeadSerializer(data={"full_name": "Bot", "phone": "1", "consent_data_processing": True, "website": "filled"})
        self.assertFalse(spam.is_valid())

    def test_property_serializer_masks_sensitive_access_for_auditor(self):
        user = get_user_model().objects.create_user(
            username="auditor@example.com",
            email="auditor@example.com",
            password="Password-12345",
            role="auditor",
        )
        self.property.access_instructions = "Llave bajo maceta"
        self.property.alarm_notes = "Clave 1234"
        self.property.save()
        request = APIRequestFactory().get("/")
        request.user = user

        data = PropertySerializer(self.property, context={"request": request}).data

        self.assertNotIn("Llave bajo maceta", data["access_instructions"])
        self.assertNotIn("1234", data["alarm_notes"])

    def test_work_order_serializer_rejects_invalid_schedule(self):
        start = timezone.now() + timedelta(days=1)
        serializer = WorkOrderSerializer(
            data={
                "customer": self.customer.pk,
                "property": self.property.pk,
                "scheduled_start": start.isoformat(),
                "scheduled_end": (start - timedelta(hours=1)).isoformat(),
            }
        )
        self.assertFalse(serializer.is_valid())

    def test_accepted_quote_converts_to_work_order_once(self):
        quote = Quote.objects.create(
            customer=self.customer,
            property=self.property,
            status=Quote.Status.ACCEPTED,
            valid_until=timezone.localdate() + timedelta(days=15),
        )
        start = timezone.now() + timedelta(days=2)
        serializer = ConvertQuoteToWorkOrderSerializer(
            data={
                "scheduled_start": start.isoformat(),
                "scheduled_end": (start + timedelta(hours=3)).isoformat(),
                "route_zone": "Tempate",
            },
            context={"quote": quote},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        work_order = serializer.save()

        self.assertEqual(work_order.quote, quote)
        self.assertEqual(work_order.customer, quote.customer)
        self.assertEqual(work_order.property, quote.property)

        duplicate = ConvertQuoteToWorkOrderSerializer(
            data={
                "scheduled_start": start.isoformat(),
                "scheduled_end": (start + timedelta(hours=3)).isoformat(),
            },
            context={"quote": quote},
        )
        self.assertFalse(duplicate.is_valid())

from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.crm.models import Customer, Property
from apps.operations.models import Assignment, WorkOrder
from apps.people.models import WorkerProfile
from apps.services.models import Quote, Service


class QuoteAndServiceApiTests(TestCase):
    def setUp(self):
        users = get_user_model()
        self.sales = users.objects.create_user(username="sales2@example.test", password="Safe-Test-Password-123", role="sales")
        self.operations = users.objects.create_user(username="ops@example.test", password="Safe-Test-Password-123", role="operations")
        self.auditor = users.objects.create_user(username="reader@example.test", password="Safe-Test-Password-123", role="auditor")
        self.customer = Customer.objects.create(display_name="Cliente Cotización", email="quote@example.test")
        self.property = Property.objects.create(customer=self.customer, name="Casa Agenda", address="Tempate", zone="Tempate")
        self.service = Service.objects.create(
            name_es="Limpieza de prueba",
            name_en="Test cleaning",
            slug="test-cleaning",
            description_es="Servicio de prueba",
            pricing_mode=Service.PricingMode.FIXED,
        )

    def client_for(self, user):
        client = APIClient()
        client.force_login(user)
        return client

    def quote_payload(self):
        return {
            "customer": str(self.customer.pk),
            "property": str(self.property.pk),
            "currency": "CRC",
            "valid_until": str(timezone.localdate() + timedelta(days=10)),
            "discount": "1000.00",
            "terms": "Vigencia de prueba.",
            "lines": [
                {
                    "service": str(self.service.pk),
                    "description": "Dos unidades",
                    "quantity": "2.00",
                    "estimated_hours": "0.00",
                    "unit_price": "10000.00",
                    "tax_rate": "0.1300",
                    "expected_cost": "8000.00",
                }
            ],
        }

    def test_quote_calculation_transitions_and_unique_conversion(self):
        client = self.client_for(self.sales)
        created = client.post("/api/v1/quotes/", self.quote_payload(), format="json")
        quote_id = created.json()["id"]

        sent = client.post(f"/api/v1/quotes/{quote_id}/send/", {}, format="json")
        accepted = client.post(f"/api/v1/quotes/{quote_id}/accept/", {}, format="json")
        start = timezone.now() + timedelta(days=2)
        schedule = {"scheduled_start": start.isoformat(), "scheduled_end": (start + timedelta(hours=2)).isoformat()}
        converted = client.post(f"/api/v1/quotes/{quote_id}/convert-to-work-order/", schedule, format="json")
        duplicate = client.post(f"/api/v1/quotes/{quote_id}/convert-to-work-order/", schedule, format="json")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(Decimal(created.json()["subtotal"]), Decimal("20000.00"))
        self.assertEqual(Decimal(created.json()["total"]), Decimal("21470.00"))
        self.assertEqual(sent.status_code, 200)
        self.assertEqual(accepted.status_code, 200)
        self.assertEqual(converted.status_code, 201)
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(Quote.objects.get(pk=quote_id).status_history.count(), 2)
        self.assertEqual(Decimal(converted.json()["price"]), Decimal("21470.00"))

    def test_invalid_quote_transitions_and_discount_are_rejected(self):
        client = self.client_for(self.sales)
        payload = self.quote_payload()
        payload["discount"] = "999999.00"
        self.assertEqual(client.post("/api/v1/quotes/", payload, format="json").status_code, 400)

        payload["discount"] = "0.00"
        quote_id = client.post("/api/v1/quotes/", payload, format="json").json()["id"]
        self.assertEqual(client.post(f"/api/v1/quotes/{quote_id}/accept/", {}, format="json").status_code, 400)

    def test_auditor_cannot_create_or_transition_quote(self):
        client = self.client_for(self.auditor)
        self.assertEqual(client.get("/api/v1/quotes/").status_code, 200)
        self.assertEqual(client.post("/api/v1/quotes/", self.quote_payload(), format="json").status_code, 403)

    def test_operations_can_reschedule_without_conflict_and_complete_service(self):
        worker = WorkerProfile.objects.create(full_name="Persona Agenda", phone="8000-2000", worker_type="employee")
        start = timezone.now() + timedelta(days=3)
        first = WorkOrder.objects.create(customer=self.customer, property=self.property, scheduled_start=start, scheduled_end=start + timedelta(hours=2))
        second = WorkOrder.objects.create(customer=self.customer, property=self.property, scheduled_start=start + timedelta(hours=4), scheduled_end=start + timedelta(hours=6))
        Assignment.objects.create(work_order=first, worker=worker)
        Assignment.objects.create(work_order=second, worker=worker)
        client = self.client_for(self.operations)

        conflict = client.post(
            f"/api/v1/work-orders/{second.pk}/reschedule/",
            {"scheduled_start": (start + timedelta(hours=1)).isoformat(), "scheduled_end": (start + timedelta(hours=3)).isoformat()},
            format="json",
        )
        valid = client.post(
            f"/api/v1/work-orders/{second.pk}/reschedule/",
            {"scheduled_start": (start + timedelta(hours=7)).isoformat(), "scheduled_end": (start + timedelta(hours=9)).isoformat()},
            format="json",
        )
        confirmed = client.post(f"/api/v1/work-orders/{first.pk}/transition/", {"status": "confirmed"}, format="json")
        started = client.post(f"/api/v1/work-orders/{first.pk}/transition/", {"status": "in_progress"}, format="json")
        completed = client.post(f"/api/v1/work-orders/{first.pk}/transition/", {"status": "completed"}, format="json")

        self.assertEqual(conflict.status_code, 400)
        self.assertEqual(valid.status_code, 200)
        self.assertEqual(confirmed.status_code, 200)
        self.assertEqual(started.status_code, 200)
        self.assertEqual(completed.status_code, 200)
        first.refresh_from_db()
        self.assertIsNotNone(first.started_at)
        self.assertIsNotNone(first.completed_at)

    def test_dashboard_reports_only_persisted_operational_data(self):
        Quote.objects.create(
            customer=self.customer,
            property=self.property,
            status=Quote.Status.SENT,
            valid_until=timezone.localdate() + timedelta(days=5),
            total=Decimal("25000.00"),
        )
        WorkOrder.objects.create(
            customer=self.customer,
            property=self.property,
            scheduled_start=timezone.now() + timedelta(days=1),
            scheduled_end=timezone.now() + timedelta(days=1, hours=2),
        )

        response = self.client_for(self.auditor).get("/api/v1/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["quotes_sent"], 1)
        self.assertEqual(response.json()["services_upcoming"], 1)
        self.assertEqual(Decimal(response.json()["estimated_revenue"]), Decimal("25000.00"))

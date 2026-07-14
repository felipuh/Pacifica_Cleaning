from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.crm.models import Customer, Lead, LeadActivity


class CrmApiTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.sales = user_model.objects.create_user(
            username="sales@example.test", email="sales@example.test", password="Safe-Test-Password-123", role="sales"
        )
        self.auditor = user_model.objects.create_user(
            username="audit@example.test", email="audit@example.test", password="Safe-Test-Password-123", role="auditor"
        )
        self.lead = Lead.objects.create(
            full_name="Solicitud Uno",
            email="lead1@example.test",
            phone="8000-0001",
            consent_data_processing=True,
            requested_service="Limpieza profunda",
        )

    def client_for(self, user):
        client = APIClient()
        client.force_login(user)
        return client

    def test_sales_can_search_update_add_activity_and_archive_lead(self):
        client = self.client_for(self.sales)

        listing = client.get("/api/v1/leads/?search=Solicitud&status=new&ordering=full_name")
        updated = client.patch(f"/api/v1/leads/{self.lead.pk}/", {"status": "contacted", "assigned_to": self.sales.pk}, format="json")
        activity = client.post(
            f"/api/v1/leads/{self.lead.pk}/activities/",
            {"activity_type": "contact", "detail": "Contacto telefónico de prueba."},
            format="json",
        )
        archived = client.post(f"/api/v1/leads/{self.lead.pk}/archive/", {}, format="json")

        self.assertEqual(listing.status_code, 200)
        self.assertEqual(len(listing.json()["results"]), 1)
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(activity.status_code, 201)
        self.assertEqual(archived.status_code, 200)
        self.assertEqual(LeadActivity.objects.filter(lead=self.lead).count(), 3)
        self.assertEqual(client.get("/api/v1/leads/").json()["count"], 0)

    def test_lead_converts_once_and_preserves_consents(self):
        client = self.client_for(self.sales)

        first = client.post(f"/api/v1/leads/{self.lead.pk}/convert/", {"customer_type": "individual"}, format="json")
        second = client.post(f"/api/v1/leads/{self.lead.pk}/convert/", {}, format="json")

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
        customer = Customer.objects.get(source_lead=self.lead)
        self.assertEqual(customer.display_name, self.lead.full_name)
        self.assertTrue(customer.consent_data_processing)

    def test_conversion_rejects_reasonable_duplicate(self):
        Customer.objects.create(display_name="Cliente existente", email=self.lead.email, phone="8000-0099")
        response = self.client_for(self.sales).post(f"/api/v1/leads/{self.lead.pk}/convert/", {}, format="json")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Customer.objects.count(), 1)

    def test_auditor_can_read_but_cannot_change_or_convert(self):
        client = self.client_for(self.auditor)

        self.assertEqual(client.get("/api/v1/leads/").status_code, 200)
        self.assertEqual(client.patch(f"/api/v1/leads/{self.lead.pk}/", {"status": "contacted"}, format="json").status_code, 403)
        self.assertEqual(client.post(f"/api/v1/leads/{self.lead.pk}/convert/", {}, format="json").status_code, 403)

    def test_customer_duplicate_validation_and_archive(self):
        client = self.client_for(self.sales)
        payload = {
            "display_name": "Cliente Operativo",
            "email": "customer@example.test",
            "phone": "8000-0100",
            "consent_data_processing": True,
        }
        created = client.post("/api/v1/customers/", payload, format="json")
        duplicate = client.post("/api/v1/customers/", {**payload, "display_name": "Duplicado"}, format="json")
        archived = client.post(f"/api/v1/customers/{created.json()['id']}/archive/", {}, format="json")

        self.assertEqual(created.status_code, 201)
        self.assertEqual(duplicate.status_code, 400)
        self.assertEqual(archived.status_code, 200)

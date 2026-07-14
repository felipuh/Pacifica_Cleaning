from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.crm.models import Customer, Lead, Property
from apps.operations.models import Assignment, WorkOrder
from apps.people.models import WorkerProfile


class RoleBoundaryTests(TestCase):
    def setUp(self):
        users = get_user_model()
        self.users = {
            role: users.objects.create_user(
                username=f"{role}@example.test",
                email=f"{role}@example.test",
                password="Safe-Test-Password-123",
                role=role,
            )
            for role in ("superadmin", "managing_partner", "operations", "sales", "staff", "auditor")
        }
        self.lead = Lead.objects.create(full_name="Lead permisos", phone="8000-4000", consent_data_processing=True)
        customer = Customer.objects.create(display_name="Cliente permisos")
        property_obj = Property.objects.create(customer=customer, name="Casa permisos", address="Tempate", zone="Tempate")
        start = timezone.now() + timedelta(days=1)
        self.work_order = WorkOrder.objects.create(customer=customer, property=property_obj, scheduled_start=start, scheduled_end=start + timedelta(hours=2))
        worker = WorkerProfile.objects.create(user=self.users["staff"], full_name="Personal asignado", phone="8000-4100", worker_type="employee")
        Assignment.objects.create(work_order=self.work_order, worker=worker)

    def client_for(self, role):
        client = APIClient()
        client.force_login(self.users[role])
        return client

    def test_read_only_role_cannot_mutate_business_resources(self):
        client = self.client_for("auditor")
        self.assertEqual(client.get("/api/v1/leads/").status_code, 200)
        self.assertEqual(client.patch(f"/api/v1/leads/{self.lead.pk}/", {"status": "contacted"}, format="json").status_code, 403)
        self.assertEqual(client.post(f"/api/v1/leads/{self.lead.pk}/archive/", {}, format="json").status_code, 403)

    def test_sales_cannot_manage_users_or_operational_schedule(self):
        client = self.client_for("sales")
        self.assertEqual(client.get("/api/v1/users/").status_code, 403)
        self.assertEqual(client.post(f"/api/v1/work-orders/{self.work_order.pk}/transition/", {"status": "confirmed"}, format="json").status_code, 403)

    def test_operations_cannot_manage_users_but_can_schedule(self):
        client = self.client_for("operations")
        self.assertEqual(client.get("/api/v1/users/").status_code, 403)
        self.assertEqual(client.post(f"/api/v1/work-orders/{self.work_order.pk}/transition/", {"status": "confirmed"}, format="json").status_code, 200)

    def test_staff_sees_only_assigned_services_and_cannot_change_them(self):
        client = self.client_for("staff")
        listing = client.get("/api/v1/work-orders/")
        self.assertEqual(listing.status_code, 200)
        self.assertEqual(listing.json()["count"], 1)
        self.assertEqual(client.post(f"/api/v1/work-orders/{self.work_order.pk}/transition/", {"status": "confirmed"}, format="json").status_code, 403)
        self.assertEqual(client.get("/api/v1/leads/").status_code, 403)

    def test_both_admin_roles_can_manage_users(self):
        for role in ("superadmin", "managing_partner"):
            with self.subTest(role=role):
                self.assertEqual(self.client_for(role).get("/api/v1/users/").status_code, 200)

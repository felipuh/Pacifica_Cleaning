from django.urls import path

from . import views

app_name = "public_site"

urlpatterns = [
    path("", views.home, name="home"),
    path("api/v1/health/", views.health, name="health"),
    path("services/", views.services, name="services"),
    path("zonas/", views.zones, name="zones"),
    path("zones/", views.zones),
    path("contacto/", views.contact, name="contact"),
    path("contact/", views.contact),
    path("faq/", views.faq, name="faq"),
    path("politicas/", views.policies, name="policies"),
    path("policies/", views.policies),
]

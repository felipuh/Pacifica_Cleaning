from django.contrib import messages
from django.db import connection
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import get_language

from apps.crm.serializers import PublicLeadSerializer
from apps.services.models import Service


def _language(request):
    requested = request.GET.get("lang") or get_language() or "es"
    return "en" if requested.startswith("en") else "es"


def _context(request, **extra):
    language = _language(request)
    base = {
        "language": language,
        "is_en": language == "en",
        "services": Service.objects.filter(is_active=True).order_by("name_es")[:8],
    }
    base.update(extra)
    return base


def home(request):
    return render(request, "public_site/home.html", _context(request))


def health(request):
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        cursor.fetchone()
    return JsonResponse({"status": "ok", "database": "ok"})


def services(request):
    return render(request, "public_site/services.html", _context(request))


def zones(request):
    zones_list = ["Tempate", "Tamarindo", "Huacas", "Brasilito", "Flamingo", "Potrero", "Santa Cruz"]
    return render(request, "public_site/zones.html", _context(request, zones=zones_list))


def faq(request):
    return render(request, "public_site/faq.html", _context(request))


def policies(request):
    return render(request, "public_site/policies.html", _context(request))


def contact(request):
    if request.method == "POST":
        payload = request.POST.copy()
        serializer = PublicLeadSerializer(data=payload)
        if serializer.is_valid():
            serializer.save(source="website")
            if _language(request) == "en":
                messages.success(request, "Thanks. We received your request and will contact you soon.")
            else:
                messages.success(request, "Gracias. Recibimos su solicitud y le contactaremos pronto.")
            return redirect(f"{reverse('public_site:contact')}?lang={_language(request)}")
        return render(request, "public_site/contact.html", _context(request, errors=serializer.errors, form=payload), status=400)
    return render(request, "public_site/contact.html", _context(request))

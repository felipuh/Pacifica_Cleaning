from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.routers import DefaultRouter

from apps.accounts.views import auth_urls
from apps.core.views import private_file
from apps.crm.views import ContactViewSet, CustomerViewSet, LeadViewSet, PropertyViewSet
from apps.finance.views import ExpenseViewSet, PaymentViewSet
from apps.inventory.views import InventoryItemViewSet, StockMovementViewSet
from apps.marketing.views import CampaignViewSet, CouponViewSet
from apps.notifications.views import NotificationTemplateViewSet
from apps.operations.views import WorkOrderViewSet
from apps.people.views import WorkerProfileViewSet
from apps.services.views import PriceVersionViewSet, QuoteViewSet, ServiceViewSet

router = DefaultRouter()
router.register("leads", LeadViewSet)
router.register("customers", CustomerViewSet)
router.register("contacts", ContactViewSet)
router.register("properties", PropertyViewSet)
router.register("services", ServiceViewSet)
router.register("price-versions", PriceVersionViewSet)
router.register("quotes", QuoteViewSet)
router.register("work-orders", WorkOrderViewSet)
router.register("workers", WorkerProfileViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("inventory-items", InventoryItemViewSet)
router.register("stock-movements", StockMovementViewSet)
router.register("campaigns", CampaignViewSet)
router.register("coupons", CouponViewSet)
router.register("notification-templates", NotificationTemplateViewSet)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/auth/", include((auth_urls, "auth"))),
    path("api/v1/", include(router.urls)),
    path("private-files/<uuid:pk>/", private_file, name="private-file"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

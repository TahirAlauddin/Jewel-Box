from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, InvoiceItemViewSet

router = DefaultRouter()
router.register(r'', InvoiceViewSet)
router.register(r'items', InvoiceItemViewSet)

urlpatterns = [
    # ... other url patterns ...
] + router.urls

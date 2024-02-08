from rest_framework.routers import DefaultRouter
from .views import OrderViewSet, OrderImageViewSet

router = DefaultRouter()
router.register(r'list', OrderViewSet)
router.register(r'images', OrderImageViewSet)

urlpatterns = [
    # ... other url patterns ...
] + router.urls

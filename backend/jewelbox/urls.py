from users.views import LoginView

from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.decorators import api_view
from rest_framework_nested import routers

from django.contrib import admin
from django.urls import path, include
from invoices.views import InvoiceViewSet, InvoiceItemViewSet
from customers.views import CustomerViewSet
from orders.views import OrderViewSet, OrderImageViewSet, StoneSpecificationViewSet

from django.conf import settings
from django.conf.urls.static import static

from orders.views import get_latest_order_id, print_production_sheet, download_invoice, create_invoice

router = routers.SimpleRouter()

router.register(r'invoice', InvoiceViewSet)
invoices_router = routers.NestedSimpleRouter(router, 'invoice', lookup='invoice')
invoices_router.register(r'items', InvoiceItemViewSet)

router.register(r'order', OrderViewSet)
order_router = routers.NestedSimpleRouter(router, 'order', lookup='order')
order_router.register(r'images', OrderImageViewSet, basename='order-images')
order_router.register(r'stones', StoneSpecificationViewSet, basename='order-stones')

router.register(r'customer', CustomerViewSet, basename='customer')


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('', include(invoices_router.urls)),
    path('', include(order_router.urls)),
    path('print-production-sheet/', print_production_sheet),
    path('create-invoice/', create_invoice),
    path('download-invoice/<str:invoice_id>/', download_invoice),
    path('get_latest_order_id/<str:abbreviation>/', get_latest_order_id),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('login/', LoginView.as_view(), name='login'),
]


@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'customers': reverse('customer-list', request=request, format=format),
        'orders': reverse('order-list', request=request, format=format),
        'invoices': reverse('invoice-list', request=request, format=format),
        # Add more endpoints as needed
    })

# And in your urls.py, register this view at the API root
urlpatterns += [
    path('', api_root, name='api-root'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)



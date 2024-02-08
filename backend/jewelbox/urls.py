from users.views import LoginView

from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework.decorators import api_view
from rest_framework_nested import routers

from django.contrib import admin
from django.urls import path, include
from invoices.views import InvoiceViewSet, InvoiceItemViewSet
from customers.views import CustomerViewSet
from orders.views import OrderViewSet, OrderImageViewSet


router = routers.SimpleRouter()

router.register(r'invoice', InvoiceViewSet)
invoices_router = routers.NestedSimpleRouter(router, 'invoice', lookup='invoice')
invoices_router.register(r'items', InvoiceItemViewSet)

router.register(r'order', OrderViewSet)
order_router = routers.NestedSimpleRouter(router, 'order', lookup='order')
order_router.register(r'images', OrderImageViewSet)

router.register(r'customer', CustomerViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),
    path('', include(invoices_router.urls)),
    path('', include(order_router.urls)),
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
]

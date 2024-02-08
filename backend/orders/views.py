from rest_framework import viewsets
from .models import Order, OrderImage
from .serializers import OrderSerializer, OrderImageSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer


class OrderImageViewSet(viewsets.ModelViewSet):
    queryset = OrderImage.objects.all()
    serializer_class = OrderImageSerializer

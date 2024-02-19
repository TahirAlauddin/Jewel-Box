from rest_framework import viewsets
from .models import Order, OrderImage, StoneSpecification
from .serializers import OrderSerializer, OrderImageSerializer, StoneSpecificationSerializer


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer


class OrderImageViewSet(viewsets.ModelViewSet):
    queryset = OrderImage.objects.all()
    serializer_class = OrderImageSerializer


class StoneSpecificationViewSet(viewsets.ModelViewSet):
    queryset = StoneSpecification.objects.all()
    serializer_class = StoneSpecificationSerializer
    
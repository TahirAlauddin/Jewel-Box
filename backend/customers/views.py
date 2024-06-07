from rest_framework import viewsets, filters
from .models import Customer
from .serializers import CustomerSerializer
from django_filters.rest_framework import DjangoFilterBackend

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    search_fields = ['name', 'abbreviation']
    ordering_fields = ['name', 'abbreviation']
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

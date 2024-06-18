from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceItemSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['customer__name', 'invoice_number']
    


class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        invoice_pk = self.kwargs.get('invoice_pk')  # Retrieve the invoice_pk from the URL parameters

        if invoice_pk is not None:
            queryset = queryset.filter(invoice__pk=invoice_pk)  # Filter the queryset by invoice_pk

        return queryset
    
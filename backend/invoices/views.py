from orders.models import Order
import json
from django.views.decorators.csrf import csrf_exempt    
from django.http import JsonResponse
from rest_framework import status
from django.db import transaction
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


@csrf_exempt
def bulk_save_invoice_items(request, invoice_id, *args, **kwargs):

    if request.method == 'POST':
        data = json.loads(request.body)
        
        if not isinstance(data, list):
            return JsonResponse({"error": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not invoice_id:
            return JsonResponse({"error": "Invoice ID is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            
            # Set invoice to empty if an invoice item is deleted
            items = InvoiceItem.objects.filter(invoice__pk=invoice_id)
            for item in items:
                order = Order.objects.get(pk=item.order_id)
                order.invoice = None
                order.invoice_number = None
                order.save()
                item.delete()

            # Set invoice of the orders back after deletion
            invoice = Invoice.objects.get(pk=invoice_id)
            for item in data:
                order = Order.objects.get(pk=item.get('order_id'))
                order.invoice = invoice
                order.invoice_number = invoice_id
                order.save()


            serializer = InvoiceItemSerializer(data=data, many=True)
            if serializer.is_valid():
                serializer.save()
                for order in serializer.data:
                    if order_id:=order.get('order_id'):
                        order = Order.objects.get(pk=order_id)
                        order.invoice = Invoice.objects.get(pk=invoice_id)
                        order.save()

                return JsonResponse(serializer.data, status=status.HTTP_201_CREATED, safe=False)
            else:
                transaction.set_rollback(True)
                return JsonResponse(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    return JsonResponse({"error": "Method not allowed"})

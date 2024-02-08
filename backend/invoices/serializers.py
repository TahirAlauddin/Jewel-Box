from rest_framework import serializers
from .models import Invoice, InvoiceItem

class InvoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Invoice
        fields = ['invoice_number', 'invoice_date', 'customer' ]

class InvoiceItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoiceItem
        fields = ['invoice', 'ref_job_number', 'description', 'the_type', 'quantity', 'unit_price']


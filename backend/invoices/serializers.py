from rest_framework import serializers
from .models import Order, OrderImage, StoneSpecification

class InvoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order
        fields = ['id', 'invoice_number', 'invoice_date', 'customer' ]

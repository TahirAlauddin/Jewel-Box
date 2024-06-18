from rest_framework import serializers
from .models import Invoice, InvoiceItem
from datetime import datetime
from customers.models import Customer

class DateFromDateTimeField(serializers.DateField):
    def to_representation(self, value):
        # Convert datetime to date
        if isinstance(value, datetime):
            value = value.date()
        return super().to_representation(value)

    def to_internal_value(self, data):
        # Ensure the incoming value is treated as a date
        date_value = super().to_internal_value(data)
        return date_value

class InvoiceSerializer(serializers.ModelSerializer):
    total_price = serializers.SerializerMethodField(read_only=True)
    invoice_number = serializers.CharField()  
    customer_name = serializers.SerializerMethodField(read_only=True)  
    date_in = DateFromDateTimeField()
    address = serializers.SerializerMethodField(read_only=True)
    customer = serializers.HyperlinkedRelatedField(view_name='customer-detail',
                                                    queryset=Customer.objects.all())

    class Meta:
        model = Invoice
        fields = ['invoice_number', 'invoice_date', 'customer', 
                  'total_price', 'customer_name', 
                  'shipping_address', 'date_in', 'address']

    def get_address(self, obj):
        return obj.customer.address if obj.customer else ''

    def get_total_price(self, obj):
        # Assuming `obj.items.all()` returns all items related to the invoice and each item has a `price` attribute
        return sum(item.unit_price for item in obj.items.all() if item.unit_price)

    def get_total_quantity(self, obj):
        # Assuming `obj.items.all()` returns all items related to the invoice and each item has a `price` attribute
        return sum(item.quantity for item in obj.items.all())

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def update(self, instance, validated_data):
        invoice_number = validated_data.get('invoice_number', None)
        previous_invoiceID = instance.pk
        if invoice_number:
            # Assuming the logic to clone and create a new object is already handled elsewhere
            instance.invoice_number = invoice_number
            new_instance = super().update(instance, validated_data)

            # After saving the new instance with the updated order_id, transfer the invoice items and delete the old instance
            if new_instance.pk == instance.pk and previous_invoiceID != invoice_number:  # Ensure the new instance is different
                # Transfer all invoice items from the old invoice to the new invoice
                old_invoice = Invoice.objects.get(invoice_number=previous_invoiceID)
                InvoiceItem.objects.filter(invoice=old_invoice).update(invoice=new_instance)
                
                # Delete the previous instance
                old_invoice.delete()

            return new_instance  # Return the new instance as the updated object
        else:
            # If order_id is not provided in the update, proceed as usual
            return super().update(instance, validated_data)
        
class InvoiceItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'order_id', 'ref_job_number', 'description', 'the_type', 'quantity', 'unit_price']


from django.utils.timezone import now
from django.db import models
from django.db.models.functions import Substr, Cast
from orders.models import Order

class Invoice(models.Model):
    """
    A Django model representing an invoice with details such as company
    information, client, shipping, and line items.
    """
    invoice_number = models.CharField(max_length=20, unique=True, primary_key=True)
    invoice_date = models.DateField()
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL,
                                 null=True)
    shipping_address = models.CharField(max_length=255, null=True, blank=True)
    date_in = models.DateTimeField(auto_now_add=True, blank=True) 
    
    # New method to get related orders
    def get_related_orders(self):
        return self.orders.all()
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"

    def __repr__(self):
        return f"<Invoice {self.invoice_number} dated {self.invoice_date}>"


    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Extract abbreviation from customer name (first two letters as an example)
            abbreviation = self.customer.abbreviation.upper()
            year = now().year % 100  # Get last two digits of the year

            # Find the last invoice_number for this customer and year, if any
            latest_invoice = Invoice.objects.filter(invoice_number__startswith=f'{abbreviation}{year}')\
                                                .annotate(numerical_part=Cast(
                                                    Substr('invoice_number', 5, 100),
                                                    output_field=models.IntegerField()))\
                                                .order_by('-numerical_part').first()
            if latest_invoice:
                # Extract the last sequence number and increment
                last_sequence = int(latest_invoice.invoice_number[5:])
                new_sequence = last_sequence + 1
            else:
                # If no existing order, start with 1
                new_sequence = 1

            # Handle sequence overflow
            if new_sequence > 999:
                self.invoice_number = f"{abbreviation}{year:02d}{new_sequence:04d}"
            else:
                # Format new invoice_number
                self.invoice_number = f"{abbreviation}{year:02d}{new_sequence:03d}"

        super(Invoice, self).save(*args, **kwargs)

    class Meta:
        ordering = ['-date_in']

    def delete(self, *args, **kwargs):
        print("Deleted")

        # Set the status to None for all linked orders before deleting the invoice
        linked_orders = Order.objects.filter(invoice=self)
        linked_orders.update(invoice_number=None)
        super().delete(*args, **kwargs)


class InvoiceItem(models.Model):
    """
    A Django model representing an item on an invoice, including description,
    type, quantity, and price.
    """
    order_id = models.CharField(max_length=10, blank=True, null=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    ref_job_number = models.CharField(max_length=50, blank=True, null=True)
    description = models.CharField(max_length=255, blank=True, null=True)
    the_type = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.PositiveIntegerField(blank=True, default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2,
                                     default=0, blank=True, null=True)

    def __str__(self):
        return f"{self.description} - {self.quantity} * {self.unit_price}"

    def get_total_price(self):
        """
        Returns the total price for this item (unit price * quantity).
        """
        return self.unit_price * self.quantity

    @property
    def total_price(self):
        """
        A property to easily access the total price of an item.
        """
        return self.get_total_price()

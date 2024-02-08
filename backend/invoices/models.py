from django.utils.timezone import now
from django.db import models


class Invoice(models.Model):
    """
    A Django model representing an invoice with details such as company
    information, client, shipping, and line items.
    """
    invoice_number = models.CharField(max_length=20, unique=True, primary_key=True)
    invoice_date = models.DateField()
    customer = models.ForeignKey('customers.Customer', on_delete=models.SET_NULL,
                                 null=True)
    
    # New method to get related orders
    def get_related_orders(self):
        return self.orders.all()
    
    def get_total_price(self):
        return self.orders.values_list('total_price', flat=True)

    def __str__(self):
        return f"Invoice {self.invoice_number}"

    def __repr__(self):
        return f"<Invoice {self.invoice_number} dated {self.invoice_date}>"


    def save(self, *args, **kwargs):
        if not self.order_id:
            # Extract abbreviation from customer name (first two letters as an example)
            abbreviation = self.customer.abbreviation.upper()
            year = now().year % 100  # Get last two digits of the year

            # Find the last order_id for this customer and year, if any
            latest_invoice = Invoice.objects.filter(order_id__startswith=f'{abbreviation}{year}').order_by('date_in').last()

            if latest_invoice:
                # Extract the last sequence number and increment
                last_sequence = int(latest_invoice.order_id[4:])
                new_sequence = last_sequence + 1
            else:
                # If no existing order, start with 1
                new_sequence = 1

            # Handle sequence overflow
            if new_sequence > 999:
                self.order_id = f"{abbreviation}{year:02d}{new_sequence:04d}"
            else:
                # Format new order_id
                self.order_id = f"{abbreviation}{year:02d}{new_sequence:03d}"

        super(Invoice, self).save(*args, **kwargs)


class InvoiceItem(models.Model):
    """
    A Django model representing an item on an invoice, including description,
    type, quantity, and price.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    ref_job_number = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    the_type = models.CharField(max_length=50)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

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


# dding a method to the Invoice model to calculate the total of all items
def calculate_total(self):
    """
    Calculates the total of all the invoice items.
    """
    return sum(item.get_total_price() for item in self.items.all())


class InvoiceItem(models.Model):
    """
    A Django model representing an item on an invoice, including description,
    type, quantity, and price.
    """
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    ref_job_number = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    type = models.CharField(max_length=50)
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


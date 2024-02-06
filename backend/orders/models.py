from django.db import models
from datetime import datetime

class OrderImage(models.Model):
    """
    A Django model representing an image related to an order.
    """
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='images/orders/')
    caption = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Image for Order {self.order.id} - {self.caption or 'No Caption'}"


class Order(models.Model):
    """
    A Django model representing an order form, including customer information,
    order details, expenses, and stone specifications.
    """
    #? Main Attributes
    customer = models.CharField(max_length=255)
    size = models.CharField(max_length=10)
    order_number = models.CharField(max_length=20)
    ct_number = models.CharField(max_length=20)
    job_number = models.CharField(max_length=20)
    kt_number = models.CharField(max_length=20)
    date_in = models.DateField() # May add auto_now_add=True and blank=True
    invoice_number = models.CharField(max_length=20)
    date_due = models.DateField()
    metal_type = models.CharField(max_length=100)
    setter = models.CharField(max_length=255)
    # Changed on the request of the client, from 'type' to 'color'
    color = models.CharField(max_length=100)
    shipping_details = models.CharField(max_length=255)
    
    #? Expenses
    setting_cost = models.DecimalField(max_digits=10, decimal_places=2)
    polish_cost = models.DecimalField(max_digits=10, decimal_places=2)
    rhodium_cost = models.DecimalField(max_digits=10, decimal_places=2)
    soldering_cost = models.DecimalField(max_digits=10, decimal_places=2)
    miscellaneous_cost = models.DecimalField(max_digits=10, decimal_places=2)
    color_stone_cost = models.DecimalField(max_digits=10, decimal_places=2)
    finding_cost = models.DecimalField(max_digits=10, decimal_places=2)
    diamonds_cost = models.DecimalField(max_digits=10, decimal_places=2)
    mounting_cost = models.DecimalField(max_digits=10, decimal_places=2)
    others = models.DecimalField(max_digits=10, decimal_places=2)

    # Non-montery values
    diamond_weight = models.DecimalField(max_digits=10, decimal_places=2)
    dpc = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Totals
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Keep these as BooleanFields
    is_polish = models.BooleanField(default=False)
    is_rush = models.BooleanField(default=False)
    is_rhodium = models.BooleanField(default=False)
    is_repair = models.BooleanField(default=False)
    is_order = models.BooleanField(default=False)
    is_stamp = models.BooleanField(default=False)
    is_clean = models.BooleanField(default=False)

    
    # Renamed and changed to CharFields to add information based on the condition
    polish_detail = models.CharField(max_length=255, blank=True, null=True)
    rush_detail = models.CharField(max_length=255, blank=True, null=True)
    rhodium_detail = models.CharField(max_length=255, blank=True, null=True)
    repair_detail = models.CharField(max_length=255, blank=True, null=True)
    order_detail = models.CharField(max_length=255, blank=True, null=True)
    stamp_detail = models.CharField(max_length=255, blank=True, null=True)
    clean_detail = models.CharField(max_length=255, blank=True, null=True)

    #? Notes and location checkboxes
    order_notes = models.TextField(blank=True, null=True)
           
    #? Foreign Keys
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, null=True,
                                blank=True, related_name='orders')

    # Override the str method to return a more descriptive name
    def __str__(self):
        return f"Order {self.order_number} for {self.client_name}"

    # Additional methods, such as calculating totals or setting defaults, could be added here

    def calculate_total_cost(self):
        """
        Calculates the total cost of the order by summing the individual expenses.
        """
        expenses = [
            self.setting_cost, self.polish_cost, self.rhodium_cost,
            self.soldering_cost, self.miscellaneous_cost, self.color_stone_cost,
            self.finding_cost, self.diamonds_cost, self.mounting_cost,
            self.others # Any other costs
        ]
        self.total_cost = sum(expense for expense in expenses if expense)
        self.save()

    def update_stone_details(self, **kwargs):
        """
        Updates stone details for the order. Accepts keyword arguments for each stone attribute.
        """
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.save()


    def __repr__(self):
        """
        Unambiguous representation of the object, useful in debugging.
        """
        return f"<Order: {self.order_number}, Client: {self.client_name}, Date In: {self.date_in}>"
    

class StoneSpecification(models.Model):
    """
    A Django model representing specifications of a stone related to an order.
    """
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='stones')
    stone_type = models.CharField(max_length=100)
    cut = models.CharField(max_length=100)
    stone_number = models.CharField(max_length=50, blank=True, null=True)
    quantity = models.PositiveIntegerField()
    length = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    width = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    carat_total = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"{self.order} {self.stone_type[:5]} {self.quantity}pcs"


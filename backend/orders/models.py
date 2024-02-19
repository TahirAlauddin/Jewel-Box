from django.db import models
from django.utils.timezone import now

main_attributes_kwargs = dict(max_length=20, blank=True, null=True)
cost_kwargs = dict(max_digits=10, decimal_places=2, blank=True, null=True)
stones_kwargs = dict(max_digits=5, decimal_places=2, blank=True, null=True)
nullable_kwargs = dict(blank=True, null=True)

class OrderImage(models.Model):
    """
    A Django model representing an image related to an order.
    """
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='images/orders/')
    caption = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"Image for Order {self.order.order_id} - {self.caption or 'No Caption'}"


class Order(models.Model):
    """
    A Django model representing an order form, including customer information,
    order details, expenses, and stone specifications.
    """
    #? Main Attributes
    order_id = models.CharField(max_length=10, primary_key=True, 
                                unique=True, blank=True)
    customer = models.ForeignKey('customers.Customer',
                                null=True, related_name='orders',
                                on_delete=models.SET_NULL)
    size = models.CharField(**main_attributes_kwargs)
    order_number = models.CharField(**main_attributes_kwargs)
    ct_number = models.CharField(**main_attributes_kwargs)
    job_number = models.CharField(**main_attributes_kwargs)
    kt_number = models.CharField(**main_attributes_kwargs)
    invoice_number = models.CharField(**main_attributes_kwargs)
    shipping_details = models.CharField(max_length=255, **nullable_kwargs)
    metal_type = models.CharField(max_length=100, **nullable_kwargs)
    color = models.CharField(max_length=100, **nullable_kwargs)
    setter = models.CharField(max_length=255, **nullable_kwargs)
    date_in = models.DateTimeField(auto_now_add=True, **nullable_kwargs) # May add auto_now_add=True and blank=True, null=True
    date_due = models.DateField()
    
    #? Expenses
    setting_cost = models.DecimalField(**cost_kwargs)
    polish_cost = models.DecimalField(**cost_kwargs)
    rhodium_cost = models.DecimalField(**cost_kwargs)
    soldering_cost = models.DecimalField(**cost_kwargs)
    miscellaneous_cost = models.DecimalField(**cost_kwargs)
    color_stone_cost = models.DecimalField(**cost_kwargs)
    finding_cost = models.DecimalField(**cost_kwargs)
    diamonds_cost = models.DecimalField(**cost_kwargs)
    mounting_cost = models.DecimalField(**cost_kwargs)
    others = models.DecimalField(**cost_kwargs)

    # Non-montery values
    diamond_weight = models.DecimalField(**cost_kwargs)
    dpc = models.DecimalField(**cost_kwargs)
    
    # Totals
    total_cost = models.DecimalField(**cost_kwargs)
    sale_price = models.DecimalField(**cost_kwargs)
    
    # Keep these as BooleanFields
    checkboxes_kwargs = dict(default=False, **nullable_kwargs)
    is_polish = models.BooleanField(**checkboxes_kwargs)
    is_rush = models.BooleanField(**checkboxes_kwargs)
    is_rhodium = models.BooleanField(**checkboxes_kwargs)
    is_repair = models.BooleanField(**checkboxes_kwargs)
    is_order = models.BooleanField(**checkboxes_kwargs)
    is_stamp = models.BooleanField(**checkboxes_kwargs)
    is_clean = models.BooleanField(**checkboxes_kwargs)

    # Renamed and changed to CharFields to add information based on the condition
    details_kwargs = dict(max_length=255, blank=True, null=True)
    polish_detail = models.CharField(**details_kwargs)
    rush_detail = models.CharField(**details_kwargs)
    rhodium_detail = models.CharField(**details_kwargs)
    repair_detail = models.CharField(**details_kwargs)
    order_detail = models.CharField(**details_kwargs)
    stamp_detail = models.CharField(**details_kwargs)
    clean_detail = models.CharField(**details_kwargs)

    #? Notes and location checkboxes
    order_notes = models.TextField(blank=True, null=True)
           
    #? Foreign Keys
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, null=True,
                                blank=True, related_name='orders')

    # Override the str method to return a more descriptive name
    def __str__(self):
        return f"Order {self.order_id} for {self.customer}"

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
        return f"<Order: {self.order_id}, Customer: {self.customer}, Date In: {self.date_in}>"
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            # Extract abbreviation from customer name (first two letters as an example)
            abbreviation = self.customer.abbreviation.upper()
            year = now().year % 100  # Get last two digits of the year

            # Find the last order_id for this customer and year, if any
            latest_order = Order.objects.filter(order_id__startswith=f'{abbreviation}{year}').order_by('date_in').last()

            print(latest_order)
            if latest_order:
                # Extract the last sequence number and increment
                last_sequence = int(latest_order.order_id[4:])
                print(last_sequence)
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

        super(Order, self).save(*args, **kwargs)



class StoneSpecification(models.Model):
    """
    A Django model representing specifications of a stone related to an order.
    """
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='stones')
    stone_type = models.CharField(max_length=100)
    cut = models.CharField(max_length=100)
    stone_number = models.CharField(max_length=50, blank=True, null=True)
    carat_total = models.DecimalField(max_digits=5, decimal_places=2)
    quantity = models.PositiveIntegerField()
    length = models.DecimalField(**stones_kwargs)
    width = models.DecimalField(**stones_kwargs)
    height = models.DecimalField(**stones_kwargs)

    def __str__(self):
        return f"{self.order} {self.stone_type[:5]} {self.quantity}pcs"

    

from django.db import models
from utils import create_barcode
from django.core.files import File
from django.conf import settings
from django.db.models.signals import pre_save, pre_delete
from django.dispatch import receiver
import os


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


    def delete(self, *args, **kwargs):
        # Delete the image file associated with this instance
        self.image.delete(save=False)
        super(OrderImage, self).delete(*args, **kwargs)


@receiver(pre_save, sender=OrderImage)
def delete_old_image(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_image = OrderImage.objects.get(pk=instance.pk).image
        except OrderImage.DoesNotExist:
            return
        else:
            new_image = instance.image
            if old_image and old_image.url != new_image.url:
                if os.path.isfile(old_image.path):
                    os.remove(old_image.path)

@receiver(pre_delete, sender=OrderImage)
def delete_current_image(sender, instance, **kwargs):
    try:
        os.remove(instance.image.path)
    except Exception as e:
        print(e)
                    

class Order(models.Model):
    """
    A Django model representing an order form, including customer information,
    order details, expenses, and stone specifications.
    """
    #? Main Attributes
    order_id = models.CharField(max_length=10, unique=True, blank=True,
                                primary_key=True)
    customer = models.ForeignKey('customers.Customer',
                                null=True, related_name='orders',
                                on_delete=models.SET_NULL)
    size = models.CharField(**main_attributes_kwargs)
    resize = models.CharField(**main_attributes_kwargs)
    ct_number = models.CharField(**main_attributes_kwargs)
    job_number = models.CharField(**main_attributes_kwargs)
    kt_number = models.CharField(**main_attributes_kwargs)
    invoice_number = models.CharField(**main_attributes_kwargs)
    shipping_details = models.CharField(max_length=255, **nullable_kwargs)
    metal = models.CharField(max_length=100, **nullable_kwargs)
    type = models.CharField(max_length=100, **nullable_kwargs)
    color = models.CharField(max_length=100, **nullable_kwargs)
    setter = models.CharField(max_length=255, **nullable_kwargs)
    quantity = models.SmallIntegerField(default=1, blank=True)

    date_in = models.DateTimeField(auto_now_add=True,
                                   blank=True) # May add auto_now_add=True and blank=True, null=True
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
    total_cost = models.DecimalField(**cost_kwargs, default=0)
    sale_price = models.DecimalField(**cost_kwargs, default=0)
    
    # Keep these as BooleanFields
    checkboxes_kwargs = dict(default=False, **nullable_kwargs)
    is_polish = models.BooleanField(**checkboxes_kwargs)
    is_rush = models.BooleanField(**checkboxes_kwargs)
    is_rhodium = models.BooleanField(**checkboxes_kwargs)
    is_repair = models.BooleanField(**checkboxes_kwargs)
    is_order = models.BooleanField(**checkboxes_kwargs)
    is_stamp = models.BooleanField(**checkboxes_kwargs)
    is_clean = models.BooleanField(**checkboxes_kwargs)
    is_set = models.BooleanField(**checkboxes_kwargs)

    # Renamed and changed to CharFields to add information based on the condition
    details_kwargs = dict(max_length=255, blank=True, null=True)
    polish_detail = models.CharField(**details_kwargs)
    rush_detail = models.CharField(**details_kwargs)
    rhodium_detail = models.CharField(**details_kwargs)
    repair_detail = models.CharField(**details_kwargs)
    order_detail = models.CharField(**details_kwargs)
    stamp_detail = models.CharField(**details_kwargs)
    clean_detail = models.CharField(**details_kwargs)
    set_detail = models.CharField(**details_kwargs)

    #? Notes and location checkboxes
    order_notes = models.TextField(blank=True, null=True)
           
    #? Foreign Keys
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, null=True,
                                blank=True, related_name='orders')
    
    barcode = models.FileField(upload_to='barcodes', null=True, blank=True)
    barcode_generated = models.BooleanField(default=False)
    

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
    
    def generate_barcode(self):

        print("Generating barcode")
        # Define the directory for barcode images
        folder_path = os.path.join(settings.MEDIA_ROOT, 'barcode')
        # Ensure the directory exists
        os.makedirs(folder_path, exist_ok=True)

        # Construct the file name and path
        file_name = f"{self.order_id} - barcode.png"
        file_path = os.path.join(folder_path, file_name)

        # Check if updating and barcode exists, delete the old barcode file
        if self.pk and self.barcode and hasattr(self.barcode, 'path') and os.path.exists(self.barcode.path):
            os.remove(self.barcode.path)

        # Generate the barcode and save it to the specified file path
        create_barcode(self.order_id, file_path)

        file_path += '.png' #!Important

        # Now, attach the file to the model's FileField
        with open(file_path, 'rb') as file:
            self.barcode.save(file_name, File(file), save=False)

        # Remove temp file
        os.remove(file_path)

    def save(self, *args, **kwargs):
        if not self.barcode_generated:
            self.generate_barcode()
            self.barcode_generated = True  # Ensure barcode is generated only once
        super(Order, self).save(*args, **kwargs)

    class Meta:
        ordering = ['-date_in']
        

class StoneSpecification(models.Model):
    """
    A Django model representing specifications of a stone related to an order.
    """
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='stones')
    stone_type = models.CharField(max_length=100, blank=True, null=True)
    cut = models.CharField(max_length=100, blank=True, null=True)
    stone_number = models.CharField(max_length=50, blank=True, null=True)
    carat_total = models.DecimalField(**stones_kwargs)
    quantity = models.PositiveIntegerField(blank=True, null=True, default=1)
    length = models.DecimalField(**stones_kwargs)
    width = models.DecimalField(**stones_kwargs)
    height = models.DecimalField(**stones_kwargs)

    def __str__(self):
        return f"{self.order} {self.stone_type[:5]} {self.quantity}pcs"

    
    def __getitem__(self, key):
        """
        Enable accessing stone specifications using dictionary-like syntax.
        Example: object.get('stone_type') or object.get('height')
        """
        return getattr(self, key, None)
    
    
    def get_attribute(self, key, default=None):
        """
        Enable accessing stone specifications using dictionary-like syntax.
        Example: object.get('stone_type') or object.get('height')
        """
        return getattr(self, key, None)
    
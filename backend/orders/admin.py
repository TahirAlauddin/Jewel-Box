from django.contrib import admin
from .models import *
from django.forms import ModelForm

class OrderAdminForm(ModelForm):
    class Meta:
        model = Order
        fields = '__all__'


class OrderImageInline(admin.TabularInline):
    model = OrderImage
    extra = 2  # Number of empty inline forms to display

class OrderAdmin(admin.ModelAdmin):
    form = OrderAdminForm
    model = Order
    inlines = [
        OrderImageInline,
    ]
    fieldsets = [
        # Other fieldsets for organizing remaining fields
        ('Order Details', {'fields': [
            'customer', 'size', 'order_number', 'ct_number', 'job_number', 'kt_number', 
            'date_in', 'invoice_number', 'date_due', 'metal_type', 'setter', 'color', 
            'shipping_details'
            ]}),
        ('Expenses', {'fields': [
            'setting_cost', 'polish_cost', 'rhodium_cost', 'soldering_cost', 
            'miscellaneous_cost', 'color_stone_cost', 'finding_cost', 'diamonds_cost', 
            'mounting_cost', 'others'
            ]}),
        ('Order Specifications', {'fields': [('is_polish', 'is_rush', 'is_rhodium', 
                                          'is_repair', 'is_order', 'is_stamp', 
                                          'is_clean')]}),
        ('Order Specifications Detail', {'fields': [('polish_detail', 'rush_detail', 'rhodium_detail', 
                                          'repair_detail', 'order_detail', 'stamp_detail', 
                                          'clean_detail')]})
    ]

admin.site.register(Order, OrderAdmin)

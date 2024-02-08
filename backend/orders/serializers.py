from rest_framework import serializers
from .models import Order, OrderImage, StoneSpecification

class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ['id', 'image', 'caption', 'order']

class StoneSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoneSpecification
        fields = ['id', 'stone_type', 'cut', 'stone_number', 'quantity', 'length', 
                  'width', 'height', 'carat_total']

class OrderSerializer(serializers.ModelSerializer):
    images = OrderImageSerializer(many=True, read_only=True)
    stones = StoneSpecificationSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        read_only = ['date_in', 'order_id']
        fields = [
            #? Main Attributes
            'order_id', 'customer', 'size', 'metal_type', 'setter', 'color', 'shipping_details', 
            'date_due', 'date_in',
            #? Numbers/Identifiers
            'order_number', 'ct_number', 'job_number', 'kt_number', 'invoice_number',  
            #? Checkboxes
            'is_polish', 'is_rush', 'is_rhodium', 'is_repair',
            'is_order', 'is_stamp', 'is_clean', 
            #? Checboxes' Details Fields
            'polish_detail', 'rush_detail', 'rhodium_detail', 'repair_detail',
            'order_detail', 'stamp_detail', 'clean_detail', 
            #? Expenses/Costs
            'setting_cost', 'polish_cost', 'rhodium_cost', 'soldering_cost', 
            'miscellaneous_cost', 'color_stone_cost', 'finding_cost', 
            'diamonds_cost', 'mounting_cost', 'others',
            #? Others
            'images', 'stones',  'order_notes']

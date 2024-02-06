from rest_framework import serializers
from .models import Order, OrderImage, StoneSpecification

class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ['id', 'image', 'caption']

class StoneSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoneSpecification
        fields = ['id', 'stone_type', 'cut', 'stone_number', 'quantity', 'length', 'width', 'height', 'carat_total']

class OrderSerializer(serializers.ModelSerializer):
    images = OrderImageSerializer(many=True, read_only=True)
    stones = StoneSpecificationSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'customer', 'size', 'order_number', 'ct_number', 'job_number', 'kt_number', 'date_in', 
            'invoice_number', 'date_due', 'metal_type', 'setter', 'type', 'polish_detail', 'rush_detail', 
            'rhodium_detail', 'repair_detail', 'order_detail', 'stamp_detail', 'clean_detail', 'is_polish', 
            'is_rush', 'is_rhodium', 'is_repair', 'is_order', 'is_stamp', 'is_clean', 'images', 'stones'
        ]

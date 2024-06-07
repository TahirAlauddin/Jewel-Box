from rest_framework import serializers
from .models import Order, OrderImage, StoneSpecification
from rest_framework_nested.relations import NestedHyperlinkedRelatedField
# from django.contrib.contenttypes.models import ContentType
from customers.models import Customer

class OrderImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderImage
        fields = ['id', 'image', 'caption', 'order']

class StoneSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoneSpecification
        fields = ['id', 'stone_type', 'cut', 'stone_number', 'quantity', 'length', 
                  'width', 'height', 'carat_total', 'order']

class OrderSerializer(serializers.ModelSerializer):
    images = NestedHyperlinkedRelatedField(view_name='order-images-detail',
                                            many=True,
                                            parent_lookup_kwargs={'order_pk': 'order__pk'},
                                            read_only=True)
    stones = StoneSpecificationSerializer(many=True, read_only=True)
    barcode = serializers.FileField(read_only=True)
    order_id = serializers.CharField()
    customer = serializers.HyperlinkedRelatedField(view_name='customer-detail',
                                                   queryset=Customer.objects.all())
    
    def create(self, validated_data):
        order_id = validated_data.get('order_id', None)
        order = Order(**validated_data)
        if order_id:
            order.order_id = order_id
        order.save()
        return order


    def update(self, instance, validated_data):
        order_id = validated_data.get('order_id', None)
        previous_orderID = instance.pk
        if order_id:
            # Assuming the logic to clone and create a new object is already handled elsewhere
            instance.order_id = order_id
            new_instance = super().update(instance, validated_data)
            
            # After saving the new instance with the updated order_id, delete the old instance
            if new_instance.pk == instance.pk and previous_orderID != order_id:  # Ensure the new instance is different
                Order.objects.get(order_id=previous_orderID).delete()  # Delete the previous instance
            
            return new_instance  # Return the new instance as the updated object
        else:
            # If order_id is not provided in the update, proceed as usual
            return super().update(instance, validated_data)


    class Meta:
        model = Order
        read_only = ['date_in', 'order_id']
        fields = [
            #? Main Attributes
            'order_id', 'customer', 'size', 'resize', 'metal', 'type', 'setter', 'color', 
            'date_due', 'date_in',
            #? Numbers/Identifiers
            'ct_number', 'job_number', 'kt_number', 'invoice_number',  
            #? Checkboxes
            'is_polish', 'is_rush', 'is_rhodium', 'is_repair',
            'is_order', 'is_stamp', 'is_clean', 'is_set',
            #? Checboxes' Details Fields
            'polish_detail', 'rush_detail', 'rhodium_detail', 'repair_detail',
            'order_detail', 'stamp_detail', 'clean_detail', 'set_detail',
            #? Expenses/Costs
            'setting_cost', 'polish_cost', 'rhodium_cost', 'soldering_cost', 
            'miscellaneous_cost', 'color_stone_cost', 'finding_cost', 
            'diamonds_cost', 'mounting_cost', 'others',
            'total_cost', 'sale_price', 'barcode_generated',
            #? Non-monetary values
            'diamond_weight', 'dpc', 'barcode',
            #? Others
            'images', 'stones',  'order_notes', 'shipping_details', 
        ]
        
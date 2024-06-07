from django.db import models


class Customer(models.Model):
    """
    A Django model representing the customer
    """
    name = models.CharField(max_length=255)
    abbreviation = models.CharField(max_length=3, unique=True)
    address = models.CharField(max_length=255, default='')
    phone_number = models.CharField(max_length=12, default='000000000000')
    
    def __str__(self):
        return 'Ab: ' + self.abbreviation + ' Name: ' + self.name
    
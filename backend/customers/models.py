from django.db import models


class Customer(models.Model):
    """
    A Django model representing the customer
    """
    name = models.CharField(max_length=255)
    abbreviation = models.CharField(max_length=3)


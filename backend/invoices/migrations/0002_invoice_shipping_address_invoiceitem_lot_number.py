# Generated by Django 4.2.13 on 2024-05-22 09:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='invoice',
            name='shipping_address',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='invoiceitem',
            name='lot_number',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]

# Generated by Django 4.2.10 on 2024-02-13 09:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='order_id',
            field=models.CharField(blank=True, max_length=10, primary_key=True, serialize=False, unique=True),
        ),
    ]
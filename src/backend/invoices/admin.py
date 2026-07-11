from django.contrib import admin
from .models import Invoice, InvoiceItem
from django.forms import ModelForm


class InvoiceAdminForm(ModelForm):
    class Meta:
        model = Invoice
        fields = '__all__'


class InvoiceImageInline(admin.TabularInline):
    model = InvoiceItem
    extra = 2  # Number of empty inline forms to display

class InvoiceAdmin(admin.ModelAdmin):
    form = InvoiceAdminForm
    model = Invoice
    inlines = [
        InvoiceImageInline,
    ]
    
admin.site.register(Invoice, InvoiceAdmin)

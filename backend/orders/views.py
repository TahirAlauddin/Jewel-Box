import win32print
from django.db.models import IntegerField
from django.db.models.functions import Cast, Substr
from django.http import HttpResponse, JsonResponse
from rest_framework import viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.status import HTTP_404_NOT_FOUND
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt

from .models import Order, OrderImage, StoneSpecification
from .serializers import (  OrderSerializer,
                            OrderImageSerializer,
                            StoneSpecificationSerializer
                        )
from . import fill_sheet
from .printer import print_sheet
from invoices import fill_sheet as invoice_fill_sheet
from customers.models import Customer
import zipfile
import json
import os
from django.contrib.contenttypes.models import ContentType

Invoice = ContentType.objects.get(app_label='invoices', model='invoice').model_class()
InvoiceItem = ContentType.objects.get(app_label='invoices', model='invoiceitem').model_class()


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['customer__name', 'order_id', 'invoice_number', 'job_number']
    filterset_fields = {'customer__name': ['exact', 'icontains'],
                        'customer__abbreviation': ['exact'],
                        'order_id': ['exact'],
                        'invoice_number': ['exact'], 
                        'job_number': ['exact'],
                        'date_due': ['gte', 'lte', 'exact'],
}
    ordering_fields = ['customer__name', 'order_id', 'invoice_number', 'job_number', 'date_due'] 

    def get_queryset(self):
        queryset = Order.objects.all()
        searchInput = self.request.query_params.get('customer_searchInput', None)

        if searchInput:
            queryset = queryset.filter(
                Q(customer__name__icontains=searchInput) | 
                Q(customer__abbreviation=searchInput)
            )

        return queryset
    
    
class OrderImageViewSet(viewsets.ModelViewSet):
    queryset = OrderImage.objects.all()
    serializer_class = OrderImageSerializer


    def get_queryset(self):
        """
        Optionally restricts the returned images to a given order,
        by filtering against a `order_pk` query parameter in the URL.
        """
        queryset = super().get_queryset()
        order_pk = self.kwargs.get('order_pk')  # Retrieve the order_pk from the URL parameters

        if order_pk is not None:
            queryset = queryset.filter(order__pk=order_pk)  # Filter the queryset by order_pk
        
        return queryset
    
    
class StoneSpecificationViewSet(viewsets.ModelViewSet):
    queryset = StoneSpecification.objects.all()
    serializer_class = StoneSpecificationSerializer
    
    
    def get_queryset(self):
        """
        Optionally restricts the returned stones to a given order,
        by filtering against a `order_pk` query parameter in the URL.
        """
        queryset = super().get_queryset()
        order_pk = self.kwargs.get('order_pk')  # Retrieve the order_pk from the URL parameters

        if order_pk is not None:
            queryset = queryset.filter(order__pk=order_pk)  # Filter the queryset by order_pk
        
        return queryset
    
@api_view(['GET'])
def get_latest_order_id(request, abbreviation):
    try:
        customer = Customer.objects.get(abbreviation=abbreviation)
    except:
        return Response({'error': 'No Customer Found with that Abbreviation'}, 
                status=HTTP_404_NOT_FOUND)

    order = Order.objects.filter(customer=customer).order_by('order_id').last()
    print(order)
    order = Order.objects.filter(customer=customer).annotate(
        numeric_part=Substr('order_id', 4, 100)  # Extract the substring starting at the 4th character
    ).annotate(
        numeric_part_as_int=Cast('numeric_part', IntegerField())  # Convert to integer
    ).order_by('numeric_part_as_int').last()

    if order:
        return Response({'orderID': order.order_id})
    return Response({'orderID': None})


def generate_excel(order_id, output_file):
    # Query the Order object by order_id
    order = Order.objects.get(order_id=order_id)

    # Prepare data dictionary with order information
    data = {
        'date': order.date_in,
        # 'quantity': order.quantity,
        'size': order.size,
        'resize': order.resize,
        'color': order.color,
        'due_date': order.date_due,
        'client': order.customer.name,
        'order_number': order.order_id,
        'kt': order.kt_number,
        'ct': order.ct_number,
        'rush': order.rush_detail,
        'setter': order.setter,
        'type': order.type,
        'repair': order.repair_detail,
        'order': order.order_detail or '',
        'stamp': order.stamp_detail,
        'set': order.set_detail,
        'stones': list(order.stones.all()),
    }

    text = order.order_notes
    images = [ orderimage.image for orderimage in
               OrderImage.objects.filter(order=order_id) ]
    barcode_image = order.barcode.path if order.barcode else 'orders/barcode.png'

    # Call the main function with order data to generate Excel sheet
    fill_sheet.main(data, text, barcode_image, images, output_file)


def get_data(obj: Order):
    # format: KT, TYPE, COLOR/CT
    the_type = f'{obj.kt_number}' if obj.kt_number else ''
    # format: SET POLISH RHODIUM
    description = 'SET ' if obj.is_set else ''

    if obj.is_polish: description += f'POLISH '
    if obj.is_rhodium: description += f'RHODIUM',
    if obj.type: the_type += f' {obj.type}'
    if obj.color and len(obj.color) > 1:
        the_type += f' {obj.color[0]} /'
    if obj.ct_number: the_type += f' {obj.ct_number}'

    return the_type, description


def print_invoice(invoice, printer):

    print(printer)

    invoice_items_list = []
    invoice_dict = {
        'invoice_number': invoice.invoice_number,
        'date': invoice.invoice_date,
        'client': invoice.customer.name ,
        'ship_to': invoice.shipping_address,
        'to': invoice.customer.address
    }
    # Get the InvoiceItems either created just above, or in case reprinting, from the database 
    invoice_items = InvoiceItem.objects.filter(invoice=invoice)

    for item in invoice_items:
        invoice_items_list.append({
            'order_id': item.order_id,
            'job_number': item.ref_job_number,
            'description': item.description,
            'type': item.the_type,
            'quantity': item.quantity,
            'unit_price': item.unit_price,
        })

    template_path = 'invoices/Invoice.xlsx'
    homedir = os.path.expanduser('~')
    tempdir = os.path.join(homedir, 'JewelBox', 'temporary')
    output_file = os.path.join(tempdir, f'invoice_{invoice.invoice_number}.xlsx')
    response = HttpResponse("Invoices generated successfully.")
    invoice_fill_sheet.main(invoice_dict, invoice_items_list, template_path, output_file)

    # Print the sheet
    result = print_sheet(output_file, printer)

    try:
        with open(output_file, 'rb') as excel_file:
            response = HttpResponse(excel_file.read(),
                                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename={output_file}'
    except Exception as e:
        response = HttpResponse(f'An error occured {e}')

    return response

def create_or_get_invoice(ids, invoiceId):
    invoice = None
    if invoiceId:
        invoice =  Invoice.objects.get(invoice_number=invoiceId)
    else: 
        if len(ids) < 1:
            return HttpResponse('Please provide orders with the request')
    
        order = Order.objects.get(order_id=ids[0])
        # Create invoice, outside of loop
        invoice = Invoice.objects.create(
            invoice_date=order.date_in.date(),  # date_in is a DateTimeField
            customer=order.customer,
            shipping_address=order.shipping_details
        )

    for order_id in ids:
        try:
            # If Invoice id is not provided with request, means creating new invoice
            if not invoiceId:
                order = Order.objects.get(order_id=order_id)
                the_type, description = get_data(order)

                # Create invoice items
                InvoiceItem.objects.create(
                    invoice=invoice,
                    ref_job_number=order.job_number,
                    description=description,
                    the_type=the_type,
                    quantity=order.quantity,
                    unit_price=order.sale_price,
                    order_id=order_id
                )
                # Update order's invoice field
                order.invoice = invoice
                order.invoice_number = invoice.invoice_number
                order.save()
           
        except Order.DoesNotExist:
            # Handle the case where an order with the provided ID does not exist
            pass
    return invoice


@csrf_exempt
def download_invoice(request, invoice_id):
    """
    Takes an invoice ID, queries the items and returns an Excel file.
    """
    # Database
    invoice = Invoice.objects.get(invoice_number=invoice_id)  # Implement this function to retrieve the invoice
    printer = None
    if request.method == "POST":
        printer = json.loads(request.body).get('printer')

    print(printer)
    # Prepare the Excel file
    response = print_invoice(invoice, printer)

    # Return the Excel file as a response
    excel_filename = f'invoice_{invoice_id}.xlsx'

    response = HttpResponse(response.content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename={excel_filename}'

    return response



@csrf_exempt
def create_invoice(request):
    """
    Takes either ids of orders in the database to create an invoice,
    Returns the invoice ID in a JSON response.
    """
    # Request/Json
    body_data = json.loads(request.body.decode('utf-8'))
    ids = body_data.get('ids', [])
    invoiceId = body_data.get('invoice', '')

    # Database
    invoice = create_or_get_invoice(ids, invoiceId)

    # Return the invoice ID as JSON
    return JsonResponse({'invoice_id': invoice.invoice_number})



@csrf_exempt
def print_production_sheet(request):
    responses = []
    # Assuming 'ids' are sent in the request body as JSON data
    body_unicode = request.body.decode('utf-8')
    body_data = json.loads(body_unicode)
    ids = body_data.get('ids', [])

    homedir = os.path.expanduser('~')
    tempdir = os.path.join(homedir, 'JewelBox', 'temporary')

    # Make sure the directory exists 
    if not os.path.exists(tempdir):
        os.mkdir(tempdir)

    for order_id in ids:
        try:
            
            output_file = os.path.join(tempdir, f'order_{order_id}_details.xlsx')
            # Fill the spreadsheet
            generate_excel(order_id, output_file)

            # Append the generated Excel sheet to the responses list
            with open(output_file, 'rb') as excel_file:
                response = HttpResponse(excel_file.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                response['Content-Disposition'] = f'attachment; filename={output_file}'
                responses.append(response)

            # Print the sheet
            print_sheet(output_file, printer_name='Brother QL-1110NWB')
        
        except Exception as e:
            # Handle any exceptions that occur during the process
            print(f"An error occurred while processing order {order_id}: {e}")

    # Return all responses as a single response containing multiple files
    if responses:
        # Merge all responses into a single response
        merged_response = HttpResponse(content_type='application/zip')
        merged_response['Content-Disposition'] = 'attachment; filename=production_sheets.zip'

        # Write each response to the merged response
        with zipfile.ZipFile(merged_response, 'w') as zip_file:
            for idx, response in enumerate(responses, start=1):
                zip_file.writestr(f'order_{idx}_details.xlsx', response.content)

        return merged_response
    else:
        return HttpResponse("No production sheets generated.")


def view_printers_list(request):
    try:
        # Get the list of printers
        printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)]
        print(printers)
        return JsonResponse({"printers": printers})
    except Exception as e:
        return JsonResponse({"error": str(e)})
    
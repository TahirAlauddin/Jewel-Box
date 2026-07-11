from django.utils import timezone
from django.core.management.base import BaseCommand
from faker import Faker
from orders.models import Order, OrderImage, StoneSpecification
from invoices.models import Invoice, InvoiceItem
from customers.models import Customer
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
import random
from datetime import timedelta
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Generate fake data for the Jewel Box application'

    def add_arguments(self, parser):
        parser.add_argument('--customers', type=int, default=10, help='Number of customers to create')
        parser.add_argument('--orders', type=int, default=50, help='Number of orders to create')
        parser.add_argument('--invoices', type=int, default=20, help='Number of invoices to create')

    def handle(self, *args, **options):
        fake = Faker()

        with transaction.atomic():

            # Generate Customers
            customers = []
            abbreviations = []
            for _ in range(options['customers']):
                name = fake.company()
                abbreviation = ''.join(word[0].upper() for word in name.split()[:3])
                if abbreviation in abbreviations:
                    continue
                abbreviations.append(abbreviation)
                customer = Customer.objects.create(
                    name=name,
                    abbreviation=abbreviation,
                    address=fake.address(),
                    phone_number=fake.phone_number()[:12]
                )
                customers.append(customer)
            self.stdout.write(self.style.SUCCESS(f'Created {len(customers)} customers'))

            # Generate Orders
            orders = []
            for i in range(options['orders']):
                customer = random.choice(customers)
                order_id = f'{customer.abbreviation}{timezone.now().year % 100:02d}{i:03d}'
                order = Order.objects.create(
                    order_id=order_id,
                    customer=customer,
                    size=fake.random_element(elements=('Small', 'Medium', 'Large')),
                    resize=fake.random_element(elements=('Yes', 'No')),
                    ct_number=fake.random_number(digits=5),
                    job_number=fake.random_number(digits=6),
                    kt_number=fake.random_number(digits=4),
                    invoice_number=fake.random_number(digits=7),
                    shipping_details=fake.sentence(),
                    metal=fake.random_element(elements=('Gold', 'Silver', 'Platinum')),
                    type=fake.random_element(elements=('Ring', 'Necklace', 'Bracelet', 'Earrings')),
                    color=fake.color_name(),
                    setter=fake.name(),
                    quantity=fake.random_int(min=1, max=10),
                    date_due=fake.future_date(),
                    setting_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    polish_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    rhodium_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    soldering_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    miscellaneous_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    color_stone_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    finding_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    diamonds_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    mounting_cost=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    others=fake.pydecimal(left_digits=3, right_digits=2, positive=True),
                    diamond_weight=fake.pydecimal(left_digits=2, right_digits=2, positive=True),
                    dpc=fake.pydecimal(left_digits=2, right_digits=2, positive=True),
                    order_notes=fake.text()
                )
                orders.append(order)

                # Generate OrderImage
                for _ in range(random.randint(1, 3)):
                    image_content = ContentFile(fake.image(size=(100, 100)))
                    order_image = OrderImage(order=order, caption=fake.word())
                    order_image.image.save(f'{order.order_id}_image.jpg', image_content)

                # Generate StoneSpecification
                StoneSpecification.objects.create(
                    order=order,
                    stone_type=fake.random_element(elements=('Diamond', 'Ruby', 'Emerald', 'Sapphire')),
                    cut=fake.random_element(elements=('Round', 'Princess', 'Cushion', 'Oval')),
                    stone_number=fake.random_number(digits=4),
                    carat_total=fake.pydecimal(left_digits=1, right_digits=2, positive=True),
                    quantity=fake.random_int(min=1, max=10),
                    length=fake.pydecimal(left_digits=2, right_digits=2, positive=True),
                    width=fake.pydecimal(left_digits=2, right_digits=2, positive=True),
                    height=fake.pydecimal(left_digits=2, right_digits=2, positive=True)
                )

            self.stdout.write(self.style.SUCCESS(f'Created {len(orders)} orders with images and stone specifications'))

            # Generate Invoices
            invoices = []
            for _ in range(options['invoices']):
                customer = random.choice(customers)
                invoice = Invoice.objects.create(
                    invoice_date=fake.date_between(start_date='-1y', end_date='today'),
                    customer=customer,
                    shipping_address=fake.address()
                )
                invoices.append(invoice)

                # Generate InvoiceItems
                for _ in range(random.randint(1, 5)):
                    order = random.choice(orders)
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        order_id=order.order_id,
                        ref_job_number=fake.random_number(digits=6),
                        description=fake.sentence(),
                        the_type=fake.random_element(elements=('Product', 'Service')),
                        quantity=fake.random_int(min=1, max=5),
                        unit_price=fake.pydecimal(left_digits=3, right_digits=2, positive=True)
                    )

            self.stdout.write(self.style.SUCCESS(f'Created {len(invoices)} invoices with items'))

            self.stdout.write(self.style.SUCCESS('Fake data generation completed successfully'))
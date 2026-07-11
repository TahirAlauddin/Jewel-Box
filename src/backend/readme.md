# Project Name

## Overview
Briefly describe the purpose and functionality of your project. Include any unique features or important technologies used.

## Installation
Provide step-by-step instructions on how to set up the project locally.
```bash
git clone https://github.com/your-username/project-name.git
cd project-name
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Usage
Describe how to use the application, including any endpoints if it's a web service, or how to interact with the app if it's a GUI application.

## Features
List the key features of the application. For example:
- Order Management
- Invoice Generation
- Stone Specification Tracking


### Project Structure:

**Orders App**

    |-> Order - has many -> OrderImage
    |-> Order - has many -> StoneSpecification
    |-> Order - belongs to -> Invoice (optional, if you want to link Orders to Invoices)
    |-> Stone - belongs to -> Order

**Invoices App**

    |-> Invoice - has many -> InvoiceItem (optional)
    |-> Invoice - has many -> Order 

**Customer App**

    |-> Customer - has many -> Order
    |-> Customer - has many -> Invoice


## License
State the license under which your project is made available. For example:
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.

## Acknowledgments
Give credit to any resources or individuals that helped in the development of the project.

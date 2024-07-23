let customerAbbreviation = ''
let tableContainer = document.getElementsByClassName('table-container')[0]
let invoiceItemsDB = [];
let customerOrdersDB = [];
let currentInvoiceId = ''

let customerData = {
     'NBR24001': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24002': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24003': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24004': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24005': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24006': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24007': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
     'NBR24008': {'ref': '1', 'description': 'Description', 'type': 'gold', 'quantity': 2, 'unit_price': '12', 'total': 24},
    }

// Operations 
function addRow(args) {

    let selectOptions = '<select class="invoice-select">';
    for (const order of customerOrdersDB) {
        selectOptions += `<option value="${order.order_id}">${order.order_id}</option>`;
    }
    selectOptions += '</select>';

    let row = `
    <tr class="table-row">
    <td style="display: none;" id="new" ></td>
    <td class="table-column">${selectOptions}</td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
    </tr>
    `;
    
    // tableContainer.insertAdjacentHTML('beforeend', row);
    let table = $('table.table-container');
    table.append(row)
      // Initial call to bind event listeners to existing editable cells
    applyPasteEventListeners();
    
    // Add listeners on new objects
    addEvents()
}
  

// CRUD
//? /////////////////////////////////

async function addInvoiceItems(invoiceId, item, cell) {
    const endpointBase = `${BASE_URL}/invoice/${invoiceId}/items/`;
    let endpoint = endpointBase; // POST to the collection endpoint
    let method = 'POST';
    
    await fetch(endpoint, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            // Include any necessary authentication headers
        },
        body: JSON.stringify(item),
    })
    .then(response => response.json())
    .then(data => {
        cell.id = String(data.id)
    })
    .catch(error => {
        console.error('Error:', error);
   ipcRenderer.send('show-message-box', {
          type: 'error',
          title: 'ERROR',
          message: `('Error:', ${error});`
      });
        // Handle errors, such as showing an error message
    });
  }
  
  async function collectAndSaveItems(invoiceId) {
    const itemsData = [];
    const rows = document.querySelectorAll('.table-row');
    for (let row of rows) {
        let cells = row.querySelectorAll('td');
        cells = row ? Array.from(cells) : [];
        const quantity = cells[5].textContent.trim()
        const unit_price = cells[6].textContent.trim()
        const order_id = cells[1].firstChild.value;
        const ref_job_number = cells[2].textContent.trim()
        const description = cells[3].textContent.trim()
        const the_type = cells[4].textContent.trim()

        let item = {
          order_id: order_id,
          ref_job_number: ref_job_number,
          description: description,
          the_type: the_type,
          quantity: Number(quantity),
          unit_price: Number(unit_price),
          invoice: invoiceId
        };
        // Push item to the list, regardless of validation
        itemsData.push(item);
    }

    let isValid = await validateInvoiceItems(itemsData);
    if (isValid) {
        // Save invoice items
        saveInvoiceItems(invoiceId, itemsData)
        return true;
    }
    return false;
  }

async function validateInvoiceItems(items) {

    for (let item of items) {
        if (isNaN(item.quantity)) {
            console.error('Quantity is not a valid number.');
            showMessage('Quantity is not a valid number', 'error');
            return false;
        } else if (isNaN(item.unit_price)) {
            console.error('Unit price is not a valid number.');
            showMessage('Unit price is not a valid number', 'error');
            return false;
        } else if (!item.ref_job_number || item.ref_job_number.trim() === '') {
            showMessage('Reference Job Number is required', 'error');
            return false;
        } else if (!item.description || item.description.trim() === '') {
            showMessage('Description is required', 'error');
            return false;
        } else if (!item.the_type || item.the_type.trim() === '') {
            showMessage('Type is required', 'error');
            return false;
        } 
    }

    const hasDuplicates = items.map(item => item.order_id).some((id, index, array) => array.indexOf(id) !== index);
    console.log(hasDuplicates)
    if (hasDuplicates) {
        showMessage("Cannot have duplicate order ids", 'error')
        return false
    }

    return true;
}

  async function saveInvoiceItems(invoiceId, invoiceItems) {
    try {
        const response = await fetch(`${BASE_URL}/save-invoice-items/${invoiceId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceItems),
        });
        if (!response.ok) {
            throw new Error('Failed to save invoice items');
        }
        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}


function getData() {  
    const data = {
      customer: document.getElementById('customer-select').value,
      invoice_number: document.getElementById('invoice-id').value,
      invoice_date: document.getElementById('date-out').value,
      date_in: document.getElementById('date-in').value,
      shipping_address: document.getElementById('ship-to').value,
  };  
  return data;
}
  

async function populateCustomers(defaultUrl = null) {
    try {
        const endpoint = `${BASE_URL}/customer/`
        const endpointwithParams = `${endpoint}?ordering=name`;
        const response = await fetch(endpointwithParams);
  
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dataArray = await response.json();
        let customer_select = document.getElementById('customer-select');
        
        // Clear the dropdown before populating
        customer_select.innerHTML = '';
  
        let defaultCustomerAbbreviation = null;
        let isDefaultSet = false;
  
        dataArray.forEach(data => {
            let option = document.createElement('option');
            option.innerHTML = `${data.name} (${data.abbreviation})`;
            // Clean the endpoint, remove any query string arguments
            option.value = endpoint + data.id + '/';
            option.id = data.id;
            customer_select.appendChild(option);
  
            // Check if defaultUrl is provided and matches the current option
            if (defaultUrl === option.value) {
                customer_select.value = defaultUrl;
                defaultCustomerAbbreviation = data.abbreviation;
                isDefaultSet = true;
            }
        });
  
        // Set to first customer if defaultUrl is not provided or doesn't match
        if (!isDefaultSet && dataArray.length > 0) {
            customer_select.value = endpoint + dataArray[0].id + '/';
            defaultCustomerAbbreviation = dataArray[0].abbreviation;
        }
  
        return defaultCustomerAbbreviation;
    } catch (error) {
        console.error("Failed to populate customers:", error);
          ipcRenderer.send('show-message-box', {
          type: 'error',
          title: 'ERROR',
          message: `("Failed to populate customers:", error);`
      });
        // Handle error or return a fallback value
        return null;
    }
}
  
async function fetchInvoice(id) {
    try {
        const response = await fetch(`${BASE_URL}/invoice/${id}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        document.getElementById('customer-select').value = data.customer_name;
        document.getElementById('invoice-id').value = data.invoice_number;
        document.getElementById('ship-to').value = data.shipping_address;
        document.getElementById('date-in').value = data.date_in;
        document.getElementById('total-price').value = data.total_price;
        document.getElementById('date-out').value = data.invoice_date;
        document.getElementById('address').value = data.address;

        const customerAbbreviation = await populateCustomers(data.customer);
        await getCustomerOrders(customerAbbreviation);

    } catch (error) {
        console.error('Error:', error);
    }
}


async function fetchInvoiceItems(id) {
    try {
        const endpoint = `${BASE_URL}/invoice/${id}/items`;
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // If there are invoice items
        const items = data.results; // Pagination 
        const tableBody = document.querySelector('.table-container tbody');
        
        items.forEach(item => {
            let selectOptions = `<select value="${item.order_id}" class="invoice-select">`;
            for (const order of customerOrdersDB) {
                if (order.order_id != item.order_id) {
                    selectOptions += `<option value="${order.order_id}">${order.order_id}</option>`;
                } else {
                    selectOptions += `<option selected value="${order.order_id}">${order.order_id}</option>`;
                }
            }
            selectOptions += '</select>';

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td id="${item.id}" style="display: none"></td>
                <td class="table-column">${selectOptions}</td> 
                <td contentEditable=true class="table-column">${item.ref_job_number}</td>
                <td contentEditable=true class="table-column">${item.description}</td>
                <td contentEditable=true class="table-column">${item.the_type}</td>
                <td contentEditable=true class="table-column">${item.quantity}</td>
                <td contentEditable=true class="table-column">${item.unit_price || 0}</td>
                <td contentEditable=true class="table-column">${item.unit_price * item.quantity}</td>
                <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
            `;
            tableBody.appendChild(row);
        });

        // Initial call to bind event listeners to existing editable cells
        applyPasteEventListeners();

        // Add listeners on new objects
        addEvents();

    } catch (error) {
        console.error('Error:', error);
    }
}


async function populateInvoice(id) {
    // Set current invoice Id globally
    currentInvoiceId = id;

    await fetchInvoice(id)
    await fetchInvoiceItems(id)

}

async function getCustomerOrders(abbreviation) {
    try {
        const endpoint = `${BASE_URL}/order/?customer__abbreviation=${abbreviation}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        customerOrdersDB = data.results;
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to tell Electron to navigate to another page
function navigateTo(page, args) {
    ipcRenderer.send('navigate', page, args);
}

async function editInvoice() {
    let updateData = getData();
  
    // Fixed destructuring for validation results
    let [valid, error_message] = validateInputBeforeSaving(updateData);
    
    if (!valid) {
      showMessage('Error saving Invoice: ' + error_message, 'error');
      return false; // Correctly return false if validation fails
    }
  
    // Define the endpoint URL, including the invoice_number
    const endpoint = `${BASE_URL}/invoice/${currentInvoiceId}/`;
  
    try {
      const response = await fetch(endpoint, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      let data = await response.json();
      
      // ? Important line of code 
      // Call performOperations with the invoice_id
      let success = await collectAndSaveItems(data.invoice_number);
      if (success !== false) showMessage('Invoice Update was Successful')
  
        // setTimeout(() => {
        //   document.getElementById('invoices-page-btn').click();
        // }, 100);
  
      // Return true if everything succeeds
      return true;
    } catch (error) {
      console.error('Update Error:', error);
       ipcRenderer.send('show-message-box', {
          type: 'error',
          title: 'ERROR',
          message: `('Update Error:', error);`
      });
      // Handle errors, e.g., show an error message
      return false;
    }
}
  
function deleteInvoice() { 
    showConfirmation('Are you sure you want to delete this invoice? It cannot be undone.', () => {
        const invoiceId = document.getElementById('invoice-id').value;
        console.log(invoiceId)
        fetch(`${BASE_URL}/invoice/${invoiceId}`, {method: 'DELETE'}).then(response => {
            if (!response.ok) {
                throw Error('There was an error deleting the invoice!')
            }
            navigateTo('invoices')
        }).catch(error => {
            console.error(error.message)
        })
    })
}

async function printInvoice() {
     console.log("printInvoice")
    
     try {
        // Send a POST request to print invoices for the selected rows
        const response = await fetch(`${BASE_URL}/download-invoice/${currentInvoiceId}/`, {
            method: 'POST',
            headers: {
                // Add any headers if needed
            },
            // body: JSON.stringify({invoice: currentInvoiceId})
        });

        // Check if the request was successful
        if (response.ok) {
            // TODO: update the rows selected, and change their colors, and update their Invoice number

            console.log('Invoices printed successfully:');
            const blob = await response.blob();

            // Create a temporary anchor element
            const tempAnchor = document.createElement('a');
            tempAnchor.href = window.URL.createObjectURL(blob);
            tempAnchor.download = 'invoices.xlsx'; // Specify the file name
    
            // Trigger a click event to download the zip file
            tempAnchor.click();
    
            // Clean up
            window.URL.revokeObjectURL(tempAnchor.href);
        } else {
            // Handle error response
            console.error('Error printing invoices:', response.statusText);
        }
    } catch (error) {
        // Handle any unexpected errors
        console.error('An error occurred while printing invoices:', error);
    }

     
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('delete-button').addEventListener('click', () => {
        deleteInvoice()
    })
    document.getElementById('edit-button').addEventListener('click', () => {
        editInvoice()
    })
    document.getElementById('print-button').addEventListener('click', () => {
        printInvoice()
    })

    document.getElementById('add-row')
    .addEventListener('click', () => addRow())

    // Delete Stones Rows
    addEvents()

})
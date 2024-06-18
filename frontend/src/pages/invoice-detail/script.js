let tableContainer = document.getElementsByClassName('table-container')[0]
let invoiceItemsFromDatabase = [];
let currentInvoiceId = ''

// Operations 
function addRow(args) {
    let row = `
    <tr class="table-row">
    <td style="display: none;" id="new" ></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td contenteditable=true class="table-column"></td>
    <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
    </tr>
    `;
    
    let table = document.querySelector('table.table-container');
    table.insertAdjacentHTML('beforeend', row);
    // Initial call to bind event listeners to existing editable cells
    applyPasteEventListeners();
    
    // Add listeners on new objects
    addEvents()
}
  

// CRUD
//? /////////////////////////////////

async function updateOrAddInvoiceItems(invoiceId, item, cell, databaseItemIds) {
    const endpointBase = `${BASE_URL}/invoice/${invoiceId}/items/`;
    let endpoint;
    let method;
    let isAddingInvoiceItem = item.id.startsWith("new")
    if (isAddingInvoiceItem) {
        // Handle new item
        endpoint = endpointBase; // POST to the collection endpoint
        method = 'POST';
    } else {
        // Handle existing item
        endpoint = `${endpointBase}${item.id}/`; // PATCH to the specific item endpoint
        method = 'PATCH';
    }
  
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
        if (isAddingInvoiceItem) {
            databaseItemIds.push(data.id)
        }
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
    rows.forEach(async row => {
        let cells = row.querySelectorAll('td');
        cells = row ? Array.from(cells) : [];
        const quantity = cells[5].textContent.trim()
        const unit_price = cells[6].textContent.trim()
        const order_id = cells[1].textContent.trim()
        const ref_job_number = cells[2].textContent.trim()
        const description = cells[3].textContent.trim()
        const the_type = cells[4].textContent.trim()

        if (isNaN(quantity)) {
            console.error('Quantity is not a valid number.');
            showMessage('Quantity is not a valid number', 'error');
            return false;
        }

        if (isNaN(unit_price)) {
            console.error('Unit price is not a valid number.');
            showMessage('Unit price is not a valid number', 'error');
            return false;
        }
        let item = {
          id: cells[0].id, // Assuming the first cell contains the ID
          idCell: cells[0],
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
    });
    
    let currentItemIds = Array.from(itemsData).map(item => item.id)
    let databaseItemIds = Array.from(invoiceItemsFromDatabase).map(item => item.id)
    // Delete removed rows, update the list of databaseItemIds
    databaseItemIds = await deleteRemovedInvoiceItems(invoiceItemsFromDatabase, databaseItemIds, currentItemIds, invoiceId)
    console.log(databaseItemIds)

    // Add items to database
    for (const item of itemsData) {
        if (!item.order_id || item.order_id.trim() === '') {
            showMessage('Order ID is required', 'error');
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
        } else {
            await updateOrAddInvoiceItems(item.invoice, item, item.idCell, databaseItemIds);            
        }
    }
    return true;
  }

async function deleteRemovedInvoiceItems(invoiceItemsFromDatabase, databaseItemIds, currentItemIds, invoiceId) {
    const remainingDatabaseItemIds = [];

    for (const databaseItemId of databaseItemIds) {
        if (!currentItemIds.includes(String(databaseItemId))) {
            await deleteIndividualInvoiceItemDatabase(invoiceId, String(databaseItemId));
            const index = invoiceItemsFromDatabase.findIndex(item => item.id === databaseItemId);
            if (index !== -1) {
                invoiceItemsFromDatabase.splice(index, 1);
            }
        } else {
            remainingDatabaseItemIds.push(databaseItemId);
        }
    }

    console.log(remainingDatabaseItemIds)
    return remainingDatabaseItemIds;
}


async function deleteIndividualInvoiceItemDatabase(invoiceId, itemId) {
    // Endpoint for deleting all images associated with an order
    const endpoint = `${BASE_URL}/invoice/${invoiceId}/items/${itemId}/`;

    fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text(); // Assuming the API does not return a JSON response for DELETE operations
    })
    .then(data => {
        console.log('Stone deleted successfully');
        // Handle successful deletion, e.g., update the UI accordingly
    })
    .catch(error => {
        console.error('Error deleting Invoice item:', error);
        ipcRenderer.send('show-message-box', {
                type: 'error',
                title: 'ERROR',
                message: `('Error deleting Invoice item:', ${error});`
            });
            // Handle any errors that occur during the fetch operation
    });
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
  

function populateInvoice(id) {
    // Set current invoice Id globally
    currentInvoiceId = id;

    fetch(`${BASE_URL}/invoice/${id}/`).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json()
    }).then(data => {

        populateCustomers(data.customer) 

        document.getElementById('customer-select').value = data.customer_name
        document.getElementById('invoice-id').value = data.invoice_number
        document.getElementById('ship-to').value = data.shipping_address
        document.getElementById('date-in').value = data.date_in
        document.getElementById('total-price' ).value = data.total_price
        document.getElementById('date-out' ).value = data.invoice_date
        document.getElementById('address').value = data.address
    })

    const endpoint = `${BASE_URL}/invoice/${id}/items`;

    fetch(endpoint)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {    
        // If there are invoice items
        data = data.results // Pagination 
        const tableBody = document.querySelector('.table-container tbody');
        invoiceItemsFromDatabase = data;
        data.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td id="${item.id}" style="display: none"></td>
                <td contentEditable=true class="table-column">${item.order_id}</td>
                <td contentEditable=true class="table-column">${item.ref_job_number}</td>
                <td contentEditable=true class="table-column">${item.description}</td>
                <td contentEditable=true class="table-column">${item.the_type}</td>
                <td contentEditable=true class="table-column">${item.quantity}</td>
                <td contentEditable=true class="table-column">${item.unit_price || 0}</td>
                <td contentEditable=true class="table-column">${item.unit_price * item.quantity}</td>
                <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
        `;
        tableBody.appendChild(row);
        })

        // Initial call to bind event listeners to existing editable cells
        applyPasteEventListeners();
        
        // Add listeners on new objects
        addEvents()
        

    })
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
      console.log(success)

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
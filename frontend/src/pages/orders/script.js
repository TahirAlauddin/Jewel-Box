const selectedRows = []; // Initialize an empty array to keep track of selected rows

// Function to tell Electron to navigate to another page
function navigateTo(page, args) {
    ipcRenderer.send('navigate', page, args);
}

function addOrderRow(data) {
    let image = data.images[0];
    const tableBody = document.getElementById('table-body'); // Ensure this is the correct ID of your table body
    const newRow = document.createElement('tr');

    newRow.className = 'order-row';
    if (data.date_due) {
        const dueDate = new Date(data.date_due);
        const currentDate = new Date();
        const twoDaysLater = new Date(currentDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days in milliseconds

        if (dueDate < twoDaysLater) {
            // date_due is less than 2 days from now
            newRow.classList.add('order-urgent-row')
        } 
        if (data.invoice_number) {
            newRow.classList.add('status-invoiced')
        }
    }

    var imgCell = document.createElement('td');
    imgCell.className = 'order-column first-column';
    var img = document.createElement('img');
    img.className = 'product-image';
    img.id = 'product-image-' + data.order_id;
    img.src = 'product-image.png';
    img.alt = 'Image Not found';
    imgCell.appendChild(img);

    var notesCell = document.createElement('td');
    notesCell.className = 'order-column second-column';
    // Description will only show the first line, and no more than 50 characters
    const notes = data.order_notes;
    const cutoffIndex = Math.min(notes.indexOf('\n') !== -1 ? notes.indexOf('\n') : 100, 100);
    // notesCell.textContent = notes.slice(0, cutoffIndex);    
    const truncatedNotes = notes.slice(0, cutoffIndex);
    notesCell.innerHTML = `<p class="notes-text">${truncatedNotes}</p>`;


    var orderIdCell = document.createElement('td');
    orderIdCell.className = 'order-column order-id-column';
    orderIdCell.textContent = data.order_id;

    var jobNumberCell = document.createElement('td');
    jobNumberCell.className = 'order-column';
    jobNumberCell.textContent = data.job_number;

    var customerCell = document.createElement('td');
    customerCell.className = 'order-column';
    
    if (data.customer) {
        fetch(data.customer)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            customerCell.textContent = data.name;
        })
        .catch(error => {
            console.error('Error fetching customer data:', error);
        });
    }


    var dateDueCell = document.createElement('td');
    dateDueCell.className = 'order-column';
    dateDueCell.textContent = data.date_due;

    var invoiceNumberCell = document.createElement('td');
    invoiceNumberCell.className = 'order-column invoice-number-column';
    invoiceNumberCell.textContent = data.invoice_number;

    // Append all cells to the newRow
    newRow.appendChild(imgCell);
    newRow.appendChild(notesCell);
    newRow.appendChild(orderIdCell);
    newRow.appendChild(jobNumberCell);
    newRow.appendChild(customerCell);
    newRow.appendChild(dateDueCell);
    newRow.appendChild(invoiceNumberCell);

    // Append newRow to the tableBody
    tableBody.appendChild(newRow);

    if (image) {
        fetch(image)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
            })
        .then(data => {
            image = data.image; 
            img.src = image
        })
    }

    newRow.addEventListener('contextmenu', function() {
        event.preventDefault();
        // Toggle 'selected' class
        this.classList.toggle('selected-row');

        // Add or remove the row from the selection list
        const rowIndex = this.rowIndex; // Assuming each row has a unique index

        if (this.classList.contains('selected-row')) {
            // If row is selected, add its reference
            selectedRows.push({rowIndex: rowIndex, reference: this});
        } else {
            // If row is deselected, remove its reference
            const indexToRemove = selectedRows.findIndex(item => item.rowIndex === rowIndex);
            if (indexToRemove > -1) {
                selectedRows.splice(indexToRemove, 1);
            }
        }
    });


    newRow.addEventListener('click', function() {
        navigateTo('order-detail', {showEditAndDelete : true, id: data.order_id});
    });
}

function showMessage(message, type = 'success', duration = 3000) {
    const container = document.getElementById('message-container');
    container.textContent = message;
    container.className = type; // Apply 'success' or 'error' class based on the type
    container.style.display = 'block';
  
    // Center the message container horizontally
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
  
    // Automatically hide the message after 'duration' milliseconds
    setTimeout(() => {
        container.style.display = 'none';
    }, duration);
}
function openMatchedOrder(searchOrderId) {
    console.log(searchOrderId)
    // Convert searchOrderId to lower case
    const lowerCaseSearchOrderId = searchOrderId.toLowerCase();
    console.log(lowerCaseSearchOrderId)
    // Get all rows in the table
    const rows = document.querySelectorAll('.order-id-column');
    rows.forEach(row => {
        // Find the cell that contains the order ID
        const orderIdText = row.textContent.trim().toLowerCase(); // Convert order ID text to lower case
        console.log(lowerCaseSearchOrderId.substring(0, orderIdText.length))
        console.log(orderIdText)
        // Check if the first characters of the order IDs match
        if (lowerCaseSearchOrderId.substring(0, orderIdText.length) === orderIdText) {
            // If the order ID matches, simulate a click on the row
            row.click();
            // Optional: Do something after clicking the row, like logging to console or showing an alert
            console.log(`Row with order ID ${orderIdText} clicked.`);
        }
    });
}

let searchbtn = document.getElementById('search-btn')
searchbtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submit action

    const filterValue = document.getElementById('filter').value;
    let endpoint = `${BASE_URL}/order/`; // Replace with your actual search endpoint
    let searchInput = document.getElementById('search-input').value;

    // Define an object to hold your request parameters
    let params = new URLSearchParams();

    if (filterValue === 'date-range') {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Check if both dates are provided
        if (!startDate || !endDate) {
            showMessage('Please provide both start and end dates.', 'error');
            return;
        }

        // Check if the end date is not before the start date
        if (endDateObj < startDateObj) {
            showMessage('End date must be after the start date.');
            return;
        }

        // Add date range parameters to the request
        params.append('date_due__gte', startDate);
        params.append('date_due__lte', endDate);
    } else if (filterValue === 'invoice') {
        params.append('invoice_number', searchInput)
    } else if (filterValue === 'customer') {
        params.append('customer_searchInput', searchInput)
    } else if (filterValue === 'order_id') {
        params.append('order_id', searchInput)
    } 

    // Append the parameters to the endpoint URL
    endpoint += `?${params.toString()}`;

    // Make the fetch request with the specified endpoint and parameters
    fetch(endpoint)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(dataArray => {
        // Handle the successful response data
        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

        dataArray.forEach(data => {
            addOrderRow(data)
        })
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors in fetching data
    });
});

document.getElementById('add-order-btn').onclick = function () {
    navigateTo('order-detail', {showEditAndDelete: false})
}
    
const orderRows = document.getElementsByClassName('order-row');
for (let i = 0; i < orderRows.length; i++) {
    orderRows[i].addEventListener('click', function() {
        navigateTo('order-detail', {showEditAndDelete : true});
    });
}

document.getElementById('logout-btn').addEventListener('click', () => {
    navigateTo('login')
}) 
document.getElementById('invoices-page-btn').addEventListener('click', () => {
    navigateTo('invoices')
})
document.getElementById('customers-page-btn').addEventListener('click', () => {
    navigateTo('customers')
})
document.getElementById('orders-page-btn').addEventListener('click', () => {
    navigateTo('orders')
})

document.addEventListener('keydown', function(event) {
    // Check if 'Enter' key is pressed
    if (event.key === 'Enter') {
      // Check if the input box is focused
      if (document.activeElement.id === 'search-input') {
          // Trigger click event on search button
          searchbtn.click();
      }
  }
});


// Fetch orders from Backend API
addEventListener('DOMContentLoaded', function () {
    
    const endpoint = `${BASE_URL}/order/`;
    fetch(endpoint)
    .then(response => {
        if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
    })
    .then(dataArray => {
        dataArray.forEach(data => {
            addOrderRow(data)
        })
    })
    let inputBuffer = '';

    document.addEventListener('keyup', function(e) {
        // Check if the key is not Enter
        if (e.key !== 'Enter') {
            // If Shift is pressed, ignore it
            if (e.key !== 'Shift') {
                // Append the scanned character to the buffer
                inputBuffer += e.key;
            }
        } else {
            // Enter key is hit, process the scanned barcode (inputBuffer)
            console.log('Scanned Order ID:', inputBuffer);
            // Process the scanned barcode
            openMatchedOrder(inputBuffer);
            // Clear the buffer after processing
            inputBuffer = '';
        }
    });
    

    document.getElementById('print-label-btn').addEventListener('click', function () {
        // Defined in print.js
        productionSheetBtnHandler()
    })
    
    document.getElementById('invoice-btn').addEventListener('click', function () {
        // Defined in print.js
        invoiceBtnHandler()
    
    })
})

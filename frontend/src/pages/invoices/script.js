let searchbtn = document.getElementById('search-btn')
searchbtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submit action

    let endpoint = `${BASE_URL}/invoice/`; // Replace with your actual search endpoint
    let searchInput = document.getElementById('search-input').value;

    // Define an object to hold your request parameters
    let params = new URLSearchParams();
    params.append('search', searchInput)

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
            addInvoiceRow(data, tableBody)
        })
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors in fetching data
    });
});


function addInvoiceRow(data, tableBody) {
    const newRow = document.createElement('tr');

    newRow.className = 'invoice-row';

    var invoiceNumeberCell = document.createElement('td');
    invoiceNumeberCell.className = 'invoice-column';
    invoiceNumeberCell.textContent = data.invoice_number;

    var customerCell = document.createElement('td');
    customerCell.className = 'invoice-column';
    customerCell.textContent = data.customer_name;

    var invoiceDateCell = document.createElement('td');
    invoiceDateCell.className = 'invoice-column';
    invoiceDateCell.textContent = data.invoice_date;

    var totalPriceCell = document.createElement('td');
    totalPriceCell.className = 'invoice-column';
    totalPriceCell.textContent = data.total_price;

    // Append all cells to the newRow
    newRow.appendChild(invoiceNumeberCell);
    newRow.appendChild(customerCell);
    newRow.appendChild(invoiceDateCell);
    newRow.appendChild(totalPriceCell);

    // Append newRow to the tableBody
    tableBody.appendChild(newRow);

    newRow.addEventListener('click', function() {
        navigateTo('invoice-detail', {showEditAndDelete : true, id: data.invoice_number});
    });

}

searchbtn.click()

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

let searchbtn = document.getElementById('search-btn')
let searchInput = ''


searchbtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submit action

    let endpoint = `${BASE_URL}/invoice/`; // Replace with your actual search endpoint
    searchInput = document.getElementById('search-input').value;

    // Define an object to hold your request parameters
    let params = new URLSearchParams();
    params.append('search', searchInput)

    // Append the parameters to the endpoint URL
    endpoint += `?${params.toString()}`;

    fetchResults(1, '')
});


function addInvoiceRow(data) {
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
    var tableBody = document.getElementById('table-body')
    tableBody.appendChild(newRow);

    newRow.addEventListener('click', function() {
        navigateTo('invoice-detail', {showEditAndDelete : true, id: data.invoice_number});
    });

}

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

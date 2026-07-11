function getSelectedRowsIds() {
    let ids = [];
    for (let row of selectedRows) {
        try {
            let id = row.reference.querySelector('.order-id-column').textContent;
            ids.push(id);
        } catch (error) {
            console.error('Error accessing order ID:', error);
        }
    }
    return ids;
}

function orderIsAlreadyInvoiced() {
    for (let row of selectedRows) {
        let invoice = row.reference.querySelector('.invoice-number-column').textContent;
        if (invoice !== '') return true;
    }
    return false
}

function invoiceBtnHandler () {
    showConfirmation('Are you sure you want to print an invoice?',  () => {
        // Make sure all orders belong to the same Customer
        let ids = getSelectedRowsIds();
        let firstThreeLetters = ids[0].substring(0, 3);
        for (let i = 1; i < ids.length; i++) {
            if (ids[i].substring(0, 3) !== firstThreeLetters) {
                console.error('Error: Selected rows have different prefixes.');
                showMessage('Make sure all selected orders belong to the same client', 'error')
                return;
            }
        }

        // Make sure the order is not already invoiced before 
        if (orderIsAlreadyInvoiced()) {
            showMessage('One or more of the selected orders are already invoiced before.', 'error') 
            return
        }

        // If all IDs have the same prefix, proceed to the next step
        printInvoice(ids);
    })
}


async function productionSheetBtnHandler() {
    console.log("Trying to print sheet")
    let ids = getSelectedRowsIds()
    try {
        // Send a POST request to print production sheets for the selected rows
        const response = await fetch(`${BASE_URL}/print-production-sheet/`, {
            method: 'POST',
            headers: {
                // Add any headers if needed
            },
            body: JSON.stringify({ids: ids})
        });

        // Check if the request was successful
        if (response.ok) {
            // Process the response data if needed
            // const data = await response.json();
            console.log('Production sheets printed successfully:');
            const blob = await response.blob();

            // Create a temporary anchor element
            const tempAnchor = document.createElement('a');
            tempAnchor.href = window.URL.createObjectURL(blob);
            tempAnchor.download = 'production_sheets.zip'; // Specify the file name
    
            // Trigger a click event to download the zip file
            // tempAnchor.click();
    
            // Clean up
            window.URL.revokeObjectURL(tempAnchor.href);
        } else {
            // Handle error response
            console.error('Error printing production sheets:', response.statusText);
        }
    } catch (error) {
        // Handle any unexpected errors
        console.error('An error occurred while printing production sheets:', error);
    }
}


async function printInvoice(ids) {
    try {
        // Send a POST request to print invoices for the selected rows
        const response = await fetch(`${BASE_URL}/create-invoice/`, {
            method: 'POST',
            body: JSON.stringify({ids: ids})
        });

        // Check if the request was successful
        let invoice_id;
        if (response.ok) {
            let data = await response.json();
            invoice_id = data.invoice_id

            for (let row of selectedRows) {
                // Turn the rows to green
                row.reference.classList.toggle('status-invoiced')
                // Add the 
                let invoiceCell = row.reference.lastChild
                invoiceCell.textContent = invoice_id;
            }            
            const downloadresponse = await fetch(`${BASE_URL}/download-invoice/${invoice_id}`, {method: 'GET'})

            if (downloadresponse.ok) {
                console.log('Invoices printed successfully:');
                const blob = await downloadresponse.blob();
    
                // Create a temporary anchor element
                const tempAnchor = document.createElement('a');
                tempAnchor.href = window.URL.createObjectURL(blob);
                tempAnchor.download = `invoices_${invoice_id}.xlsx`; // Specify the file name
        
                // Trigger a click event to download the zip file
                tempAnchor.click();
        
                // Clean up
                window.URL.revokeObjectURL(tempAnchor.href);
            }

        } else {
            // Handle error response
            console.error('Error printing invoices:', response.statusText);
        }

    } catch (error) {
        // Handle any unexpected errors
        console.error('An error occurred while printing invoices:', error);
    }
}

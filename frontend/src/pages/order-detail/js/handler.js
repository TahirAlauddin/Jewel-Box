let operation_buttons = document.getElementById('operation-buttons')
let globalArgs = [];
function deleteOrderWrapper() {
    showConfirmation('Are you sure you want to delete this order?', deleteOrder)
}
function updateOrderWrapper() {
    showConfirmation('Are you sure you want to update this order?', updateOrder)
}

function removeBarcode() {
    document.getElementById('barcode-section').innerHTML = `
    <label>Barcode</label>
    <p>Will be generated automatically once saved</p>`
}


ipcRenderer.on('page-data', (event, args) => {
    globalArgs = args;
    if (args.showEditAndDelete) {
        operation_buttons.innerHTML +=
            `    
        <button id="edit-button" onclick="updateOrderWrapper()" class="edit-button">Update order</button>
        <button id="delete-button" onclick="deleteOrderWrapper()" class="delete-button">Delete order</button>
    `;

        document.getElementById('print-label-button').addEventListener('click', () => {
            console.log('Print label clicked')
            productionSheetBtnHandler(currentOrderId)
        })

        // Call the function to populate data on page load or when needed
        populateOrder(args.id);

    } else {
        removeBarcode()
        operation_buttons.innerHTML = `
            <button onclick="saveOrder(redirect=true)" class="save-button">Save order</button>
        `;

        // Save Order, all fields that will be generated automatically in the server
        document.querySelector('div[name="date-in-input"]').style.display = 'none';
        // ? Commenting out following on request of the client
        // ? Order ID is editable, and so is the customer
        // document.querySelector('div[name="order-id-input"]').style.display = 'none';

        populateCustomers().then(defaultCustomer => {
            // Additional logic using defaultCustomer
            if (defaultCustomer)
                document.getElementById('orderID').value = getDynamicOrderID(defaultCustomer)
        });

    }
});


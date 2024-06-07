function showConfirmation(message, onConfirm) {
    const confirmationContainer = document.getElementById('confirmation-container');
    const confirmationMessage = document.getElementById('confirmation-message');
    const confirmYesButton = document.getElementById('confirm-yes');
    const confirmNoButton = document.getElementById('confirm-no');
  
    confirmationMessage.textContent = message;
    confirmationContainer.style.display = 'flex';
  
    confirmYesButton.onclick = function() {
      onConfirm();
      confirmationContainer.style.display = 'none';
    };
  
    confirmNoButton.onclick = function() {
      confirmationContainer.style.display = 'none';
    };
}
  
function addEvents () {
    document.querySelectorAll('.delete-row').forEach( (element) => {
        element.addEventListener('click', deleteRow);
    });   
}

// Function to apply paste event listeners
function applyPasteEventListeners() {
    document.querySelectorAll('td[contenteditable="true"]').forEach(td => {
        td.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertHTML', false, text);
        });
    });
}

function deleteRow(args) {
    this.closest('tr').remove();
}
   
// Validations
function validateInputBeforeSaving(invoiceData) {
    // For now only verify due_date, rest will go later.
    if (!invoiceData.invoice_number) {
      return [false, 'Invalid Invoice ID'];
    }
    if (!validateInvoiceNumber(invoiceData.invoice_number)) {
      return [false, 'Invalid InvoiceID, InvoiceID must start with the correct Abbreviation']
    }
  
    return verifyDate(invoiceData.date_in) && verifyDate(invoiceData.invoice_date) ? [true, ''] : [false, 'Invalid Date'];

}
  
function validateInvoiceNumber(invoice_number) {
    let customerSelect = document.getElementById('customer-select')
    const selectedCustomer = customerSelect.options[customerSelect.selectedIndex].text;
    const abbreviationMatch = selectedCustomer.match(/\(([^)]+)\)/);
    console.log(abbreviationMatch)
    if (abbreviationMatch && !invoice_number.startsWith(abbreviationMatch[1])) {
        return false;
    }
    return true;
}
  
function verifyDate(date) {
    // Check if date is in the 'yyyy-mm-dd' format
    const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(date);
  
    if (!isValidFormat) {
      console.error("52")
      return false; // Return false if the format is not valid
    }
    
    // Parse the date components from date
    const [year, month, day] = date.split("-").map(Number);
    
    // Construct a new Date object as UTC
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    
    // Check if any of the date components are invalid (e.g., month=13, day=32)
    if (dateObj.getUTCFullYear() !== year || dateObj.getUTCMonth() + 1 !== month || dateObj.getUTCDate() !== day) {
      console.error("64")
      return false; // Return false if the date components don't match the input
    }
  
    // If the date components are valid, return true
    return true;
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
  
let selectedRows = []; // Initialize an empty array to keep track of selected rows
let isEditing = false;
// Get the modal
let modal = document.getElementById("myModal");
let editModal = document.getElementById("editModal");

// Get the button that opens the modal
let add_customer_btn = document.getElementById("add-customer-btn");
let edit_customer_btn = document.getElementById("edit-btn");

// Get all elements with the class "delete-image"
let elements = document.getElementsByClassName("delete-image");

// Iterate over the NodeList and attach the event listener to each element
Array.from(elements).forEach(element => {
  element.onclick = function() {
      closeModal();
  };
});

let addButton = document.getElementById("addButton")
let editSaveButton = document.getElementById("editSaveButton")

// When the user clicks the button, open the modal 
add_customer_btn.onclick = function() {
  modal.style.display = "block";
}

edit_customer_btn.onclick = function() {
  editModal.style.display = "block";
}

// Improved code with cleanup and simplifications

// Common variables
const fullnameInput = document.getElementById('fullname');
const abbreviationInput = document.getElementById('abbreviation');
const addressInput = document.getElementById('address');
const phoneNumberInput = document.getElementById('phone-number');

const editFullnameInput = document.getElementById('edit-modal-name');
const editAbbreviationInput = document.getElementById('edit-modal-abbreviation');
const editAddressInput = document.getElementById('edit-modal-address');
const editPhoneNumberInput = document.getElementById('edit-modal-phone-number');

// Utility function for making API requests
async function makeApiRequest(endpoint, method, data) {
  const response = await fetch(endpoint, {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    // Instead of throwing an Error immediately, first try to parse the response
    return response.json().then(body => {
      // Now, throw an Error with the response body
      // so that the .catch block can receive the actual error message
      throw new Error(body.abbreviation ? body.abbreviation.join() : 'Network response was not ok');
    });
  }
  return await response.json();
}

// Common validation function
function validateInput(fullname, abbreviation, address, phoneNumber) {
  if (!fullname || !abbreviation || !address || !phoneNumber) {
    showMessage('Please enter all the information required.', 'error');
    return false;
  }
  if (abbreviation.length !== 3) {
    showMessage('The abbreviation must be exactly 3 characters long.', 'error');
    return false;
  }

  // Phone number validation: ensuring it contains only digits and is 10 characters long
  const phonePattern = /^\d{10}$/;
  if (!phonePattern.test(phoneNumber)) {
    showMessage('The phone number must be exactly 10 digits long.', 'error');
    return false;
  }

  return true;
}

addButton.onclick = function() {
  const fullname = fullnameInput.value;
  const abbreviation = abbreviationInput.value;
  const address = addressInput.value;
  const phoneNumber = phoneNumberInput.value;
  
  if (!validateInput(fullname, abbreviation, address, phoneNumber)) return;

  // Define the data to be sent
  let data = {
    name: fullname, abbreviation: abbreviation.toUpperCase(),
    address: address, phone_number: phoneNumber
   };

  makeApiRequest(`${BASE_URL}/customer/`, 'POST', data)
    .then(data => {
      showMessage("Successfully added to the database", "success");
      getCustomerData(); // Assuming this fetches and displays customer data
      closeModal();
    })
    .catch(error => {
      console.error(error.message)
      showMessage("An error occurred: " + error.message, "error");
    });
}

editSaveButton.onclick = function() {
  if (!selectedRows.length) return;

  const fullname = editFullnameInput.value;
  const abbreviation = editAbbreviationInput.value;
  const address =      editAddressInput.value;
  const phoneNumber =  editPhoneNumberInput.value;
  
  if (!validateInput(fullname, abbreviation, address, phoneNumber)) return;

  let selectedRowId = selectedRows[selectedRows.length-1].id; // Assuming last selected row's ID for edit
  let data = {
    name: fullname, abbreviation: abbreviation.toUpperCase(),
    address: address, phone_number: phoneNumber
   };

  makeApiRequest(`${BASE_URL}/customer/${selectedRowId}/`, 'PUT', data)
    .then(data => {
      showMessage("Successfully updated in the database", "success");
      let selectedRowNode = document.getElementById(data.id);
      selectedRowNode.children[0].innerHTML = data.name;
      selectedRowNode.children[1].innerHTML = data.abbreviation;
      selectedRowNode.children[2].innerHTML = data.address;
      selectedRowNode.children[3].innerHTML = data.phone_number;
      closeModal();
    })
    .catch(error => {
      console.error('Error:', error);
      showMessage("There was an error editing the Customer" + error, "error");
    });
}

function closeModal() {
  modal.style.display = "none";
  editModal.style.display = "none";

  // Clear the input fields of the modal once closed
  document.getElementById('edit-modal-name').value = '';
  document.getElementById('edit-modal-abbreviation').value = '';
  document.getElementById('edit-modal-phone-number').value = '';
  document.getElementById('edit-modal-address').value = '';

  document.getElementById('fullname').value = ''
  document.getElementById('abbreviation').value = ''
  document.getElementById('phone-number').value = '';
  document.getElementById('address').value = '';

}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    closeModal()
  }
}

function populateTableWithData(dataArray) {
  const tableBody = document.getElementById('table-body');

  // Clear existing rows to avoid duplication
  while (tableBody.firstChild) {
      tableBody.removeChild(tableBody.firstChild);
  }

  dataArray.forEach((data, index) => {
      // Create the row element
      const row = document.createElement('tr');
      row.id = data.id;
      row.className = 'order-row';
      row.innerHTML = `
          <td class="order-column">${data.name}</td>
          <td class="order-column">${data.abbreviation}</td>
          <td class="order-column">${data.address}</td>
          <td class="order-column">${data.phone_number}</td>
      `;

      // Attach contextmenu event listener to each row for selection
      row.addEventListener('click', function(event) {

          event.preventDefault();
          // Toggle 'selected' class
          this.classList.toggle('selected-row');
          
          if (this.classList.contains('selected-row')) {
              // If row is selected, add its reference
              selectedRows.push({
                id: data.id, reference: this, 
                name: data.name, phone_number: data.phone_number,
                address: data.address,
                abbreviation: data.abbreviation});
          } else {
              // If row is deselected, remove its reference
              const indexToRemove = selectedRows.findIndex(item => item.id === data.id);
              if (indexToRemove > -1) {
                  selectedRows.splice(indexToRemove, 1);
              }
          }
      });

      // Append the new row to the table body
      tableBody.appendChild(row);
  });
}

function getCustomerData() {
fetch(`${BASE_URL}/customer/?ordering=name`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  }
  }).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  }).then(data => {
    // Handle success, such as showing a success message or clearing the form
    populateTableWithData(data);

  }).catch((error) => {
    console.error('Error:', error);
    // Handle errors, such as showing an error message
  });
}

function editCustomer() {
  let len = selectedRows.length
  if (len >= 1) {
    editModal.style.display = "block";
    document.getElementById('edit-modal-name').value = selectedRows[len-1].name;
    document.getElementById('edit-modal-abbreviation').value = selectedRows[len-1].abbreviation;
    document.getElementById('edit-modal-phone-number').value = selectedRows[len-1].phone_number;
    document.getElementById('edit-modal-address').value = selectedRows[len-1].address;
  } else {
    showMessage('Select a customer', 'error')
  }
}

function deleteCustomer() {
  if (!selectedRows.length) 
  {
    showMessage('Select a customer', 'error')
    return
  }
  function deleteCustomerFromDatabase() {
    
    let newEndpoint;
    let endpoint = `${BASE_URL}/customer/`
    selectedRows.forEach(selectedRow => {
      newEndpoint = endpoint + selectedRow.id + '/'
    
    // Make the POST request
    fetch(newEndpoint, {
      method: 'DELETE',
      headers: {
          'Content-Type': 'application/json',
      },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response;
    })
    .then(data => {
        document.getElementById(selectedRow.id).remove()
        // Handle success, such as showing a success message or clearing the form
    })
    .catch((error) => {
        console.error('Error:', error);
        // Handle errors, such as showing an error message
      });
    })
  } 
  showConfirmation('Are you sure you want to delete the Customers? This cannot be undone.', deleteCustomerFromDatabase) 
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


document.addEventListener('DOMContentLoaded', function() {
  getCustomerData();
  // Attach other initialization logic
});


document.getElementById('edit-btn').onclick = editCustomer
document.getElementById('delete-btn').onclick = deleteCustomer


let searchbtn = document.getElementById('search-btn')
searchbtn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submit action

    let endpoint = `${BASE_URL}/customer/`; // Replace with your actual search endpoint
    let searchInput = document.getElementById('search-input').value;

    // Define an object to hold your request parameters
    let params = new URLSearchParams();
    // Append the parameters to the endpoint URL
    params.append('search', searchInput)
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

        populateTableWithData(dataArray)
    })
    .catch(error => {
        console.error('Error:', error);
        // Handle errors in fetching data
    });
});


document.addEventListener('keydown', function(event) {
    // Check if 'Enter' key is pressed
    if (event.key === 'Enter') {
      // Check if the input box is focused
      let activeElement = document.activeElement.id
      if (activeElement === 'search-input') {
          // Trigger click event on search button
          searchbtn.click();
      } else if (activeElement === 'abbreviation' || activeElement === 'fullname') {
        document.getElementById('addButton').click()
      } else if (activeElement === 'edit-modal-name' || activeElement === 'edit-modal-abbreviation') {
        document.getElementById('editSaveButton').click()
      }
  }
});

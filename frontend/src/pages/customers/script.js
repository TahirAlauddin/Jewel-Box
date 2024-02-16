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

addButton.onclick = function() {
  const fullname = document.getElementById('fullname').value;
  const abbreviation = document.getElementById('abbreviation').value;

  // Define the data to be sent
  let data = {
      name: fullname,
      abbreviation: abbreviation,
  };

  saveCustomer(data)
  closeModal()
}

editSaveButton.onclick = function () {
  if (!selectedRows.length) return
  let len = selectedRows.length
  let endpoint = `http://localhost:8000/customer/${selectedRows[len-1].id}/`;
  let method = 'PUT'

  const fullname = document.getElementById('edit-modal-name').value;
  const abbreviation = document.getElementById('edit-modal-abbreviation').value;

  // Define the data to be sent
  let data = {
      name: fullname,
      abbreviation: abbreviation,
  };

  // Make the PUT request
  fetch(endpoint, {
    method: method,
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => {
      if (!response.ok) {
        // Showing an error message
        showMessage("There was an error", "error", 5000); // Display for 5 seconds
        throw new Error('Network response was not ok');
      }
      return response.json();
  })
  .then(data => {
      console.log('Success:', data);
        // Showing a success message
        showMessage("Successfully added to the database", "success");

        let selectedRowNode = document.getElementById(data.id);
        selectedRowNode.children[0].innerHTML = data.name
        selectedRowNode.children[1].innerHTML = data.abbreviation
        // Handle success, such as showing a success message or clearing the form
        closeModal()
  })
  .catch((error) => {
      console.error('Error:', error);
      // Handle errors, such as showing an error message
      showMessage("There was an error editing the Customer" + error, "error");

  });
}

function saveCustomer(data) {
  
  let endpoint = 'http://localhost:8000/customer/';
  let method  = 'POST'

  // Make the POST request
  fetch(endpoint, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();
  })
  .then(data => {
      const tableBody = document.getElementById('table-body');
      while (tableBody.firstChild) {
          tableBody.removeChild(tableBody.firstChild);
      }
      getCustomerData()
      // Handle success, such as showing a success message or clearing the form
      showMessage("Successfully added to the database", "success");
  })
  .catch((error) => {
      console.error('Error:', error);
      // Handle errors, such as showing an error message
      showMessage("An error occured" + error, "error");

  });

}

function closeModal() {
  modal.style.display = "none";
  editModal.style.display = "none";
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
      `;

      // Attach contextmenu event listener to each row for selection
      row.addEventListener('click', function(event) {

          event.preventDefault();
          // Toggle 'selected' class
          this.classList.toggle('selected-row');
          
          if (this.classList.contains('selected-row')) {
              // If row is selected, add its reference
              selectedRows.push({id: data.id, reference: this, name: data.name, 
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
fetch('http://localhost:8000/customer/', {
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
    console.log('Success:', data);
    // Handle success, such as showing a success message or clearing the form
    populateTableWithData(data);

  }).catch((error) => {
    console.error('Error:', error);
    // Handle errors, such as showing an error message
  });
}

function editCustomer() {
  editModal.style.display = "block";
  let len = selectedRows.length
  document.getElementById('edit-modal-name').value = selectedRows[len-1].name;
  document.getElementById('edit-modal-abbreviation').value = selectedRows[len-1].abbreviation;
}

document.getElementById('edit-btn').onclick = editCustomer
document.getElementById('delete-btn').onclick = deleteCustomer


function deleteCustomer() {
  if (!selectedRows.length) return
  
  let newEndpoint;
  let endpoint = 'http://localhost:8000/customer/'
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
      console.log('Success:', data);
      const tableBody = document.getElementById('table-body');
      document.getElementById(selectedRow.id).remove()
      // Handle success, such as showing a success message or clearing the form
  })
  .catch((error) => {
      console.error('Error:', error);
      // Handle errors, such as showing an error message
  });
})  
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

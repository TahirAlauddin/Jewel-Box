let isOpened = false;
let images = [];
let currentIndex = 0; // Track the current image index
let imagesFromDatabase = [];
let stonesFromDatabase = [];
let currentOrderId = '';

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

// Validations
function validateInputBeforeSaving(orderData) {
  // For now only verify due_date, rest will go later.
  if (!orderData.order_id) {
    return [false, 'Invalid OrderID'];
  }
  if (!validateOrderID(orderData.order_id)) {
    return [false, 'Invalid OrderID, OrderID must start with the correct Abbreviation']
  }
  if (!verifyDate(orderData.date_due)) {
    return [false, 'Invalid Date']
  }

  return [true, 'Valid'];

}

function verifyDate(date_due) {
  // Check if date_due is in the 'yyyy-mm-dd' format
  const isValidFormat = /^\d{4}-\d{2}-\d{2}$/.test(date_due);

  if (!isValidFormat) {
    return false; // Return false if the format is not valid
  }

  // Parse the date components from date_due
  const [year, month, day] = date_due.split("-").map(Number);

  // Construct a new Date object as UTC
  const date = new Date(Date.UTC(year, month - 1, day));

  // Check if any of the date components are invalid (e.g., month=13, day=32)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return false; // Return false if the date components don't match the input
  }

  // If the date components are valid, return true
  return true;
}

function validateOrderID(orderID) {
  let customerSelect = document.getElementById('customer-select')
  const selectedCustomer = customerSelect.options[customerSelect.selectedIndex].text;
  const abbreviationMatch = selectedCustomer.match(/\(([^)]+)\)/);
  console.log(abbreviationMatch)
  if (abbreviationMatch && !orderID.startsWith(abbreviationMatch[1])) {
    return false;
  }
  return true;

}

async function saveOrder(redirect=false) {
  // Collect main attributes
  const orderData = getData();
  orderData.barcode_generated = false;
  
  // Fixed destructuring for validation results
  let [valid, error_message] = validateInputBeforeSaving(orderData);

  if (!valid) {
    showMessage('Error saving Order: ' + error_message, 'error');
    return false; // Correctly return false if validation fails
  }
  
  // Define the endpoint URL
  const endpoint = `${BASE_URL}/order/`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) throw new Error('Network response was not ok');

    const data = await response.json();
    
    // ? Important line of code 
    // Call performOperations with the order_id
    await performOperations(data.order_id);

    if (redirect) 
      setTimeout(() => {
        document.getElementById('orders-page-btn').click();
      }, 100);

    // Return true if everything succeeds
    return true;

  } catch (error) {
    console.error('Error:', error);
    showMessage('Error saving Order: ' + error, 'error');
    return false; // Return false if fetch fails
  }
}

async function retrieveOrderID() {
  const orderID = localStorage.getItem('orderID');
  const selectedCustomer = localStorage.getItem('selectedCustomer');
  
  if (orderID && selectedCustomer) {
    localStorage.clear()
    document.querySelector('div[name="date-in-input"]').style.display = 'none';

    removeBarcode()
    operation_buttons.innerHTML += 
    `
    <button onclick="saveOrder(redirect=true)" class="save-button">Save order</button>
    `;
    await populateCustomers()
    // await populateCustomers().then(defaultCustomer => {
      // Additional logic using defaultCustomer
      // if (defaultCustomer)
          // document.getElementById('orderID').value = getDynamicOrderID(defaultCustomer)
    // })
  }
  
  // Check if there is an orderID saved
  if (orderID) {
    console.log('Retrieved orderID:', orderID);
    document.getElementById('orderID').value = orderID
    localStorage.removeItem('orderID');
  }

  if (selectedCustomer) {
    console.log('Retrieved selectedCustomer:', selectedCustomer);
    document.getElementById('customer-select').value = selectedCustomer    
    localStorage.removeItem('selectedCustomer');
  }

}

function incrementOrderId(orderID) {
  // Extract the parts of the order ID
  const prefix = orderID.substring(0, 3); // ADL
  const year = orderID.substring(3, 5); // 24
  let id = parseInt(orderID.substring(5), 10); // 001, converted to 1
  
  // Increment the ID
  id++;

  // Format the incremented ID back into the string with leading zeros
  const newId = id.toString().padStart(3, '0');

  // Concatenate everything back together
  return prefix + year + newId; // ADL24002
}

function takeToTheNextPage() {

  async function refreshPageWithOrderID(orderID) {

    const customerSelect = document.getElementById('customer-select');
    const selectedCustomer = customerSelect.options[customerSelect.selectedIndex]; // This line is correct for <select> elements
    
    // Save the orderID in localStorage before refreshing
    orderID = incrementOrderId(orderID)
    
    let response = await fetch(`${BASE_URL}/order/${orderID}`)
    if (response.ok)
      {
        showMessage('Next order already exists', 'error')
        return
      }

    localStorage.setItem('orderID', orderID);
    localStorage.setItem('selectedCustomer', 
                          selectedCustomer.value);
  
    // Refresh the page
    window.location.reload();
  }
  
  refreshPageWithOrderID(document.getElementById('orderID').value)

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

function openWebcam() {

  if (isOpened) return 

  isOpened = true;
  // Get access to the camera
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
          // Create a video element to show the live webcam stream
          // let video = document.createElement('video');
          let video = document.getElementById('webcam-video')
          video.srcObject = stream;
          video.style.display = 'block'
          video.play();

          let deleteBtn = document.getElementById('delete-image')
          deleteBtn.style.display = 'none'

          // Insert the video element into the DOM or replace an existing one
          let container = document.querySelector('.upload-webcam-btn-container');
          // container.appendChild(video);

          // Prompt or create a button for capturing the image
          let captureBtn = document.createElement('button');
          captureBtn.innerText = 'Capture';
          captureBtn.classList.add('capture-button')
          container.appendChild(captureBtn);

          captureBtn.addEventListener('click', function() {
              // Create a canvas to capture and convert the video frame to an image
              let canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              let context = canvas.getContext('2d');
              context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

              // Stop the video stream
              video.srcObject.getTracks().forEach(track => track.stop());
              // video.remove();
              deleteBtn.style.display = 'block'
              video.style.display = 'none';
              captureBtn.remove();

              // Convert canvas to an image and display or process it
              addImageToStack(canvas.toDataURL('image/png')).id = 'new'
              
              document.getElementById('emptyImage').style.display = 'none'
              // Here, you can also implement a way to convert the canvas data to a Blob
              // and then set it as the value of the <input type="file"> if needed

              //finally return isOpened to false, so the user can use webcam btn again
              isOpened = false;
            });
          });
        } else {
          alert("Your browser does not support accessing the webcam.");
        }
}

// Function to add an image to the stack
function addImageToStack(src) {
    const img = document.createElement('img');
    img.src = src;
    img.setAttribute('name', 'captured-images-class')
    img.style.display = 'none'; // Start with the image hidden
    document.getElementById('jewel-images-list').appendChild(img);
    images.push(img);
    if (images.length === 1) {
        // Show the first image if it's the only one
        img.style.display = 'block';
    }
    navigateImage(1)
    return img;
}

// Function to navigate images
function navigateImage(direction) {
    if (images.length === 0) return; // Do nothing if no images
    images[currentIndex].style.display = 'none'; // Hide current image
    currentIndex += direction;
    // Wrap around the images array
    if (currentIndex < 0) currentIndex = images.length - 1;
    if (currentIndex >= images.length) currentIndex = 0;
    images[currentIndex].style.display = 'block'; // Show new current image
}

function deleteImage() {
  if (currentIndex > -1 && images.length > 0) { // Ensure there is an image to delete
      // Remove the image element from the webpage
      images[currentIndex].remove();
      
      // Remove the image from the array
      images.splice(currentIndex, 1);
      
      // After deletion, adjust currentIndex and navigate
      if (images.length === 0) {
          // If no images left, possibly show a placeholder or hide the container
          currentIndex = -1; // Reset currentIndex as there are no images
          document.getElementById('emptyImage').style.display = 'block'; // Show placeholder if desired
      } else {
          // Adjust currentIndex to ensure it's within the new bounds of the array
          if (currentIndex >= images.length) {
              currentIndex = images.length - 1; // Move to the last image if needed
          }
          // Navigate to the new current image
          navigateImage(0); // Pass 0 to simply update visibility without changing index
      }
  }
}

function deleteOrder() {
  let orderId = document.getElementById('orderID').value;
  const endpoint = `${BASE_URL}/order/${orderId}/`;

  fetch(endpoint, {
      method: 'DELETE',
      headers: {
          // Include any necessary authentication headers
          // 'Authorization': 'Bearer <token>'
      }
  })
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text(); // or .json() if your API returns a JSON response
  })
  .then(data => {
      console.log('Order Deleted Successfully');
      // Handle success, such as updating the UI or redirecting the user
      document.getElementById('orders-page-btn').click()
  })
  .catch(error => {
      console.error('Error Deleting Order:', error);
 ipcRenderer.send('show-message-box', {
        type: 'error',
        title: 'ERROR',
        message: `('Error Deleting Order:', ${error});`
    });
      // Handle errors, such as showing an error message to the user
  });
}

const calculateTotals = (expenseInputs, totalCostInput) => {
  let totalCost = 0;
  
  expenseInputs.forEach(input => {
    const value = parseFloat(input.value) || 0;
    totalCost += value;
  });

  totalCostInput.value = totalCost.toFixed(2); // Update the total cost input
};

function getData() {  
  const data = {
    customer: document.getElementById('customer-select').value,
    size: document.getElementById('size').value,
    resize: document.getElementById('resize').value,
    order_id: document.getElementById('orderID').value, 
    ct_number: document.getElementById('ct').value,
    job_number: document.getElementById('jobID').value,
    kt_number: document.getElementById('kt').value,
    invoice_number: document.getElementById('invoiceId').value,
    type: document.getElementById('type').value,
    metal_type: '', // Assuming there's an input for this
    color: document.getElementById('metal').value,
    setter: document.getElementById('setter').value,
    quantity: Number(document.getElementById('quantity').value),
    date_due: document.getElementById('dateDue').value,
    // Expenses
    setting_cost: document.getElementById('setting-input').value,
    polish_cost: document.getElementById('polish-input').value,
    rhodium_cost: document.getElementById('rhodium-input').value,
    soldering_cost: document.getElementById('soldering-input').value,
    miscellaneous_cost: document.getElementById('miscellaneous-input').value,
    color_stone_cost: document.getElementById('color-stone').value,
    finding_cost: document.getElementById('finding-input').value,
    diamonds_cost: document.getElementById('diamonds-input').value,
    mounting_cost: document.getElementById('mounting-input').value,
    others: document.getElementById('others-input').value,
    diamond_weight: document.getElementById('diamond-weight-input').value,
    dpc: document.getElementById('dpc-input').value,
    total_cost: document.getElementById('total-cost-input').value,
    sale_price: document.getElementById('sale-price-input').value,
    // Checkboxes and details
    is_rush: document.querySelector('input[name="rush"]').checked,
    rush_detail: document.getElementById('rush-detail').value, // Assuming there's an ID for this

    is_order: document.querySelector('input[name="order"]').checked,
    order_detail: document.getElementById('order-detail').value, // Assuming there's an ID for this
    is_clean: document.querySelector('input[name="clean"]').checked,
    clean_detail: document.getElementById('clean-detail').value, // Assuming there's an ID for this
    is_polish: document.querySelector('input[name="polish"]').checked,
    polish_detail: document.getElementById('polish-detail').value, // Assuming there's an ID for this
    is_stamp: document.querySelector('input[name="stamp"]').checked,
    stamp_detail: document.getElementById('stamp-detail').value, // Assuming there's an ID for this
    is_rhodium: document.querySelector('input[name="rhodium"]').checked,
    rhodium_detail: document.getElementById('rhodium-detail').value, // Assuming there's an ID for this
    is_repair: document.querySelector('input[name="repair"]').checked,
    repair_detail: document.getElementById('repair-detail').value, // Assuming there's an ID for this
    is_set: document.querySelector('input[name="set"]').checked,
    set_detail: document.getElementById('set-detail').value, // Assuming there's an ID for this

    // Include other checkboxes and details similarly
    order_notes: document.querySelector('textarea[name="order_notes"]').value,
    // Assuming you have a way to collect invoice and stone specification information
    shipping_details: document.getElementById('shipping-details').value || '',
};  

return data;
}

//  UPDATE STONES
async function updateOrAddStone(orderId, stone, cell) {
  const endpointBase = `${BASE_URL}/order/${orderId}/stones/`;
  let endpoint;
  let method;

  if (stone.id.startsWith("new")) {
      // Handle new stone
      endpoint = endpointBase; // POST to the collection endpoint
      method = 'POST';
  } else {
      // Handle existing stone
      endpoint = `${endpointBase}${stone.id}/`; // PATCH to the specific stone endpoint
      method = 'PATCH';
  }

  await fetch(endpoint, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
          // Include any necessary authentication headers
      },
      body: JSON.stringify(stone),
  })
  .then(response => response.json())
  .then(data => {
      cell.id = String(data.id)
      // Handle success, such as updating the UI or showing a confirmation
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

async function collectAndSaveStones(orderId) {
  const stonesData = [];  
  const rows = document.querySelectorAll('.table-row');

  rows.forEach(async row => {
      let cells = row.querySelectorAll('td');
      cells = row ? Array.from(cells) : [];

      let quantity = cells[4].textContent.trim();
      let length = cells[5].textContent.trim();
      let width = cells[6].textContent.trim();
      let height = cells[7].textContent.trim();
      let carat_total = cells[8].textContent.trim();

      if (isNaN(quantity) || isNaN(length) || isNaN(width) || isNaN(height) || isNaN(carat_total)) {
        showMessage('Quantity, Length, Width, Height or Carat are not valid numbers.', 'error')
        return;
      }

      let stone = {
          id: cells[0].id, // Assuming the first cell contains the ID
          stone_type: cells[1].textContent.trim(),
          cut: cells[2].textContent.trim(),
          stone_number: cells[3].textContent.trim(),
          quantity: Number(quantity),
          length: Number(length),
          width: Number(width),
          height: Number(height),
          carat_total: Number(carat_total),
          order: orderId
      };

      stonesData.push(stone);
      let hasNonEmptyCell = cells.some((cell, index) => index > 0 && cell.textContent.trim() !== "");
      if (hasNonEmptyCell) {
          await updateOrAddStone(orderId, stone, cells[0]);
      } else {
          showMessage('Cannot save an empty Stone', 'error')
      }
  });

  let currentStoneIds = Array.from(stonesData).map(stone => stone.id)
  let databaseStoneIds = Array.from(stonesFromDatabase).map(stone => stone.id)
  databaseStoneIds.forEach(async databaseStoneId => {
    if (!currentStoneIds.includes(String(databaseStoneId))) {
      await deleteIndividualStoneDatabase(orderId, String(databaseStoneId))
    }
  })
}

async function postImageDatabase(orderId, imageSrc) {
  const endpoint = `${BASE_URL}/order/${orderId}/images/`;

  try {
    const response = await fetch(imageSrc);
    if (!response.ok) throw new Error(`HTTP error while fetching image! status: ${response.status}`);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('image', blob, `image.png`); // Append the blob as 'image'
    formData.append('order', orderId);

    // Send the request with FormData
    const postResponse = await fetch(endpoint, {
      method: 'POST',
      // Avoid setting Content-Type header when using FormData
      // Headers like authentication should be added here if required
      body: formData,
    });

    if (!postResponse.ok) throw new Error(`HTTP error! status: ${postResponse.status}`);
    
    // Assuming success if we reach this point
    return true; // Function returns true if everything was successful
  } catch (error) {
    console.error('Image Error:', error);
    ipcRenderer.send('show-message-box', {
            type: 'error',
            title: 'Error',
            message: `Error: ${error})`
        });
    throw error; // Rethrow the error or handle it as needed
  }
}


async function deleteAllImages(orderId) {
  const endpoint = `${BASE_URL}/order/${orderId}/images/`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      // Assuming deleteIndividualImageDatabase is an async function
      const deletePromises = data.map(image => deleteIndividualImageDatabase(orderId, image.id));
      await Promise.all(deletePromises);
      console.log('All images deleted successfully.');
      return true;
    } else {
      console.log('No images found for this order.');
      return false;
    }
  } catch (error) {
    console.error('Error fetching images:', error);
    ipcRenderer.send('show-message-box', {
      type: 'error',
      title: 'Error',
      message: `${error}`
    });
    throw error; // Rethrow or handle as needed
  }
}




async function deleteIndividualImageDatabase(orderId, imageId) {
  
    // Endpoint for deleting all images associated with an order
    const endpoint = `${BASE_URL}/order/${orderId}/images/${imageId}/`;

    fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // Include authentication headers if needed
            // 'Authorization': 'Bearer <your-access-token>'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.text(); // Assuming the API does not return a JSON response for DELETE operations
    })
    .then(data => {
        console.log('Image deleted successfully');
        // Handle successful deletion, e.g., update the UI accordingly
    })
    .catch(error => {
        console.error('Error deleting image:', error);
        ipcRenderer.send('show-message-box', {
                type: 'error',
                title: 'ERROR',
                message: `('Error deleting image:', error);`
            });
        // Handle any errors that occur during the fetch operation
    });
}

async function deleteIndividualStoneDatabase(orderId, stoneId) {
    // Endpoint for deleting all images associated with an order
    const endpoint = `${BASE_URL}/order/${orderId}/stones/${stoneId}/`;

    fetch(endpoint, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // Include authentication headers if needed
            // 'Authorization': 'Bearer <your-access-token>'
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
        console.error('Error deleting stone:', error);
 ipcRenderer.send('show-message-box', {
        type: 'error',
        title: 'ERROR',
        message: `('Error deleting stone:', error);`
    });
        // Handle any errors that occur during the fetch operation
    });

}
async function collectAndSaveImages(orderId) {
  const imagesContainer = document.getElementById('jewel-images-list');
  const capturedImages = imagesContainer.querySelectorAll('img[name="captured-images-class"]'); // Assuming images are <img> elements within the container
  
  // It seems there's a typo in your check; it should be 'capturedImages' instead of 'images'
  if (!capturedImages || capturedImages.length === 0) {
    return deleteAllImages(orderId);
  } else {
    // Use Promise.all to wait for all postImageDatabase promises to resolve
    await Promise.all(Array.from(capturedImages).map(async (image) => {
      const imageId = image.id;
      const imageSrc = image.src;
      if (imageId === 'new') {
        await postImageDatabase(orderId, imageSrc);
      }
    }));

    // Assuming 'imagesFromDatabase' is fetched somewhere in your code before this part
    const currentImageIds = Array.from(capturedImages).map(image => image.getAttribute('id'));

    // Use Promise.all to wait for all delete operations to complete
    await Promise.all(imagesFromDatabase.map(async (imageUrl) => {
      const parts = imageUrl.split('/').filter(part => part);
      const imageId = parts[parts.length - 1];
      if (!currentImageIds.includes(imageId)) {
        await deleteIndividualImageDatabase(orderId, imageId);
      }
    }));
  }
}

// When calling collectAndSaveImages and other async functions together:
async function performOperations(orderId) {
  try {
    // Ensure collectAndSaveImages finishes before moving on
    await collectAndSaveImages(orderId);
    // Assuming collectAndSaveStones is defined elsewhere and is also async
    await collectAndSaveStones(orderId);
    // Proceed with other operations after both have completed
  } catch (error) {
    console.error('An error occurred:', error);
 ipcRenderer.send('show-message-box', {
        type: 'error',
        title: 'ERROR',
        message: `An error occurred:', ${error}`
    });
  }
}


async function updateOrder() {
  // let orderId = document.getElementById('orderID').value;
  let updateData = getData();

  // Fixed destructuring for validation results
  let [valid, error_message] = validateInputBeforeSaving(updateData);
  
  if (!valid) {
    showMessage('Error saving Order: ' + error_message, 'error');
    return false; // Correctly return false if validation fails
  }

  // Define the endpoint URL, including the order ID
  const endpoint = `${BASE_URL}/order/${currentOrderId}/`;

  try {
    const response = await fetch(endpoint, {
      method: 'PATCH', // Use PATCH for partial updates
      headers: {
          'Content-Type': 'application/json',
          // Include authorization header if required, e.g., 'Authorization': 'Bearer <token>'
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    let data = await response.json();
    console.log('Order Update was Successful');
    
    // ? Important line of code 
    // Call performOperations with the order_id
    await performOperations(data.order_id);

      setTimeout(() => {
        document.getElementById('orders-page-btn').click();
      }, 100);

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


function populateOrder(id) {
  const endpoint = `${BASE_URL}/order/${id}/`;

  fetch(endpoint)
  .then(response => {
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
  })
  .then(data => {
      // Assuming 'data' is the JSON object with the fields corresponding to the form inputs
      // document.getElementById('customer').value = data.customer || '';
      currentOrderId = data.order_id;
      populateCustomers(data.customer) 
      document.getElementById('size').value = data.size || '';
      document.getElementById('resize').value = data.resize || '';
      document.getElementById('orderID').value = data.order_id || '';
      document.getElementById('ct').value = data.ct_number || '';
      document.getElementById('jobID').value = data.job_number || '';
      document.getElementById('kt').value = data.kt_number || '';
      document.getElementById('dateIn').value = data.date_in ? data.date_in.split('T')[0] : '';
      document.getElementById('dateDue').value = data.date_due || '';
      document.getElementById('invoiceId').value = data.invoice_number || '';
      document.getElementById('metal').value = data.color || '';
      document.getElementById('setter').value = data.setter || '';
      document.getElementById('type').value = data.type || '';
      document.getElementById('quantity').value = data.quantity || '';

      // Handle checkboxes and their details
      document.querySelector('input[name="rush"]').checked = data.is_rush;
      document.getElementById('rush-detail').value = data.rush_detail || '';
      document.querySelector('input[name="order"]').checked = data.is_order;
      document.getElementById('order-detail').value = data.order_detail || '';
      document.querySelector('input[name="polish"]').checked = data.is_polish;
      document.getElementById('polish-detail').value = data.polish_detail || '';
      document.querySelector('input[name="stamp"]').checked = data.is_stamp;
      document.getElementById('stamp-detail').value = data.stamp_detail || '';
      document.querySelector('input[name="clean"]').checked = data.is_clean;
      document.getElementById('clean-detail').value = data.clean_detail || '';
      document.querySelector('input[name="rhodium"]').checked = data.is_rhodium;
      document.getElementById('rhodium-detail').value = data.rhodium_detail || '';
      document.querySelector('input[name="repair"]').checked = data.is_repair;
      document.getElementById('repair-detail').value = data.repair_detail || '';
      document.querySelector('input[name="set"]').checked = data.is_set; // Assuming there's a 'is_setter' in data
      document.getElementById('set-detail').value = data.set_detail || ''; // Assuming there's a 'setter_detail' in data

      document.getElementById('setting-input').value = data.setting_cost || 0;
      document.getElementById('soldering-input').value = data.soldering_cost || 0;
      document.getElementById('clean-input').value = data.clean_cost || 0;
      document.getElementById('miscellaneous-input').value = data.miscellaneous_cost || 0;
      document.getElementById('color-stone').value = data.color_stone_cost || 0;
      document.getElementById('finding-input').value = data.finding_cost || 0;
      document.getElementById('diamonds-input').value = data.diamonds_cost || 0;
      document.getElementById('mounting-input').value = data.mounting_cost || 0;
      document.getElementById('polish-input').value = data.polish_cost || 0;
      document.getElementById('rhodium-input').value = data.rhodium_cost || 0;
      document.getElementById('dpc-input').value = data.dpc || 0;
      document.getElementById('diamond-weight-input').value = data.diamond_weight || 0;
      document.getElementById('others-input').value = data.others || 0;
      document.getElementById('total-cost-input').value = data.total_cost || 0;
      document.getElementById('sale-price-input').value = data.sale_price || 0;
      // Update revenue percentage, right after populating sale-price
      updateRevenuePercent();

      document.getElementById('shipping-details').value = data.shipping_details || '';
      if (data.barcode) {
        document.getElementById('barcode-img').src = data.barcode;
      }
      
      // If images are included
      if (data.images && data.images.length > 0) {
        
        imagesFromDatabase = data.images;  
        data.images.forEach(image => {
          fetch(image)
          .then(response => {
              if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
              return response.json();
            })
          .then(data => {
            let imgElement = addImageToStack(data.image)
            imgElement.id = data.id;
            })
          })
          document.getElementById('emptyImage').style.display = 'none' 
        }
      
      // If there are stone specifications
      if (data.stones && data.stones.length > 0) {
        stonesFromDatabase = data.stones;
          // Handle stone specifications population
          const stoneSpecsTableBody = document.querySelector('.stone-specification .table-container tbody');
          data.stones.forEach(stone => {
              const stoneRow = document.createElement('tr');
              stoneRow.className = 'table-row';
              stoneRow.innerHTML = `
                  <td id="${stone.id}" style="display: none"></td>
                  <td contentEditable=true class="table-column">${stone.stone_type}</td>
                  <td contentEditable=true class="table-column">${stone.cut}</td>
                  <td contentEditable=true class="table-column">${stone.stone_number}</td>
                  <td contentEditable=true class="table-column">${stone.quantity}</td>
                  <td contentEditable=true class="table-column">${stone.length}</td>
                  <td contentEditable=true class="table-column">${stone.width}</td>
                  <td contentEditable=true class="table-column">${stone.height}</td>
                  <td contentEditable=true class="table-column">${stone.carat_total}</td>
                  <td><button class="delete-row"><img src="svg/minus.svg" alt=""></button></td>
              `;
              stoneSpecsTableBody.appendChild(stoneRow);
          });    
      }

      addEvents()

      // Populate order notes
      document.getElementById('order-notes').innerHTML = data.order_notes || '';

  })
  .catch((error) => {
      console.error('Error:', error);
 ipcRenderer.send('show-message-box', {
        type: 'error',
        title: 'ERROR',
        message: `('Error:', error);`
    });
      // Handle fetch error, such as displaying a message to the user
  });
}

document.getElementById('imageInput').addEventListener('change', function(event) {
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = function(e) {
  
  addImageToStack(e.target.result).id = 'new';
  
  document.getElementById('emptyImage').style.display = 'none'
  };
  reader.readAsDataURL(file);
});

document.getElementById('left-arrow-btn').addEventListener('click', () => navigateImage(-1));
document.getElementById('right-arrow-btn').addEventListener('click', () => navigateImage(1));

// Add Button
document.getElementById('add-row')
.addEventListener('click', () => addRow())

// Delete Stones Rows
addEvents()

// JQUERY
$(document).ready(function() {
  $('input.currency').currencyInput();
  $("input.percent").percentageInput();
  $('input.not-currency').notCurrencyInput();
  $('input.mass').massInput();
});
 
async function getDynamicOrderID(abbreviation) {
  try {
    const endpoint = `${BASE_URL}/get_latest_order_id/${abbreviation}`;

    const response = await fetch(endpoint);
    if (!response.ok) {
      document.getElementById('orderID').value = ''
      throw new Error('Network response was not ok.');
    }
    const data = await response.json();

    let newSequenceNum = 1; // Default sequence number if no previous order exists
    if (data.orderID) {
        const idWithoutYear = data.orderID.slice(abbreviation.length + 2); // Remove abbreviation and year from the ID
        const lastSequenceNum = parseInt(idWithoutYear, 10); // Parse the numeric part of the sequence
        newSequenceNum = lastSequenceNum + 1;
        // We are putting it inside the condition is because we wanna make 
        // sure that the first Order Id is 001 no matter what
          let leaveSpaceInput = document.getElementById('leave-space-input').value;
          if (!leaveSpaceInput) {
              leaveSpaceInput = '0';
          }
          newSequenceNum += parseInt(leaveSpaceInput);
      
    }

    const year = new Date().getFullYear() % 100; // Get the last two digits of the current year
    const formattedSequenceNum = `${newSequenceNum}`.padStart(3, '0');
    // Construct the new order ID
    const orderId = `${abbreviation}${year}${formattedSequenceNum}`;

    // Set the generated order ID into the input box with id 'order-id'
    document.getElementById('orderID').value = orderId;
  } catch (error) {
    console.error('Failed to fetch latest order ID:', error);
 ipcRenderer.send('show-message-box', {
        type: 'error',
        title: 'ERROR',
        message: `('Failed to fetch latest order ID:', error);`
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Add change event listeners to all expense inputs
  const expenseInputs = document.querySelectorAll('.expense-div-grid .currency:not([name="total-cost-input"]):not([name="sale-price-input"])');
  const totalCostInput = document.querySelector('#total-cost-input');
  // const salePriceInput = document.querySelector('#sale-price-input');
  expenseInputs.forEach(input => input.addEventListener('input', () => calculateTotals(expenseInputs, totalCostInput)));
 
  // Assuming the abbreviation is extracted as before, call updateOrderId with the abbreviation
  document.getElementById('customer-select').addEventListener('change', function() {
    const selectedCustomer = this.options[this.selectedIndex].text;
    const abbreviationMatch = selectedCustomer.match(/\(([^)]+)\)/);
    if (abbreviationMatch) {
      const abbreviation = abbreviationMatch[1].toUpperCase();
      if (abbreviation)
        getDynamicOrderID(abbreviation);
    }
  });
  
  document.getElementById('leave-space-input').addEventListener('change', function() {
    if (document.getElementById('orderID').value.endsWith('001')) {
      return;
    }
    const customerSelect = document.getElementById('customer-select');
    const selectedOption = customerSelect.options[customerSelect.selectedIndex]; // This line is correct for <select> elements
    const selectedCustomer = selectedOption.text; // Corrected to use selectedOption for clarity
    const abbreviationMatch = selectedCustomer.match(/\(([^)]+)\)/);

    if (abbreviationMatch) {
        const abbreviation = abbreviationMatch[1].toUpperCase();
        if (abbreviation)  
          getDynamicOrderID(abbreviation); // Ensure getDynamicOrderID function is defined elsewhere
    }
  });


  document.getElementById('save-and-add-button').addEventListener('click', async () => {
    let functionSaveAndAdd; 
    if (document.getElementById('edit-button')) {
      functionSaveAndAdd = updateOrder;
    }
    else {
      functionSaveAndAdd = saveOrder;
    }
    let response = await functionSaveAndAdd()
    if (response) {
      takeToTheNextPage()
    }
  })
  
  // this is what will happen after we move to the next page
  retrieveOrderID()

    // Set the default value of the date input
  document.getElementById('dateDue').value = getDateAfterSevenDays();

})

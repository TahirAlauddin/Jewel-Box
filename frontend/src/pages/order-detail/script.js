let isOpened = false;
let images = [];
let currentIndex = 0; // Track the current image index

(function($) {
    $.fn.currencyInput = function() {
      this.each(function() {
        var wrapper = $("<div class='currency-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span class='currency-symbol'>$</span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };

    $.fn.notCurrencyInput = function() {
      this.each(function() {
        var wrapper = $("<div class='currency-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span></span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };


    $.fn.massInput = function() {
      this.each(function() {
        var wrapper = $("<div class='mass-input' />");
        $(this).wrap(wrapper);
        $(this).before("<span class='mass-symbol'>Ct</span>");
        $(this).change(function() {
          var min = parseFloat($(this).attr("min"));
          var max = parseFloat($(this).attr("max"));
          var value = this.valueAsNumber;
          if(value < min)
            value = min;
          else if(value > max)
            value = max;
          $(this).val(value.toFixed(2)); 
        });
      });
    };
 
  })(jQuery);
  
  $(document).ready(function() {
    $('input.currency').currencyInput();
  });
  $(document).ready(function() {
    $('input.not-currency').notCurrencyInput();
  });
  $(document).ready(function() {
    $('input.mass').massInput();
  });



function deleteRow(args) {
  $(this).closest('tr').remove();
}
function addRow(args) {
  let row = `
  <tr class="table-row">
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td class="table-column">TEXT</td>
  <td><button class="delete-row"><img src="minus.svg" alt=""></button></td>
</tr>
`
  let table = $('table.table-container');
  table.append(row)
  // Add listeners on new objects
  addEvents()
  
}

// Add Button
document.getElementById('add-row')
.addEventListener('click', () => addRow())

function addEvents () {
$('.delete-row').each(function() {
  $(this).on('click', deleteRow);
});

}

addEvents()


function saveOrder() {
    // Collect main attributes
    const orderData = {
        customer: document.getElementById('customer').value,
        size: document.getElementById('size').value,
        order_number: document.getElementById('orderID').value, // Assuming 'orderID' corresponds to 'order_number'
        ct_number: document.getElementById('ct').value,
        job_number: document.getElementById('jobID').value,
        kt_number: document.getElementById('kt').value,
        invoice_number: document.getElementById('invoiceId').value,
        shipping_details: '', // Assuming there's an input for this
        metal_type: document.getElementById('metal').value,
        color: '', // Assuming there's an input for this
        setter: document.getElementById('setter').value,
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
        others: '', // Assuming there's an input for this
        diamond_weight: document.getElementById('diamond-weight-input').value,
        dpc: document.getElementById('dpc-input').value,
        total_cost: document.getElementById('total-cost-input').value,
        sale_price: document.getElementById('sale-price-input').value,
        // Checkboxes and details
        is_polish: document.querySelector('input[name="polish"]').checked,
        polish_detail: document.getElementById('polish-detail').value, // Assuming there's an ID for this
        // Include other checkboxes and details similarly
        order_notes: document.querySelector('textarea[name="order_notes"]').value,
        // Assuming you have a way to collect invoice and stone specification information
    };

    // Define the endpoint URL
    const endpoint = 'https://yourapi.com/api/orders';

    // Send a POST request with the collected data
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        // Handle success
    })
    .catch((error) => {
        console.error('Error:', error);
        // Handle errors
    });
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
              addImageToStack(canvas.toDataURL('image/png'))
              
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
      
document.getElementById('imageInput').addEventListener('change', function(event) {
  let file = event.target.files[0];
  let reader = new FileReader();
  reader.onload = function(e) {
  
  addImageToStack(e.target.result)
  
  document.getElementById('emptyImage').style.display = 'none'
  };
  reader.readAsDataURL(file);
});


// Function to add an image to the stack
function addImageToStack(src) {
    const img = document.createElement('img');
    img.src = src;
    img.style.display = 'none'; // Start with the image hidden
    document.getElementById('jewel-images-list').appendChild(img);
    images.push(img);
    if (images.length === 1) {
        // Show the first image if it's the only one
        img.style.display = 'block';
    }
    navigateImage(1)
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

document.getElementById('left-arrow-btn').addEventListener('click', () => navigateImage(-1));
document.getElementById('right-arrow-btn').addEventListener('click', () => navigateImage(1));

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

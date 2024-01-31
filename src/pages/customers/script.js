// Get the modal
var modal = document.getElementById("myModal");

// Get the button that opens the modal
var btn = document.getElementById("add-customer-btn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("delete-image")[0];

var addButton = document.getElementById("addButton")

// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

addButton.onclick = function() {
  closeModal()
}


function closeModal() {
  modal.style.display = "none";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  closeModal()
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    closeModal()
  }
}

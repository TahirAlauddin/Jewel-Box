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
  
  // Example usage
  // showConfirmation('Are you sure?', function() { console.log('Confirmed!'); });
  
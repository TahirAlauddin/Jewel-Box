
try {
    const { ipcRenderer } = require('electron');
}  catch {
}
let { resolve } = require('path');
resolve = require('path').resolve

function showLoginSuccessMessage(page) {   
    // Trigger the IPC event to show the dialog
    ipcRenderer.send('show-message-box', {
        type: 'info',
        title: 'Login Successful',
        message: `Successfully Logged In! Navigate to ${page} `
    });
}

// Function to tell Electron to navigate to another page
function navigateTo(page) {
    ipcRenderer.send('navigate', page);
}

function verifyPassword() {
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;  
    
    if (email == "") {
        document.getElementById("email-message").innerHTML = "**Fill the email please!";  
    }
    if(password == "") {  
        document.getElementById("password-message").innerHTML = "**Fill the password please!";  
        return false
    }  
    
    let isValid = login(email, password)
    
    if(isValid) {  
        navigateTo('orders')
        return true;
    } else {  
        document.getElementById("password-message").innerHTML = "**Incorrect Password";  
        return false;  
    }  
  }  
  
function login (email, password) {
    if (email == 'email' && password == 'password')
        return true;
    return false;
}



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("email").focus();
})
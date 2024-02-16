const { ipcRenderer } = require('electron');

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

  // Example POST method implementation:
async function postData(url = "", data = {}, method = "GET") {
    // Default options are marked with *
    const response = await fetch(url, {
      method: method, // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  
  
async function login (email, password) {
    let data = await postData('http://localhost:8000/login/', 
            {'email': email, 'password': password}, 'POST')
    
    if (data.loggedIn) {
        return true; 
    } else {
        return false;
    }
        
}



document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("email").focus();
})
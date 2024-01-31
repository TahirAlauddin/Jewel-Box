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
        alert("Password is correct");  
    } else {  
        document.getElementById("password-message").innerHTML = "**Incorrect Password";  
        return false;  
    }  
  }  
  
function login () {
    return false;
}
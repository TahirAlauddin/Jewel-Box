function showLoginSuccessMessage(page) {
  // Trigger the IPC event to show the dialog
  ipcRenderer.send("show-message-box", {
    type: "info",
    title: "Login Successful",
    message: `Successfully Logged In! Navigate to ${page} `,
  });
}

function verifyPassword() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;

  if (email == "") {
    document.getElementById("email-message").innerHTML =
      "**Fill the email please!";
  }
  if (password == "") {
    document.getElementById("password-message").innerHTML =
      "**Fill the password please!";
    return false;
  }

  login(email, password);
}

// Function to tell Electron to navigate to another page
function navigateTo(page) {
  ipcRenderer.send("navigate", page);
}
async function postData(url = "", data = {}, method = "GET") {
  try {
    let response = await fetch(url, {
      method: method,
      mode: "cors",
      cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Assuming you want to throw for any non-2xx response:
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log("response is coming from here");
    return response; // You might want to return response.json() or similar here
  } catch (error) {
    console.error(error.message);

    // Decide what to return or re-throw based on the error
    if (error.message.includes("Failed")) {
      console.log("Connection refused or failed.");
    } else if (
      error.message.includes("unauthorized") ||
      error.message.includes("HTTP error")
    ) {
      return { status: 401, error: error.message };
    }

    // Fallback error handling
    return { status: 404, error: error.message };
  }
}

async function login(email, password) {
  let response = await postData(
    `${BASE_URL}/login/`,
    { email: email, password: password },
    "POST"
  );

  if (response && response.status === 404)
    ipcRenderer.send("show-message-box", {
      type: "info",
      title: "Login Successful",
      message:
        "Couldn't connect with the server. Make sure the server is running and configured properly.",
    });
  console.log(response);

  if (response && response.status == 200) {
    navigateTo("orders");
  } else {
    document.getElementById("password-message").innerHTML =
      "**Incorrect Password";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("email").focus();
  let softwareVersion = ''
  
  ipcRenderer.on('version', (event, args) => {
      if (args && args.version) {
          softwareVersion = args.version;
          document.getElementById("software-version").textContent = softwareVersion;
        }
    });

});

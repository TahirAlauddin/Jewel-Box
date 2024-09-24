const { spawn } = require("child_process");
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  globalShortcut,
} = require("electron");
const { resolve } = require("path");
const fs = require("fs");
const os = require("os");
const path = require("path");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const jewelBoxFolderPath = path.join(os.homedir(), "JewelBox");

// Ensure the JewelBox folder exists
if (!fs.existsSync(jewelBoxFolderPath)) {
  fs.mkdirSync(jewelBoxFolderPath);
}

// This will create a path to "version.json" inside a "JewelBox" directory within the user's home directory
const versionFilePath = path.join(jewelBoxFolderPath, "version.json");
// This will create a path to "ipAddress.txt" inside a "JewelBox" directory within the user's home directory
const ipFilePath = path.join(jewelBoxFolderPath, "ipAddress.txt");
const SOFTWARE_VERSION = "3.0.0"; // Invoice Printer Selection, Total Price fix
let runningAsPackaged = false;
let mainWindow;
let BASE_URL;
const isDev = process.env.NODE_ENV === "development";

// Replace hard-coded AWS credentials with environment variables
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

if (
  process.defaultApp ||
  /[\\/]electron-prebuilt[\\/]/.test(process.execPath) ||
  /[\\/]electron[\\/]/.test(process.execPath)
) {
  // Running in development mode (with npm run or electron .)
} else {
  // Running as a packaged application
  runningAsPackaged = true;
}

function updateIpAddress() {
  if (fs.existsSync(ipFilePath)) {
    fs.unlinkSync(ipFilePath);
  }
  createInputWindow();
}

function writeVersionToFile(version) {
  // Check if the file already exists
  if (!fs.existsSync(versionFilePath)) {
    // Create the version object
    const versionData = {
      version: version,
    };

    // Write version information to the file
    fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
    console.log("Version information written to version.json.");
  } else {
    // Read the version from the file
    const versionFile = fs.readFileSync(versionFilePath);
    const versionData = JSON.parse(versionFile);
    const currentVersion = versionData.version;

    // Compare the argument version with the version in the file
    if (version > currentVersion) {
      // Update the version in the file
      versionData.version = version;
      fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2));
      console.log("Version updated in version.json.");
    }
  }
}

// Make sure the version file is there
writeVersionToFile(SOFTWARE_VERSION);

// Function to check for updates on AWS S3 buckets
async function checkForUpdates() {
  // Read version information from version.json file
  const versionFile = fs.readFileSync(versionFilePath);

  // Read local version from version.json file
  const versionData = JSON.parse(versionFile);
  const localVersion = versionData.version;

  // Configure AWS SDK with your credentials
  AWS.config.update({ accessKeyId, secretAccessKey });

  // Create an S3 service object
  const s3 = new AWS.S3();
  let bucketname = "jewelbox";
  let directoryname = "jewel-box-client/";
  let outputpath = "./jewelbox.zip";

  // Define parameters for listing objects in the bucket
  const params = {
    Bucket: "jewelbox",
    Prefix: "jewel-box-client",
  };

  // List objects in the bucket
  s3.listObjectsV2(params, async (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    // Check if there are any objects in the bucket
    if (data.Contents.length > 0) {
      // Extract the latest version from the list of objects
      const latestVersion = data.Contents.map((obj) =>
        obj.Key.replace(".zip", "").replace(directoryname, "")
      )
        .sort((a, b) => a.localeCompare(b))
        .pop();

      let remoteFile = directoryname + latestVersion + ".zip";
      // Check if the local version is less than the latest version
      if (localVersion < latestVersion) {
        console.log("New Update available");

        // Trigger script to download and install the latest version
        await triggerUpdateProcess(bucketname, remoteFile, outputpath);
      } else {
        console.log("No new version available.");
      }
    } else {
      console.log("No objects found in the bucket.");
    }
  });
}

const updateTimer = setInterval(checkForUpdates, 3600000); // 3600000 ms = 1 hour
checkForUpdates();

// Function to show a confirmation dialog
async function showConfirmationDialog(message) {
  return new Promise((resolve, reject) => {
    const options = {
      type: "question",
      buttons: ["Yes", "No"],
      defaultId: 0,
      title: "Confirm",
      message: message,
    };

    // Show the message box
    dialog
      .showMessageBox(options)
      .then((response) => {
        resolve(response.response === 0); // Resolve with true if 'Yes' button is clicked, false otherwise
      })
      .catch((err) => {
        reject(err); // Reject with error if dialog cannot be shown
      });
  });
}

// Code to trigger the update process
async function triggerUpdateProcess(bucketname, remoteFile, outputpath) {
  // Ask user for confirmation
  const confirmUpdate = await showConfirmationDialog(
    "Do you want to install the updates?"
  );
  if (confirmUpdate) {
    // Start the update process if user confirms
    const updateProcess = spawn("cmd", [
      "/c",
      "start",
      path.join('dist', 'Updater.exe'),

      bucketname,
      remoteFile,
      outputpath,
    ]);
    app.quit();
  }
  clearInterval(updateTimer);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: "jewel-box-logo.ico",

    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // This should be true for security reasons
      enableRemoteModule: true, // Explicitly enable the remote module
    },
  });

  // Create a custom menu (an example menu without developer tools)
  const menuTemplate = [
    {
      label: "File",
      submenu: [{ role: "quit" }],
    },

    {
      label: "Edit",
      submenu: [{ role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    // Add other menus as needed
  ];

  // Set the application menu
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on("ready-to-show", () => {
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // mainWindow.loadFile('src/pages/orders/index.html');
  // mainWindow.loadFile('src/pages/customers/index.html');
  mainWindow.loadFile('src/pages/login/index.html');
  // mainWindow.loadFile("src/pages/invoices/index.html");
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('version', { version: SOFTWARE_VERSION });
  });
  mainWindow.on("closed", function () {
    mainWindow = null;
  });

  mainWindow.maximize();

  mainWindow.on("focus", () => {
    globalShortcut.register("Ctrl+W", () => {
      // Close the specific window, or use app.quit() to quit the app
      mainWindow.close(); // Adjust as needed
    });
  });

  mainWindow.on("blur", () => {
    globalShortcut.unregister("Ctrl+W");
  });

  app.on("will-quit", () => {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
  });
}

function createInputWindow() {
  let inputWin = new BrowserWindow({
    width: 400,
    height: 200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity, disabled. Consider security implications.
      enableRemoteModule: true, // Explicitly enable the remote module
    },
  });

  inputWin.loadFile("src/input.html"); // Load the HTML file with your form

  ipcMain.once("save-ip", (event, ip) => {
    fs.mkdirSync(path.dirname(ipFilePath), { recursive: true }); // Ensure the directory exists
    fs.closeSync(fs.openSync(ipFilePath, "a")); // Create the file if it doesn't exist

    fs.writeFileSync(ipFilePath, ip); // Save IP to a file
    BASE_URL = `http://${ip}:8000`; // Use the function to set BASE_URL
    createWindow(); // You should create the main window here only if it's not already created
    inputWin.close(); // Close the window after saving
  });

  inputWin.on("closed", () => {
    inputWin = null; // Dereference the object to prevent memory leaks
  });
}

// Listen for the navigate message from the renderer process
ipcMain.on("navigate", (event, page, args) => {
  let path;
  if (runningAsPackaged == true) {
    base_path = "./resources/app/src";
  } else {
    base_path = "./src";
  }
  if (page == "orders") {
    path = resolve(`${base_path}/pages/orders/index.html`);
    mainWindow.loadFile(path);
  } else if (page == "invoices") {
    path = resolve(`${base_path}/pages/invoices/index.html`);
    mainWindow.loadFile(path);
  } else if (page == "customers") {
    path = resolve(`${base_path}/pages/customers/index.html`);
    mainWindow.loadFile(path);
  } else if (page == "order-detail") {
    path = resolve(`${base_path}/pages/order-detail/index.html`);
    mainWindow.loadFile(path);
    // Send the arguments to the renderer process
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.send("page-data", args);
    });
  } else if (page == "invoice-detail") {
    path = resolve(`${base_path}/pages/invoice-detail/index.html`);
    mainWindow.loadFile(path);
    // Send the arguments to the renderer process
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.send("page-data", args);
    });
  } else if (page == "login") {
    console.log(BASE_URL);
    path = resolve(`${base_path}/pages/login/index.html`);
    mainWindow.loadFile(path);
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.send('page-data', { version: SOFTWARE_VERSION });
    });
  } else if (page == "admin") {
    path = `${BASE_URL}/admin/`;

    const urlRegex =
      /^(http:\/\/|https:\/\/)?(([\da-z.-]+)\.([a-z.]{2,6})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))([\/\w .-]*)*\/?$/;

    console.log(BASE_URL);
    // Validate the base URL provided by the user
    if (!urlRegex.test(BASE_URL.split(":8000")[0])) {
      dialog.showErrorBox("title", "Invalid URL provided by the user.");
      return; // Exit the function if the URL is invalid
    }

    // Ensure the URL starts with http:// or https://
    let validatedUrl =
      BASE_URL.startsWith("http://") || BASE_URL.startsWith("https://")
        ? BASE_URL
        : `${BASE_URL}`;

    path = `${validatedUrl}/admin/`;

    // Create a new BrowserWindow instance
    let newWindow = new BrowserWindow({
      width: 800, // Set the width of the new window
      height: 600, // Set the height of the new window
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false, // Adjust according to your security needs
      },
    });
    // Load the URL in the new window
    newWindow.loadURL(path);
    // Optional: Clear the newWindow variable when the window is closed
    newWindow.on("closed", () => {
      newWindow = null;
    });
  }
});

ipcMain.on("update-ip", (event, ip) => {
  updateIpAddress();
  mainWindow.close();
});

ipcMain.on("show-message-box", (event, options) => {
  dialog.showMessageBox(mainWindow, options).then((response) => {
    event.reply("message-box-response", response);
  });
});

app.on("ready", () => {
  if (fs.existsSync(ipFilePath)) {
    // If the IP address file exists, read it (optional here)
    const Ip = fs.readFileSync(ipFilePath, "utf8");
    BASE_URL = `http://${Ip}:8000`; // Use the function to set BASE_URL

    createWindow(); // Open the main app window
  } else {
    createInputWindow(); // Open the input window to set the IP address
  }
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // This logic assumes mainWindow is your main app window
  // Adjust accordingly if your app has different requirements
  if (mainWindow === null) {
    if (fs.existsSync(ipFilePath)) {
      createWindow();
    } else {
      createInputWindow();
    }
  }
});

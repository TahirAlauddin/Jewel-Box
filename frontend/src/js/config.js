const fs = require('fs')
const os = require('os');
const path = require('path');
const { ipcRenderer } = require('electron');

// This will create a path to "ipAddress.txt" inside a ".yourAppName" directory within the user's home directory
const ipFilePath = path.join(os.homedir(), 'JewelBox', 'ipAddress.txt');

// Now ipFilePath is available for use in your renderer process

const Ip = fs.readFileSync(ipFilePath, 'utf8');

// const BASE_URL = `http://localhost:8000`; // Use the function to set BASE_URL
const BASE_URL = `http://${Ip}:8000`; // Use the function to set BASE_URL

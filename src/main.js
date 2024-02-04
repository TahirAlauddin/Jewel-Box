const {dialog, ipcMain, session, app, BrowserWindow, Menu } = require('electron');
let { resolve } = require('path');
resolve = require('path').resolve

require('dotenv').config()
let mainWindow;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: '../jewel-box-logo.ico',
        webPreferences: {
            contextIsolation: false, // This should be true for security reasons
            nodeIntegration: true,
        }      
    });
    
    // Create a custom menu (an example menu without developer tools)
    const menuTemplate = [
        {
        label: 'File',
        submenu: [
            { role: 'quit' }
        ]
        },

        { label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
              { role: 'reload' },
              { role: 'forceReload' },
              { type: 'separator' },
              { role: 'resetZoom' },
              { role: 'zoomIn' },
              { role: 'zoomOut' },
              { type: 'separator' },
              { role: 'togglefullscreen' }
            ]
          },
        // Add other menus as needed
    ];

    // Set the application menu
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile('pages/login/index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

//? FOR DEBUGGIN
// dialog.showMessageBox(mainWindow, {     
//     type: 'info',
//     title: 'Login Successful',
//     message: `Successfully Logged In! Navigate to ${path} `
// }).then((response) => {
//     event.reply('message-box-response', response);
// });

// Listen for the navigate message from the renderer process
ipcMain.on('navigate', (event, page) => {
    let path;
    if (page == 'orders') {
        path = resolve('./resources/app/pages/orders/index.html')
        mainWindow.loadFile(path);
    }
    else if (page == 'invoices') {
        path = resolve('./resources/app/pages/invoices/index.html')
        mainWindow.loadFile(path);
    }
    else if (page == 'customers') {
        path = resolve('./resources/app/pages/customers/index.html')
        mainWindow.loadFile(path);
    }
    else if (page == 'order-detail') {
        path = resolve('./resources/app/pages/order-detail/index.html')
        mainWindow.loadFile(path);
    }
    else if (page == 'login') {
        path = resolve('./resources/app/pages/login/index.html')
        mainWindow.loadFile(path);
    }
});


// Listen for an IPC message to show the dialog
ipcMain.on('show-message-box', (event, options) => {
    dialog.showMessageBox(mainWindow, options).then((response) => {
      event.reply('message-box-response', response);
    });
  });
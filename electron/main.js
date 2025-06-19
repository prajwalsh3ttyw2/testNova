const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow = null;

function createMainWindow() {
  // Check if window already exists
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true
    }
  });

  // Set Content Security Policy
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http:"]
      }
    });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Enable webview inspection
  mainWindow.webContents.on('did-attach-webview', (event, webContents) => {
    console.log('Webview attached');
    
    // Set Content Security Policy for webview
    webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http:"]
        }
      });
    });

    // Enable remote debugging for webview
    webContents.setDevToolsWebContents(new BrowserWindow({
      show: false,
    }).webContents);
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create window when app is ready
app.whenReady().then(createMainWindow);

// Handle activate event (macOS)
app.on('activate', () => {
  createMainWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle webview DevTools
ipcMain.on('toggle-dev-tools', () => {
  if (!mainWindow) return;
  const webview = mainWindow.webContents.mainFrame.frames.find(f => f.url.startsWith('http'));
  if (webview) {
    webview.openDevTools();
  }
});
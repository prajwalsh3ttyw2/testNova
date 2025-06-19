"use strict";
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = require("electron-is-dev");
let mainWindow = null;
function createMainWindow() {
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
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http:"]
      }
    });
  });
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.on("did-attach-webview", (event, webContents) => {
    console.log("Webview attached");
    webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https: http:"]
        }
      });
    });
    webContents.setDevToolsWebContents(new BrowserWindow({
      show: false
    }).webContents);
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.whenReady().then(createMainWindow);
app.on("activate", () => {
  createMainWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
ipcMain.on("toggle-dev-tools", () => {
  if (!mainWindow) return;
  const webview = mainWindow.webContents.mainFrame.frames.find((f) => f.url.startsWith("http"));
  if (webview) {
    webview.openDevTools();
  }
});

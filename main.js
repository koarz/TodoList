const { app, BrowserWindow } = require('electron')
const path = require('path');
let win;
const createWindow = () => {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})

const { ipcMain } = require('electron');

ipcMain.on('close-window', () => {
  if (win) {
    win.close();
  }
})

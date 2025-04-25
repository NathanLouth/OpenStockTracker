const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')

let mainWindow
let currentFile = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 920,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      devTools: false,
    }
  })

  mainWindow.loadFile('index.html')
  mainWindow.maximize()
}

const customDataStoreFilePath = path.join(app.getPath('userData'), "CustomDataStore");
function initDataStore() {
  if (!fs.existsSync(customDataStoreFilePath)) {
    fs.mkdirSync(customDataStoreFilePath, { recursive: true });
  }

  const orderNumberFilePath = path.join(customDataStoreFilePath, "previousOrderNumber.json");
  if (!fs.existsSync(orderNumberFilePath)) {
    fs.writeFileSync(orderNumberFilePath, JSON.stringify(0), 'utf8');
  }

  const activityLogFilePath = path.join(customDataStoreFilePath, "activityLog.json");
  if (!fs.existsSync(activityLogFilePath)) {
    fs.writeFileSync(activityLogFilePath, JSON.stringify([]), 'utf8');
  }

  const stockDataFilePath = path.join(customDataStoreFilePath, "stockData.json");
  if (!fs.existsSync(stockDataFilePath)) {
    fs.writeFileSync(stockDataFilePath, JSON.stringify({ }), 'utf8');
  }

  const configFilePath = path.join(customDataStoreFilePath, "config.json");
  if (!fs.existsSync(configFilePath)) {
    let defaultConfig = {
      "title": "Open Stock Tracker",
      "orderPrefix": "",
      "orderMessage": ""
    }
    fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2), 'utf8');
  }
}
initDataStore()

ipcMain.handle('writeDataStore', async (event, file, data) => {
  const filePath = path.join(customDataStoreFilePath, file);
  const stringJSON = JSON.stringify(data, null, 2)
  fs.writeFileSync(filePath, stringJSON); 
});

ipcMain.handle('readDataStore', async (event, file) => {
  const filePath = path.join(customDataStoreFilePath, file); 
  const content = fs.readFileSync(filePath, 'utf8');
  return content
});

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
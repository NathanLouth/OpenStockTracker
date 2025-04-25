const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dataStore', {
    writeDataStore: (file, data) => ipcRenderer.invoke('writeDataStore', file, data), 
    readDataStore: (file) => ipcRenderer.invoke('readDataStore',file)
});
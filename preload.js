const {contextBridge, ipcRenderer} = require('electron');

const WINDOW_API = {
    // CheckIfFileExists: (filepath) => ipcRenderer.invoke("get/file_exists", filepath),
    // ReadFileContents: (filepath) => ipcRenderer.invoke("get/file_contents", filepath),
    // DownloadLatestVersion: () => ipcRenderer.invoke('get/latest_version')
    CheckForUpdates: (gameName) => ipcRenderer.invoke('get/latest_update', gameName),
    LaunchGame: (gameName) => ipcRenderer.invoke('get/game', gameName)
};

// window.api
contextBridge.exposeInMainWorld("api", WINDOW_API);
const {contextBridge, ipcRenderer} = require('electron');

const WINDOW_API = {
    CheckForUpdates: (gameName) => ipcRenderer.invoke('get/latest_update', gameName),
    LaunchGame: (gameName) => ipcRenderer.invoke('get/game', gameName),
    OnGetDownloadState: (message) => ipcRenderer.on('send/download_state', message),
};

// window.api
contextBridge.exposeInMainWorld("api", WINDOW_API);

window.myElectronApp = {
    mainWindowWebContents: require('electron').remote.getCurrentWindow().webContents
}
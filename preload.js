const {contextBridge, ipcRenderer} = require('electron');

const WINDOW_API = {
    CheckForUpdates: (gameInfo) => ipcRenderer.invoke('get/latest_update', gameInfo),
    LaunchGame: (gameInfo) => ipcRenderer.invoke('get/game', gameInfo),
    OnGetDownloadState: (message) => ipcRenderer.on('send/download_state', message),
    OpenMessageDialog: (options) => ipcRenderer.invoke('show/message_dialog', options) 
};

// window.api
contextBridge.exposeInMainWorld("api", WINDOW_API);
const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');

const GameDownloader = require('./classes/gameDownloaderSFTP');
const FileSys = require('./classes/niceFileSystem')

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 960,
        height: 540,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
        },
        autoHideMenuBar: true,
        icon: "./assets/CyberDash_Icon.png"
    });

    mainWindow.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow();
});

let gameDownloader = null;

ipcMain.handle("get/latest_update", async (event, gameInfo) => {
    gameDownloader = new GameDownloader(gameInfo, mainWindow.webContents);
    return await gameDownloader.GetLatestGameVersion(ipcMain);
});

ipcMain.handle('get/game', (event, gameInfo) => {
    const gamePath = `bin/${gameInfo['dir']}/Build/${gameInfo['filename']}`;

    if (!FileSys.CheckIfFileExists(gamePath)) return false;

    shell.openExternal(path.join(__dirname, gamePath));

    app.exit();
});

ipcMain.handle('show/message_dialog', async (event, options) => {
    return await dialog.showMessageBox(mainWindow, options);
});
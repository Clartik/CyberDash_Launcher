const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

const GameDownloader = require('./classes/gameDownloader');
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
        autoHideMenuBar: true
    });

    mainWindow.loadFile("./pages/original.html");
};

app.whenReady().then(() => {
    createWindow();
});

ipcMain.handle("get/latest_update", async (event, gameName) => {
    const gameDownloader = new GameDownloader(gameName, mainWindow.webContents);
    return await gameDownloader.GetLatestGameVersion(ipcMain);
});

ipcMain.handle('get/game', (event, gameName) => {
    const gamePath = `bin/${gameName}/Build/Flashy Time CyberDash.exe`;

    if (!FileSys.CheckIfFileExists(gamePath)) return false;

    shell.openExternal(path.join(__dirname, gamePath));

    app.exit();
});
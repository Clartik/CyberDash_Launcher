const { app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const child = require('child_process').execFile;

const GameDownloader = require('./classes/gameDownloader');

const createWindow = () => {
    const window = new BrowserWindow({
        width: 960,
        height: 540,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
        },
        autoHideMenuBar: true
    });

    window.loadFile("index.html");
};

app.whenReady().then(() => {
    createWindow();
});

ipcMain.handle("get/latest_update", async (event, gameName) => {
    const gameDownloader = new GameDownloader(gameName);
    await gameDownloader.GetLatestGameVersion();
});

ipcMain.handle('get/game', (event, gameName) => {
    const gamePath = `bin/${gameName}/Build/Flashy Time CyberDash.exe`;
    const exe = child(gamePath);

    exe.on('close', (code) => {
        app.exit();
    });
});
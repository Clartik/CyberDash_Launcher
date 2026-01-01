const { app, BrowserWindow, ipcMain, shell, dialog, Menu, Tray, Notification } = require('electron');
const path = require('path');

const GameDownloader = require('./classes/gameDownloaderS3');
const FileSys = require('./classes/niceFileSystem');

const setupUpdater = require('./updater');

let mainWindow;

// app.setLoginItemSettings({
//     openAtLogin: true
// })

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 960,
        height: 540,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: true,
        },
        autoHideMenuBar: true,
        icon: "./assets/CyberDash.ico"
    });

    FileSys.CreateDirIfNeed('bin');
    FileSys.CreateDirIfNeed('bin/CyberDash1');
    FileSys.CreateDirIfNeed('bin/CyberDash2D');
    FileSys.CreateDirIfNeed('bin/CyberDashNC');
    
    app.setAppUserModelId("CyberDash Launcher");
    mainWindow.loadFile("index.html");
};

let tray = null;
app.whenReady().then(async () => {
    createWindow();

    setupUpdater();

    // tray = new Tray('assets/CyberDash.ico')
    // const contentMenu = Menu.buildFromTemplate([
    //     { label: 'Bombard You With Ads', type: "checkbox", checked: true },
    //     { label: 'Start On Boot', type: "checkbox", checked: true },
    //     { label: 'Close', click: () => {
    //         app.exit();
    //     } }
    // ]);
    // tray.setContextMenu(contentMenu);

    // tray.on('click', () => {
    //     mainWindow.show();
    // })

    // mainWindow.on('close', function(event) {
    //     event.preventDefault();
    //     mainWindow.hide();
    // });

    // let mins = getRndInteger(1, 2);
    // await sleep(mins * 500, function() {
    //     showNotification(mins);
    // });
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

function showNotification(mins) {
    let notification = new Notification({
        title: "PLAY CYBERDASH",
        body: `It has been ${mins} mins since you last played Cyberdash`,
        icon: "assets/CyberDash.ico"
    });

    notification.on('click', () => {
        mainWindow.show();
    });

    notification.show();
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
const { autoUpdater } = require('electron-updater');

function setupUpdater() {
    const log = require('electron-log');
    log.transports.file.level = "debug";
    autoUpdater.logger = log;

    autoUpdater.checkForUpdatesAndNotify();
}

module.exports = setupUpdater;

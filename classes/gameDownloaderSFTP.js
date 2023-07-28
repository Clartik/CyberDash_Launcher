const AdmZip = require('adm-zip');
const SFTP = require("ssh2-sftp-client");
const ip = require('ip');

const FileSys = require('./niceFileSystem');

class Version {
    constructor(version) {
        const versionArray = version.split(".");
        
        this.main = Number(versionArray[0]);
        this.major = Number(versionArray[1]);
        this.minor = Number(versionArray[2]);
    }

    ToString() {
        return `${this.main}.${this.major}.${this.minor}`;
    }

    IsLatestVersion(version) {
        if (this.main < version.main) {
            return false;
        }
        
        if (this.major < version.major) {
            return false;
        }
        
        if (this.minor < version.minor) {
            return false;
        }

        return true;
    }
}

const sftp_local_config = {
    host: '192.168.1.156',
    port: '22',
    user: 'clartik',
    password: '4509',
    readyTimeout: 10000,
    retries: 0,
};

const sftp_remote_config = {
    host: '75.83.86.250',
    port: '22',
    user: 'clartik',
    password: '4509',
    readyTimeout: 10000,
    retries: 0,
};

let localNetworkStart = '192.168.1.1';
let localNetworkEnd = '192.168.1.254';

class GameDownloader {
    constructor(gameInfo, webContents) {
        this.gameDir = gameInfo['dir'];
        this.gameFile = gameInfo['filename'];
        this.localVersionPath = `bin/${this.gameDir}/Version.txt`;
        this.localVersionRemotePath = `bin/${this.gameDir}/Version_Remote.txt`;
        this.localZipPath = `bin/${this.gameDir}/Build.zip`;
        this.remoteZipPath = `FTP/files/${this.gameDir}/Build.zip`;
        this.remoteVersionPath = `FTP/files/${this.gameDir}/Version.txt`;
        this.gamePath = `bin/${this.gameDir}/Build/${this.gameFile}`;
        this.webContents = webContents;
        this.client = new SFTP();

        let serverIp = ip.address();
        const isLocalNetwork = ip.cidrSubnet(`${localNetworkStart}/24`).contains(serverIp);

        this.config = isLocalNetwork ? sftp_local_config : sftp_remote_config;
    }

    async GetLatestGameVersion() {
        this.webContents.send('send/download_state', 'Checking For Updates');

        if (FileSys.CheckIfFileExists(this.localVersionPath)) {
            let localVersion = new Version(FileSys.ReadFileContents(this.localVersionPath));
    
            try {
                let onlineVersion = await this.DownloadLatestVersion();

                if (onlineVersion == null) {
                    throw "Could Not Connect";
                }
    
                if (!localVersion.IsLatestVersion(onlineVersion)) {
                    this.installGames = await this.InstallGameFiles();
                }
                else {
                    if (!FileSys.CheckIfFileExists(this.gamePath)) {
                        FileSys.RemoveFilesInDir(`bin/${this.gameDir}`)
                        return;
                    }

                    this.webContents.send('send/download_state', 'Launch Game');
                }
            } catch (error) {
                console.log(error);
                this.webContents.send('send/download_state', 'Offline - Launch Game');
                return true;
            }
        }
        else {
            this.installGames = await this.InstallGameFiles();
        }
    }
    
    async DownloadLatestVersion() {
        try {
            await this.client.connect(this.config);
    
            await this.client.get(this.remoteVersionPath, this.localVersionRemotePath);
            var version = new Version(FileSys.ReadFileContents(this.localVersionRemotePath));
    
            FileSys.DeleteFile(this.localVersionRemotePath);
        }
        catch(err) {
            console.log(err);
            this.client.end();
            return null;
        }
        this.client.end();
    
        return version;
    }
    
    async InstallGameFiles() {
        // DOWNLOAD
        
        try {    
            await this.client.connect(this.config);

            this.webContents.send('send/download_state', 'Downloading Game');

            let zipSize = await this.client.stat(this.remoteZipPath);
            let versionSize = await this.client.stat(this.remoteVersionPath);

            zipSize = zipSize.size;
            versionSize = versionSize.size;
    
            const webContents = this.webContents;
            await this.client.fastGet(this.remoteZipPath, this.localZipPath, {step: function(total_transferred, chunk, total) {
                try {
                    webContents.send('send/download_state', `Downloading ${FileSys.FormatBytes(total_transferred)}/${FileSys.FormatBytes(zipSize + versionSize)}`);
                }
                catch {
                    return;
                }
            }});
            await this.client.fastGet(this.remoteVersionPath, this.localVersionPath);
        }
        catch (err) {
            console.log(err);
            this.client.end();
            this.webContents.send('send/download_state', 'Download Failed');
            return false;
        }
    
        this.client.end();
    
        // INSTALL
        this.webContents.send('send/download_state', 'Installing Game');
    
        const zip = new AdmZip(this.localZipPath);
        await zip.extractAllToAsync(`bin/${this.gameDir}/`, true, false, (error) => {
            if (error) {
                console.log(error);
                this.webContents.send('send/download_state', 'Failed To Install');
                return false;
            }
        });
    
        FileSys.DeleteFile(this.localZipPath);

        this.webContents.send('send/download_state', 'Launch Game');
        return true;
    }
}

module.exports = GameDownloader
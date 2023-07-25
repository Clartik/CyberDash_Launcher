const AdmZip = require('adm-zip');
const ftp = require("basic-ftp");

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

const ftp_config = {
    host: '192.168.1.156',
    port: '21',
    user: 'clartik',
    password: '4509',
    secure: false
};

class GameDownloader {
    constructor(gameInfo, webContents) {
        this.gameDir = gameInfo['dir'];
        this.gameFile = gameInfo['filename'];
        this.localVersionPath = `bin/${this.gameDir}/Version.txt`;
        this.localVersionRemotePath = `bin/${this.gameDir}/Version_Remote.txt`;
        this.localZipPath = `bin/${this.gameDir}/Build.zip`;
        this.remoteZipPath = `files/${this.gameDir}/Build.zip`;
        this.remoteVersionPath = `files/${this.gameDir}/Version.txt`;
        this.gamePath = `bin/${this.gameDir}/Build/${this.gameFile}`;
        this.webContents = webContents;
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
        const client = new ftp.Client(3000);
        try {
            await client.access(ftp_config);
    
            await client.downloadTo(this.localVersionRemotePath, `files/${this.gameDir}/Version.txt`);
            var version = new Version(FileSys.ReadFileContents(this.localVersionRemotePath));
    
            FileSys.DeleteFile(this.localVersionRemotePath);
        }
        catch(err) {
            console.log(err);
            client.close();
            return null;
        }
        client.close();
    
        return version;
    }
    
    async InstallGameFiles() {
        // DOWNLOAD
        const client = new ftp.Client(3000);
        
        try {    
            await client.access(ftp_config);

            this.webContents.send('send/download_state', 'Downloading Game');

            const zipSize = await client.size(this.remoteZipPath);
            const versionSize = await client.size(this.remoteVersionPath);

            client.trackProgress(info => {
                this.webContents.send('send/download_state', `Downloading ${FileSys.FormatBytes(info.bytesOverall)}/${FileSys.FormatBytes(zipSize + versionSize)}`);
            })
    
            await client.downloadTo(this.localZipPath, this.remoteZipPath);
            await client.downloadTo(this.localVersionPath,this.remoteVersionPath);
        }
        catch (err) {
            console.log(err);
            client.close();
            this.webContents.send('send/download_state', 'Offline - Failed To Check');
            return false;
        }
    
        client.close();
    
        // INSTALL
        this.webContents.send('send/download_state', 'Installing Game');
    
        const zip = new AdmZip(this.localZipPath);
        await zip.extractAllToAsync(`bin/${this.gameDir}/`, true, false, (error) => {
            if (error) {
                console.log(error);
            }

            console.log("Finished Unzipping");
        });
    
        FileSys.DeleteFile(this.localZipPath);

        this.webContents.send('send/download_state', 'Launch Game');
        return true;
    }
}

module.exports = GameDownloader
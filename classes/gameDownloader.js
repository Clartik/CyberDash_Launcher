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
    constructor(gameName) {
        this.gameName = gameName;
        this.localVersionPath = `bin/${this.gameName}/Version.txt`;
        this.remoteVersionPath = `bin/${this.gameName}/Version_Remote.txt`;
        this.zipPath = `bin/${this.gameName}/Build.zip`
    }

    async GetLatestGameVersion() {
        if (FileSys.CheckIfFileExists(this.localVersionPath)) {
            let localVersion = new Version(FileSys.ReadFileContents(this.localVersionPath));
    
            try {
                let onlineVersion = await this.DownloadLatestVersion();
    
                if (!localVersion.IsLatestVersion(onlineVersion)) {
                    await this.InstallGameFiles();
                }
                else {
    
                }
            } catch (error) {
                console.log(error);
                return;
            }
        }
        else {
            await this.InstallGameFiles();
        }
    }
    
    async DownloadLatestVersion() {
        const client = new ftp.Client();
        client.ftp.verbose = true;
        try {
            await client.access(ftp_config);
    
            await client.downloadTo(this.remoteVersionPath, `files/${this.gameName}/Version.txt`);
            var version = new Version(FileSys.ReadFileContents(this.remoteVersionPath));
    
            FileSys.DeleteFile(this.remoteVersionPath);
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
        const client = new ftp.Client();
        
        try {
            console.log('Downloading Game Files...');
    
            await client.access(ftp_config);
    
            client.trackProgress(info => {
                console.log("Bytes Transferred Overall", FileSys.FormatBytes(info.bytesOverall));
            })
    
            await client.downloadTo(this.zipPath, `files/${this.gameName}/Build.zip`);
            await client.downloadTo(this.localVersionPath, `files/${this.gameName}/Version.txt`);
    
            console.log('Game Files Downloaded!');
        }
        catch (err) {
            console.log(err);
        }
    
        client.close();
    
        // INSTALL
        console.log('Installing Game Files...');
    
        const zip = new AdmZip(this.zipPath);
        await zip.extractAllToAsync(`bin/${this.gameName}/`, true);
    
        FileSys.DeleteFile(this.zipPath);
    }
}

module.exports = GameDownloader
const https = require('https');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const FileSys = require('./niceFileSystem');

// Configuration
const BUCKET_NAME = "cyberdash-downloads"; 
const REGION = "us-west-1"; 
const BASE_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com`;

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

class GameDownloader {
    constructor(gameInfo, webContents) {
        this.gameDir = gameInfo['dir'];
        this.gameFile = gameInfo['filename'];
        this.localVersionPath = `bin/${this.gameDir}/Version.txt`;
        this.localVersionRemotePath = `bin/${this.gameDir}/Version_Remote.txt`;
        this.localZipPath = `bin/${this.gameDir}/Build.zip`;
        this.s3Path = gameInfo['s3-path'];
        
        // S3 Keys
        // Version file is always at fixed path to check for updates
        this.remoteVersionKey = `${this.s3Path}/Version.txt`;
        
        this.gamePath = `bin/${this.gameDir}/Build/${this.gameFile}`;
        this.webContents = webContents;
    }

    async GetLatestGameVersion() {
        this.webContents.send('send/download_state', 'Checking For Updates');

        // Always try to get online version first to know the download path
        let onlineVersion = await this.DownloadLatestVersion();

        if (FileSys.CheckIfFileExists(this.localVersionPath)) {
            let localVersion = new Version(FileSys.ReadFileContents(this.localVersionPath));
    
            try {
                if (onlineVersion == null) {
                    throw "Could Not Connect";
                }
    
                if (!localVersion.IsLatestVersion(onlineVersion)) {
                    this.installGames = await this.InstallGameFiles(onlineVersion);
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
            if (onlineVersion) {
                this.installGames = await this.InstallGameFiles(onlineVersion);
            } else {
                console.log("Could Not Connect");
                this.webContents.send('send/download_state', 'Offline - Failed To Check');
            }
        }
    }
    
    async DownloadLatestVersion() {
        try {
            await this.downloadFile(this.remoteVersionKey, this.localVersionRemotePath);
            var version = new Version(FileSys.ReadFileContents(this.localVersionRemotePath));
    
            FileSys.DeleteFile(this.localVersionRemotePath);
        }
        catch(err) {
            console.log(err);
            return null;
        }
    
        return version;
    }
    
    async InstallGameFiles(onlineVersion) {
        try {    
            this.webContents.send('send/download_state', 'Downloading Game');

            const versionString = onlineVersion.ToString();
            // Construct dynamic zip path based on version
            // e.g., files/CyberDash1/1.0.1/Build.zip
            const remoteZipKey = `${this.s3Path}/${versionString}/Build.zip`;

            // Get sizes
            const zipSize = await this.getFileSize(remoteZipKey);
            const versionSize = await this.getFileSize(this.remoteVersionKey);
            const totalSize = zipSize + versionSize;

            let downloadedBytes = 0;

            // Helper to track progress
            const onProgress = (bytes) => {
                downloadedBytes += bytes;
                this.webContents.send('send/download_state', `Downloading ${FileSys.FormatBytes(downloadedBytes)}/${FileSys.FormatBytes(totalSize)}`);
            };

            // Download Zip
            await this.downloadFile(remoteZipKey, this.localZipPath, onProgress);
            
            // Download Version (after zip, so total progress is consistent)
            await this.downloadFile(this.remoteVersionKey, this.localVersionPath, onProgress);

        }
        catch (err) {
            console.log(err);
            this.webContents.send('send/download_state', 'Download Failed');
            return false;
        }
    
        // INSTALL
        this.webContents.send('send/download_state', 'Installing Game');
    
        try {
            const zip = new AdmZip(this.localZipPath);
            await zip.extractAllToAsync(`bin/${this.gameDir}/`, true, false, (error) => {
                if (error) {
                    console.log(error);
                    this.webContents.send('send/download_state', 'Failed To Install');
                    return false;
                }
            });
        } catch (e) {
            console.log(e);
            this.webContents.send('send/download_state', 'Failed To Install');
            return false;
        }
    
        FileSys.DeleteFile(this.localZipPath);

        this.webContents.send('send/download_state', 'Launch Game');
        return true;
    }

    async getFileSize(key) {
        const url = `${BASE_URL}/${key}`;
        return new Promise((resolve, reject) => {
            const req = https.request(url, { method: 'HEAD' }, (res) => {
                if (res.statusCode === 200) {
                    resolve(parseInt(res.headers['content-length'] || 0, 10));
                } else {
                    reject(new Error(`Failed to get file info for ${url}: ${res.statusCode}`));
                }
            });
            req.on('error', reject);
            req.end();
        });
    }

    async downloadFile(key, localPath, onProgress) {
        const url = `${BASE_URL}/${key}`;
        return new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(localPath);
            
            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                    return;
                }

                response.on('data', (chunk) => {
                    if (onProgress) onProgress(chunk.length);
                });

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });

                fileStream.on('error', (err) => {
                    fs.unlink(localPath, () => {});
                    reject(err);
                });
            }).on('error', (err) => {
                fs.unlink(localPath, () => {});
                reject(err);
            });
        });
    }
}

module.exports = GameDownloader;

const fs = require('fs');
const path = require('path');

const byte_units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

class FileSystem {
    static ReadFileContents(filepath) {
        return fs.readFileSync(filepath, { encoding: 'utf-8'});
    }
    
    static CheckIfFileExists(filepath) {
        return fs.existsSync(filepath);
    }

    static CreateDirIfNeed(dirPath) {
        if (!this.CheckIfFileExists(dirPath)) {
            fs.mkdirSync(dirPath);
        }
    }
    
    static DeleteFile(filepath) {
        fs.unlinkSync(filepath);
    }

    static FormatBytes(bytes){
        let l = 0, n = parseInt(bytes, 10) || 0;
      
        while(n >= 1024 && ++l){
            n = n/1024;
        }
        
        return(n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + byte_units[l]);
    }

    static RemoveFilesInDir(dir) {
        fs.readdir(dir, (err, files) => {
            if (err) throw err;

            for (let file of files) {
                this.DeleteFile(path.join(dir, file), (err) => {
                    if (err) throw err;
                })
            }
        })
    }
}

module.exports = FileSystem;
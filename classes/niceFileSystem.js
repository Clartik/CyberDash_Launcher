const fs = require('fs');

const byte_units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

class FileSystem {
    static ReadFileContents(filepath) {
        return fs.readFileSync(filepath, { encoding: 'utf-8'});
    }
    
    static CheckIfFileExists(filepath) {
        return fs.existsSync(filepath);
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
}

module.exports = FileSystem;
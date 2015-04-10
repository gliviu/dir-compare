var fs = require('fs');
var bufferEqual = require('buffer-equal');

/**
 * Compares two files by content using bufSize as buffer lenth.
 */
var compareSync = function (path1, path2, bufSize, progressCallback) {
    bufSize = bufSize ? bufSize : 4096;
    var fd1, fd2;
    try {
        fd1 = fs.openSync(path1, 'r');
        fd2 = fs.openSync(path2, 'r');
        var size = fs.statSync(path1).size;
        if (size !== fs.statSync(path2).size) {
            return false;
        }
        var len = 0;
        var buf1 = new Buffer(bufSize);
        var buf2 = new Buffer(bufSize);
        var progress = 0;
        while (len < size) {
            var remaining = size - len;
            if (remaining < bufSize) {
                bufSize = remaining;
                var buf1 = new Buffer(bufSize);
                var buf2 = new Buffer(bufSize);
            }
            var read1 = fs.readSync(fd1, buf1, 0, bufSize, null);
            var read2 = fs.readSync(fd2, buf2, 0, bufSize, null);
            if (read1 !== read2) {
                return false;
            }
            if (!bufferEqual(buf1, buf2)) {
                return false;
            }
            len += read1;
            if (progressCallback) {
                var procent = Math.round(len / size * 100);
                if (progress !== procent) {
                    progressCallback(procent);
                    progress = procent;
                }
            }
        }
        return true;
    } finally {
        if(fd1){
            fs.closeSync(fd1);
        }
        if(fd2){
            fs.closeSync(fd2);
        }
    }
};

module.exports = {
    compareSync : compareSync
};
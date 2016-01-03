var fs = require('fs');
var bufferEqual = require('buffer-equal');
var Promise = require('bluebird');

/**
 * Compares two partial buffers.
 */
var compareBuffers = function(buf1, buf2, contentSize, allocatedSize){
    if(contentSize===allocatedSize){
        return bufferEqual(buf1, buf2);
    } else{
        return bufferEqual(buf1.slice(0, contentSize), buf2.slice(0, contentSize));
    }
}

/**
 * Compares two files by content using bufSize as buffer length.
 */
var compareSync = function (path1, path2, bufSize) {
    bufSize = bufSize ? bufSize : 4096;
    var fd1, fd2;
    try {
        fd1 = fs.openSync(path1, 'r');
        fd2 = fs.openSync(path2, 'r');
        var buf1 = new Buffer(bufSize);
        var buf2 = new Buffer(bufSize);
        var progress = 0;
        while (true) {
            var size1 = fs.readSync(fd1, buf1, 0, bufSize, null);
            var size2 = fs.readSync(fd2, buf2, 0, bufSize, null);
            if (size1 !== size2) {
                return false;
            } else if (size1 === 0) {
                // End of file reached
                return true;
            } else if (!compareBuffers(buf1, buf2, size1, bufSize)) {
                return false;
            }
        }
    } finally {
        closeFiles(fd1, fd2);
    }
};

var wrapper = {
        open : Promise.promisify(fs.open),
        read : Promise.promisify(fs.read),
};

/**
 * Compares two files by content using bufSize as buffer length.
 */
var compareAsync = function (path1, path2, bufSize) {
    bufSize = bufSize ? bufSize : 4096;
    return Promise.all([wrapper.open(path1, 'r'), wrapper.open(path2, 'r')]).then(function (fds) {
        var fd1 = fds[0], fd2 = fds[1];
        var buf1 = new Buffer(bufSize);
        var buf2 = new Buffer(bufSize);
        var progress = 0;
        var compareAsyncInternal = function () {
            return Promise.all([
                    wrapper.read(fd1, buf1, 0, bufSize, null), wrapper.read(fd2, buf2, 0, bufSize, null)
            ]).then(function (bufferSizes) {
                var size1 = bufferSizes[0];
                var size2 = bufferSizes[1];
                if (size1 !== size2) {
                    return false;
                } else if (size1 === 0) {
                    // End of file reached
                    return true;
                } else if (!compareBuffers(buf1, buf2, size1, bufSize)) {
                    return false;
                } else {
                    return compareAsyncInternal();
                }
            });
        };
        return compareAsyncInternal().then(function (result) {
            closeFiles(fd1, fd2);
            return result;
        }, function (error) {
            closeFiles(fd1, fd2);
            return Promise.reject(error);
        });
    });
};

var closeFiles = function(fd1, fd2){
    if (fd1) {
        fs.closeSync(fd1);
    }
    if (fd2) {
        fs.closeSync(fd2);
    }
}
module.exports = {
    compareSync : compareSync,
    compareAsync : compareAsync
};
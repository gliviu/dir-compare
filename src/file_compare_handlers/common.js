var fs = require('fs')

var alloc = function (bufSize) {
    if (Buffer.alloc) {
        return Buffer.alloc(bufSize)
    }
    return new Buffer(bufSize)
}

var wrapper = function (fdQueue) {
    return {
        open: function(path, flags) {
            return new Promise(function (resolve, reject) {
                fdQueue.open(path, flags, function(err, fd) {
                    if(err){
                        reject(err)
                    } else {
                        resolve(fd)
                    }
                })
            })
        },
        read: function (fd, buffer, offset, length, position) {
            return new Promise(function (resolve, reject) {
                fs.read(fd, buffer, offset, length, position, function(err, bytesRead) {
                    if(err){
                        reject(err)
                    } else {
                        resolve(bytesRead)
                    }
                })
            })
        },
    }
}

var closeFilesSync = function (fd1, fd2) {
    if (fd1) {
        fs.closeSync(fd1)
    }
    if (fd2) {
        fs.closeSync(fd2)
    }
}

var closeFilesAsync = function (fd1, fd2, fdQueue) {
    return new Promise(function (resolve, reject){
        if (fd1) {
            fdQueue.close(fd1, function (err) {
                if (err) { reject(err) }
                else {resolve()}
            })
        }
        if (fd2) {
            fdQueue.close(fd2, function (err) {
                if (err) { reject(err) }
                else {resolve()}
            })
        }
        })
}


module.exports = {
    alloc: alloc,
    wrapper: wrapper,
    closeFilesSync: closeFilesSync,
    closeFilesAsync: closeFilesAsync
}

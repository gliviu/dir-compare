var fs = require('fs');
var Promise = require('bluebird');

var alloc = function(bufSize) {
    if(Buffer.alloc){
        return Buffer.alloc(bufSize);
    }
    return new Buffer(bufSize);
}

var wrapper = function(fdQueue) {
    return {
        open : Promise.promisify(fdQueue.open),
        read : Promise.promisify(fs.read),
    }
};

var closeFilesSync = function(fd1, fd2){
    if (fd1) {
        fs.closeSync(fd1);
    }
    if (fd2) {
        fs.closeSync(fd2);
    }
}

var closeFilesAsync = function(fd1, fd2, fdQueue){
    if (fd1) {
        fdQueue.close(fd1, function(err){
          if(err){console.log(err);}
        });
    }
    if (fd2) {
    	fdQueue.close(fd2, function(err){
        if(err){console.log(err);}
      });
    }
}


module.exports = {
    alloc : alloc,
    wrapper: wrapper,
    closeFilesSync: closeFilesSync,
    closeFilesAsync: closeFilesAsync
};

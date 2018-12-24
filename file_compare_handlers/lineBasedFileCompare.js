// Compare files line by line with options to ignore line endings and white space differencies.
'use strict'
var fs = require('fs');
var bufferEqual = require('buffer-equal');
var Promise = require('bluebird');
var FileDescriptorQueue = require('./fileDescriptorQueue');
var fdQueue = new FileDescriptorQueue(8);
var alloc = require('./common').alloc;
var wrapper = require('./common').wrapper(fdQueue);
var closeFilesSync = require('./common').closeFilesSync;
var closeFilesAsync = require('./common').closeFilesAsync;

var BUF_SIZE = 4096
var compareSync = function (path1, stat1, path2, stat2, options) {
    var fd1, fd2;
    try {
        fd1 = fs.openSync(path1, 'r');
        fd2 = fs.openSync(path2, 'r');
        var buf1 = alloc(BUF_SIZE);
        var buf2 = alloc(BUF_SIZE);
        var progress = 0;
        var last1='', last2=''
        while (true) {
            var size1 = fs.readSync(fd1, buf1, 0, BUF_SIZE, null)
            var size2 = fs.readSync(fd2, buf2, 0, BUF_SIZE, null)
            var chunk1 = buf1.toString('utf8', 0, size1)
            var chunk2 = buf2.toString('utf8', 0, size2)
            var lines1 = (last1+chunk1).split(/\n/)
            var lines2 = (last2+chunk2).split(/\n/)
            if(size1===0 && size2===0){
                // End of file reached
                return true
            }
            else if(lines1.length !== lines2.length) {
                return false;
            } else {
                if(!compareLines(lines1, lines2, options)){
                    return false
                }
                last1 = lines1[lines1.length-1]
                last2 = lines2[lines2.length-1]
            }
        }
    } finally {
        closeFilesSync(fd1, fd2);
    }
};

var compareAsync = function(path1, stat1, path2, stat2, options) {
    var fd1, fd2;
    return Promise.all([wrapper.open(path1, 'r'), wrapper.open(path2, 'r')])
    .then(function(fds){
        fd1 = fds[0]
        fd2 = fds[1]
        var buf1 = alloc(BUF_SIZE);
        var buf2 = alloc(BUF_SIZE);
        var progress = 0;
        var last1='', last2=''
        var compareAsyncInternal = function () {
            return Promise.all([
                wrapper.read(fd1, buf1, 0, BUF_SIZE, null),
                wrapper.read(fd2, buf2, 0, BUF_SIZE, null)
            ]).then(function(sizes){
                var size1 = sizes[0]
                var size2 = sizes[1]
                var chunk1 = buf1.toString('utf8', 0, size1)
                var chunk2 = buf2.toString('utf8', 0, size2)
                var lines1 = (last1+chunk1).split(/\n/)
                var lines2 = (last2+chunk2).split(/\n/)
                if(size1===0 && size2===0){
                    // End of file reached
                    return true
                }
                else if(lines1.length !== lines2.length) {
                    return false;
                } else {
                    if(!compareLines(lines1, lines2, options)){
                        return false
                    }
                    last1 = lines1[lines1.length-1]
                    last2 = lines2[lines2.length-1]
                    return compareAsyncInternal()
                }
            })
        }
        return compareAsyncInternal().then(function (result) {
            closeFilesAsync(fd1, fd2, fdQueue);
            return result;
        });
    })
    .catch(function (error) {
        closeFilesAsync(fd1, fd2, fdQueue);
        return error;
    });
}

var removeLineEnding = function (s) {
    return s.replace(/[\r]+$/g, '');
};

// remove white spaces except line endings
var removeWhiteSpaces = function (s) {
    return s.replace(/^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g, '');
};


function compareLines(lines1, lines2, options){
    var i
    for(i = 0; i < lines1.length - 1; i++) {
        var line1 = lines1[i]
        var line2 = lines2[i]
        if(options.ignoreLineEnding){
            line1 = removeLineEnding(line1)
            line2 = removeLineEnding(line2)
        }
        if(options.ignoreWhiteSpaces){
            line1 = removeWhiteSpaces(line1)
            line2 = removeWhiteSpaces(line2)
        }
        if(line1!==line2) {
            return false
        }
    }
    return true
}

module.exports = {
    compareSync: compareSync,
    compareAsync: compareAsync
}

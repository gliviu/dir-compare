// Compare files line by line with options to ignore line endings and white space differencies.
'use strict'
var fs = require('fs')

var BUF_SIZE = 4096
var compareSync = function (path1, stat1, path2, stat2, options) {
    var BUF_SIZE = 4096;
    var fd1, fd2;
    try {
        fd1 = fs.openSync(path1, 'r');
        fd2 = fs.openSync(path2, 'r');
        var buf1 = new Buffer(BUF_SIZE);
        var buf2 = new Buffer(BUF_SIZE);
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
                last1 = lines1[i]
                last2 = lines2[i]
            }
        }
    } finally {
        closeFilesSync(fd1, fd2);
    }
};

var compareAsync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    throw 'not implemented'
};

var removeLineEnding = function (s) {
    return s.replace(/[\r]+$/g, '');
};

// remove white spaces except line endings
var removeWhiteSpaces = function (s) {
    return s.replace(/^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g, '');
};

var closeFilesSync = function(fd1, fd2){
    if (fd1) {
        fs.closeSync(fd1);
    }
    if (fd2) {
        fs.closeSync(fd2);
    }
}

module.exports = {
    compareSync: compareSync,
    compareAsync: compareAsync
}

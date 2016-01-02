'use strict'
var fc = require('./filecompare')

var compareSync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    return fc.compareSync(filePath1, filePath2);
};

var compareAsync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    return fc.compareAsync(filePath1, filePath2);
};

module.exports = {
        compareSync: compareSync,
        compareAsync: compareAsync
}


'use strict'
var fc = require('./filecompare')

// TODO: remove compareSize logic. Move it into compareSync.js/compareAsync.js
var compareSync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    var same = true;
    var compareSize = options.compareSize === undefined ? false : options.compareSize;
    var compareContent = options.compareContent === undefined ? false : options.compareContent;
    if (compareSize && fileStat1.size != fileStat2.size) {
        same = false;
    } else if(compareContent && !fc.compareSync(filePath1, filePath2)){
        same = false;
    }
    return same;
};
var compareAsync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    var same = true;
    var compareSize = options.compareSize === undefined ? false : options.compareSize;
    var compareContent = options.compareContent === undefined ? false : options.compareContent;
    if (compareSize && fileStat1.size != fileStat2.size) {
        same = false;
    } else if(compareContent && !fc.compareSync(filePath1, filePath2, fileStat1.size)){
        same = false;
    }
    return same;
};

module.exports = {
        compareSync: compareSync,
        compareAsync: compareAsync
}
'use strict'
var fc = require('./filecompare')

var compareSync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    var compareSize = options.compareSize === undefined ? false : options.compareSize;
    var compareContent = options.compareContent === undefined ? false : options.compareContent;
    if (compareSize && fileStat1.size !== fileStat2.size) {
        return false;
    } else if(compareContent && !fc.compareSync(filePath1, filePath2)){
        return false;
    }
    return true;
};

var compareAsync = function (filePath1, fileStat1, filePath2, fileStat2, options) {
    var compareSize = options.compareSize === undefined ? false : options.compareSize;
    var compareContent = options.compareContent === undefined ? false : options.compareContent;
    if (compareSize && fileStat1.size !=! fileStat2.size) {
        return false;
    } else if(compareContent && !fc.compareSync(filePath1, filePath2, fileStat1.size)){
        return false;
    }
    return true;
};

module.exports = {
        compareSync: compareSync,
        compareAsync: compareAsync
}


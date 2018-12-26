'use strict'

var pathUtils = require('path');
var common = require('./common');

module.exports = function (entry1, entry2, state, level, relativePath, options, statistics, diffSet) {
    diffSet.push({
        path1 : entry1 ? pathUtils.dirname(entry1.path) : undefined,
        path2 : entry2 ? pathUtils.dirname(entry2.path) : undefined,
        relativePath : relativePath,
        name1 : entry1 ? entry1.name : undefined,
        name2 : entry2 ? entry2.name : undefined,
        state : state,
        type1 : entry1 ? common.getType(entry1.stat) : 'missing',
        type2 : entry2 ? common.getType(entry2.stat) : 'missing',
        level : level,
        size1 : entry1 ? entry1.stat.size : undefined,
        size2 : entry2 ? entry2.stat.size : undefined,
        date1 : entry1 ? entry1.stat.mtime : undefined,
        date2 : entry2 ? entry2.stat.mtime : undefined
    });
};

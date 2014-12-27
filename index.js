var fs = require('fs');
var util = require('util');
var pathUtils = require('path');
var minimatch = require('minimatch');
var fc = require('./filecompare')

/**
 * One of 'missing','file','directory'
 */
var getType = function (fileStat) {
    if (fileStat) {
        if (fileStat.isDirectory()) {
            return 'directory';
        } else{
            return 'file';
        }
    } else {
        return 'missing';
    }
}

/**
 * Comparator for directory entries sorting.
 */
var compareEntryCaseSensitive = function (a, b, ignoreCase) {
    if (a.stat.isDirectory() && b.stat.isFile()) {
        return -1;
    } else if (a.stat.isFile() && b.stat.isDirectory()) {
        return 1;
    } else {
        return a.name.localeCompare(b.name);
    }
}

/**
 * Comparator for directory entries sorting.
 */
var compareEntryIgnoreCase = function (a, b, ignoreCase) {
    if (a.stat.isDirectory() && b.stat.isFile()) {
        return -1;
    } else if (a.stat.isFile() && b.stat.isDirectory()) {
        return 1;
    } else {
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
}

/**
 * Matches fileName with pattern.
 */
var match = function(fileName, pattern){
    var patternArray = pattern.split(',');
    for(var i = 0; i<patternArray.length; i++){
        var pat = patternArray[i];
        if(minimatch(fileName, pat, { dot: true })){ //nocase
            return true;
        }
    }
    return false;
}

/**
 * Filter entries by file name. Returns true if the file is to be processed.
 */
var filterEntry = function(entry, options){
    if(entry.symlink && options.skipSymlinks){
        return false;
    }
    
    if(entry.stat.isFile() && options.includeFilter){
        if(match(entry.name, options.includeFilter)){
            return true;
        } else{
            return false;
        }
    }
    if(options.excludeFilter){
        if(match(entry.name, options.excludeFilter)){
            return false;
        } else{
            return true;
        }
    }
    return true;
}

/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (path, options) {
    if (!path) {
        return [];
    } else if (fs.statSync(path).isDirectory()) {
        var entries = fs.readdirSync(path);

        var res = [];
        entries.forEach(function (entryName) {
            var entryPath = path + '/' + entryName;
            var entry = {
                name : entryName,
                path : entryPath,
                stat : fs.statSync(entryPath),
                symlink : fs.lstatSync(entryPath).isSymbolicLink(),
                toString : function () {
                    return this.name;
                }
            };
            if (filterEntry(entry, options)){
                res.push(entry);
            }
        });
        return options.ignoreCase?res.sort(compareEntryIgnoreCase):res.sort(compareEntryCaseSensitive);
    } else {
        var name = pathUtils.basename(path);
        return [
            {
                name : name,
                path : path,
                stat : fs.statSync(path)
            }

        ];
    }
}

/**
 * Default file comparator.
 */
var defaultCompareFileCallback = function (filePath1, fileStat1, filePath2, fileStat2, options) {
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

/**
 * Default result builder.
 */
var defaultResultBuilderCallback = function (entry1, entry2, state, level, relativePath, options, result) {
    result.diffSet.push({
        path1 : entry1 ? pathUtils.dirname(entry1.path) : undefined,
        path2 : entry2 ? pathUtils.dirname(entry2.path) : undefined,
        relativePath : relativePath,
        name1 : entry1 ? entry1.name : undefined,
        name2 : entry2 ? entry2.name : undefined,
        state : state,
        type1 : entry1 ? getType(entry1.stat) : 'missing',
        type2 : entry2 ? getType(entry2.stat) : 'missing',
        level : level,
        size1 : entry1 ? entry1.stat.size : undefined,
        size2 : entry2 ? entry2.stat.size : undefined,
        date1 : entry1 ? entry1.stat.mtime : undefined,
        date2 : entry2 ? entry2.stat.mtime : undefined
    });
}

/**
 * Compares two directories recursively.
 */
var compare = function (path1, path2, level, relativePath, options, compareFileCallback, resultBuilderCallback, result) {
    var entries1 = getEntries(path1, options);
    var entries2 = getEntries(path2, options);
    var i1 = 0, i2 = 0;
    while (i1 < entries1.length || i2 < entries2.length) {
        var entry1 = entries1[i1];
        var entry2 = entries2[i2];
        var n1 = entry1 ? entry1.name : undefined;
        var n2 = entry2 ? entry2.name : undefined;
        var p1 = entry1 ? entry1.path : undefined;
        var p2 = entry2 ? entry2.path : undefined;
        var fileStat1 = entry1 ? entry1.stat : undefined;
        var fileStat2 = entry2 ? entry2.stat : undefined;
        var type1, type2;

        // compare entry name (-1, 0, 1)
        var cmp;
        if (i1 < entries1.length && i2 < entries2.length) {
            cmp = options.ignoreCase?compareEntryIgnoreCase(entry1, entry2):compareEntryCaseSensitive(entry1, entry2);
            type1 = getType(fileStat1);
            type2 = getType(fileStat2);
        } else if (i1 < entries1.length) {
            type1 = getType(fileStat1);
            type2 = getType(undefined);
            cmp = -1;
        } else {
            type1 = getType(undefined);
            type2 = getType(fileStat2);
            cmp = 1;
        }

        // process entry
        if (cmp == 0) {
            if (type1 === type2) {
                var same;
                if(type1==='file'){
                    same = compareFileCallback(p1, fileStat1, p2, fileStat2, options);
                } else{
                    same = true;
                }
                resultBuilderCallback(entry1, entry2, same ? 'equal' : 'distinct', level, relativePath, options, result);
                same ? result.equal++ : result.distinct++;
            } else {
                resultBuilderCallback(entry1, entry2, 'distinct', level, relativePath, options, result);
                result.distinct++;
            }
            i1++;
            i2++;
            if(!options.skipSubdirs){
                if (type1 == 'directory' && type2 === 'directory') {
                    compare(p1, p2, level + 1, relativePath + '/' + entry1.name, options, compareFileCallback, resultBuilderCallback, result);
                } else if (type1 === 'directory') {
                    compare(p1, undefined, level + 1, relativePath + '/' + entry1.name, options, compareFileCallback, resultBuilderCallback, result);
                } else if (type2 === 'directory') {
                    compare(undefined, p2, level + 1, relativePath + '/' + entry2.name, options, compareFileCallback, resultBuilderCallback, result);
                }
            }
        } else if (cmp < 0) {
            resultBuilderCallback(entry1, undefined, 'left', level, relativePath, options, result);
            result.left++;
            i1++;
            if (type1 == 'directory' && !options.skipSubdirs) {
                compare(p1, undefined, level + 1, relativePath + '/' + entry1.name, options, compareFileCallback, resultBuilderCallback, result);
            }
        } else {
            resultBuilderCallback(undefined, entry2, 'right', level, relativePath, options, result);
            result.right++;
            i2++;
            if (type2 == 'directory' && !options.skipSubdirs) {
                compare(undefined, p2, level + 1, relativePath + '/' + entry2.name, options, compareFileCallback, resultBuilderCallback, result);
            }
        }
    }
};

/**
 * Synchronous comparision. 
 * Output format:
 *  distinct: number of distinct entries
 *  equal: number of equal entries
 *  left: number of entries only in path1
 *  right: number of entries only in path2
 *  differences: total number of differences (distinct+left+right)
 *  same: true if directories are identical
 *  diffSet - List of changes
 *      path1: absolute path not including file/directory name,
 *      path2: absolute path not including file/directory name,
 *      relativePath: common path relative to root,
 *      name1: file/directory name
 *      name2: file/directory name
 *      state: one of equal, left, right, distinct,
 *      type1: one of missing, file, directory
 *      type2: one of missing, file, directory
 *      size1: file size
 *      size2: file size
 *      date1: modification date (stat.mdate)
 *      date2: modification date (stat.mdate)
 *      level: depth
 * Options:
 *  compareSize: true/false - compares files by size
 *  compareContent: true/false - compares files by content
 *  skipSubdirs: true/false - skips sub directories
 *  skipSymlinks: true/false - skips symbolic links
 *  ignoreCase: true/false - ignores case when comparing names.
 *  includeFilter: file name filter
 *  excludeFilter: file/directory name exclude filter
 */
var compareSync = function (path1, path2, options, compareFileCallback, resultBuilderCallback) {
    'use strict';
    var res = {
        distinct : 0,
        equal : 0,
        left : 0,
        right : 0,
        same : undefined,
        diffSet : []
    };
    if (!resultBuilderCallback) {
        resultBuilderCallback = defaultResultBuilderCallback;
    }
    if (!compareFileCallback) {
        compareFileCallback = defaultCompareFileCallback;
    }
    compare(path1, path2, 0, '', options === undefined ? {} : options, compareFileCallback, resultBuilderCallback, res);
    res.differences = res.distinct + res.left + res.right;
    res.same = res.differences ? false : true;

    return res;
};
module.exports = {
    compareSync : compareSync
};

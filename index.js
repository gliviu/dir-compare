var util = require('util');
var pathUtils = require('path');
var fs = require('fs');
var Promise = require('bluebird');
var compareSyncInternal = require('./compareSync');
var compareAsyncInternal = require('./compareAsync');
var defaultResultBuilderCallback = require('./defaultResultBuilderCallback');
var defaultFileCompare = require('./file_compare_handlers/defaultFileCompare');
var lineBasedFileCompare = require('./file_compare_handlers/lineBasedFileCompare');
var common = require('./common');

var ROOT_PATH = pathUtils.sep

var compareSync = function (path1, path2, options) {
    'use strict';
    // realpathSync() is necessary for loop detection to work properly
    var absolutePath1 = pathUtils.normalize(pathUtils.resolve(fs.realpathSync(path1)))
    var absolutePath2 = pathUtils.normalize(pathUtils.resolve(fs.realpathSync(path2)))
    var statistics = {
        distinct : 0,
        equal : 0,
        left : 0,
        right : 0,
        distinctFiles : 0,
        equalFiles : 0,
        leftFiles : 0,
        rightFiles : 0,
        distinctDirs : 0,
        equalDirs : 0,
        leftDirs : 0,
        rightDirs : 0,
        same : undefined
    };
    var diffSet;
    options = prepareOptions(options);
    if(!options.noDiffSet){
        diffSet = [];
    }
    compareSyncInternal(
        common.buildEntry(absolutePath1, path1, pathUtils.basename(absolutePath1)),
        common.buildEntry(absolutePath2, path2, pathUtils.basename(absolutePath2)),
        0, ROOT_PATH, options, statistics, diffSet);
    completeStatistics(statistics);
    statistics.diffSet = diffSet;

    return statistics;
};

var wrapper = {
    realPath : Promise.promisify(fs.realpath),
}

var compareAsync = function (path1, path2, options) {
    'use strict';
    var absolutePath1, absolutePath2
    return Promise.resolve()
    .then(function(){
        return Promise.all([wrapper.realPath(path1), wrapper.realPath(path2)])
    })
    .then(function(realPaths){
        var realPath1 = realPaths[0]
        var realPath2 = realPaths[1]
        // realpath() is necessary for loop detection to work properly
        absolutePath1 = pathUtils.normalize(pathUtils.resolve(realPath1))
        absolutePath2 = pathUtils.normalize(pathUtils.resolve(realPath2))
    })
    .then(function(){
        var statistics = {
                distinct : 0,
                equal : 0,
                left : 0,
                right : 0,
                distinctFiles : 0,
                equalFiles : 0,
                leftFiles : 0,
                rightFiles : 0,
                distinctDirs : 0,
                equalDirs : 0,
                leftDirs : 0,
                rightDirs : 0,
                same : undefined
            };
            options = prepareOptions(options);
            var asyncDiffSet;
            if(!options.noDiffSet){
                asyncDiffSet = [];
            }
        return compareAsyncInternal(
          common.buildEntry(absolutePath1, path1, pathUtils.basename(path1)),
          common.buildEntry(absolutePath2, path2, pathUtils.basename(path2)),
          0, ROOT_PATH, options, statistics, asyncDiffSet).then(
                function(){
                    completeStatistics(statistics);
                    if(!options.noDiffSet){
                        var diffSet = [];
                        rebuildAsyncDiffSet(statistics, asyncDiffSet, diffSet);
                        statistics.diffSet = diffSet;
                    }
                    return statistics;
                });
    });
};

var prepareOptions = function(options){
    options = options || {};
    var clone = JSON.parse(JSON.stringify(options))
    clone.resultBuilder = options.resultBuilder;
    clone.compareFileSync = options.compareFileSync;
    clone.compareFileAsync = options.compareFileAsync;
    if (!clone.resultBuilder) {
        clone.resultBuilder = defaultResultBuilderCallback;
    }
    if (!clone.compareFileSync) {
        clone.compareFileSync = defaultFileCompare.compareSync;
    }
    if (!clone.compareFileAsync) {
        clone.compareFileAsync = defaultFileCompare.compareAsync;
    }
    clone.dateTolerance = clone.dateTolerance || 1000;
    clone.dateTolerance = Number(clone.dateTolerance)
    if(isNaN(clone.dateTolerance)){
        throw new Error('Date tolerance is not a number')
    }
    return clone;
}

var completeStatistics = function(statistics){
    statistics.differences = statistics.distinct + statistics.left + statistics.right;
    statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles;
    statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs;
    statistics.total = statistics.equal+statistics.differences;
    statistics.totalFiles = statistics.equalFiles+statistics.differencesFiles;
    statistics.totalDirs = statistics.equalDirs+statistics.differencesDirs;
    statistics.same = statistics.differences ? false : true;
}

// Async diffsets are kept into recursive structures.
// This method transforms them into one dimensional arrays.
var rebuildAsyncDiffSet = function(statistics, asyncDiffSet, diffSet){
	asyncDiffSet.forEach(function(rawDiff){
		if(!Array.isArray(rawDiff)){
		    diffSet.push(rawDiff);
		} else{
		    rebuildAsyncDiffSet(statistics, rawDiff, diffSet);
		}
	});
}


/**
 * Options:
 *  compareSize: true/false - Compares files by size. Defaults to 'false'.
 *  compareDate: true/false - Compares files by date of modification (stat.mtime). Defaults to 'false'.
 *  dateTolerance: milliseconds - Two files are considered to have the same date if the difference between their modification dates fits within date tolerance. Defaults to 1000 ms.
 *  compareContent: true/false - Compares files by content. Defaults to 'false'.
 *  skipSubdirs: true/false - Skips sub directories. Defaults to 'false'.
 *  skipSymlinks: true/false - Skips symbolic links. Defaults to 'false'.
 *  ignoreCase: true/false - Ignores case when comparing names. Defaults to 'false'.
 *  noDiffSet: true/false - Toggles presence of diffSet in output. If true, only statistics are provided. Use this when comparing large number of files to avoid out of memory situations. Defaults to 'false'.
 *  includeFilter: File name filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
 *  excludeFilter: File/directory name exclude filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.
 *  resultBuilder: Callback for constructing result.
 *  	function (entry1, entry2, state, level, relativePath, options, statistics, diffSet). Called for each compared entry pair. Updates 'statistics' and 'diffSet'.
 *  compareFileSync, compareFileAsync: Callbacks for file comparison. 
 *
 * Output format:
 *  distinct: number of distinct entries
 *  equal: number of equal entries
 *  left: number of entries only in path1
 *  right: number of entries only in path2
 *  differences: total number of differences (distinct+left+right)
 *  total: total number of entries (differences+equal)
 *  distinctFiles: number of distinct files
 *  equalFiles: number of equal files
 *  leftFiles: number of files only in path1
 *  rightFiles: number of files only in path2
 *  differencesFiles: total number of different files (distinctFiles+leftFiles+rightFiles)
 *  totalFiles: total number of files (differencesFiles+equalFiles)
 *  distinctDirs: number of distinct directories
 *  equalDirs: number of equal directories
 *  leftDirs: number of directories only in path1
 *  rightDirs: number of directories only in path2
 *  differencesDirs: total number of different directories (distinctDirs+leftDirs+rightDirs)
 *  totalDirs: total number of directories (differencesDirs+equalDirs)
 *  same: true if directories are identical
 *  diffSet - List of changes (present if Options.noDiffSet is false)
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
 *      date1: modification date (stat.mtime)
 *      date2: modification date (stat.mtime)
 *      level: depth
 */
module.exports = {
    compareSync : compareSync,
    compare : compareAsync,
    fileCompareHandlers: {
        defaultFileCompare: defaultFileCompare,
        lineBasedFileCompare: lineBasedFileCompare
    }
};

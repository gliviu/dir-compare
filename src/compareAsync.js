var fs = require('fs');
var common = require('./common');
var pathUtils = require('path');
var Promise = require('bluebird');
var fsPromise = require('./fsPromise');

var PATH_SEP = pathUtils.sep

/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (absolutePath, relativePath, path, options, loopDetected) {
    if (!absolutePath || loopDetected) {
        return Promise.resolve([]);
    } else{
        return fsPromise.stat(absolutePath).then(
                function(statPath){
                    if(statPath.isDirectory()){
                        return fsPromise.readdir(absolutePath).then(
                                function(rawEntries){
                                    return buildEntries(absolutePath, relativePath, path, rawEntries, options);
                                });
                    } else{
                        var name = pathUtils.basename(absolutePath);
                        return [
                            {
                                name : name,
                                absolutePath: absolutePath,
                                path : path,
                                stat : statPath
                            }
                        ];
                    }
                });
    }
}

var buildEntries = function(absolutePath, relativePath, path, rawEntries, options){
    var promisedEntries = [];
    rawEntries.forEach(function (entryName) {
        promisedEntries.push(buildEntry(absolutePath, path, entryName, options));
    });
    return Promise.all(promisedEntries).then(
            function(entries){
                var result = [];
                entries.forEach(function(entry){

                    if (common.filterEntry(entry, relativePath, options)){
                        result.push(entry);
                    }
                });
                return options.ignoreCase?result.sort(common.compareEntryIgnoreCase):result.sort(common.compareEntryCaseSensitive);
            });
}

var buildEntry = function(absolutePath, path, entryName, options){
    var entryAbsolutePath = absolutePath + PATH_SEP + entryName;
    var entryPath = path + PATH_SEP + entryName;
    return Promise.resolve(fsPromise.lstat(entryAbsolutePath)).then(function(lstatEntry){
        var isSymlink = lstatEntry.isSymbolicLink();
        var statPromise;
        if(options.skipSymlinks && isSymlink){
            statPromise = Promise.resolve(undefined);
        } else{
            statPromise = fsPromise.stat(entryAbsolutePath);
        }
        return statPromise.then(function(statEntry){
            return {
                name : entryName,
                absolutePath : entryAbsolutePath,
                path : entryPath,
                stat : statEntry,
                lstat : lstatEntry,
                symlink : isSymlink
            };
        });
    });
}

/**
 * Compares two directories asynchronously.
 */
var compare = function (rootEntry1, rootEntry2, level, relativePath, options, statistics, diffSet, symlinkCache) {
    symlinkCache = symlinkCache || {
        dir1 : {},
        dir2 : {}
    };
    var loopDetected1 = common.detectLoop(rootEntry1, symlinkCache.dir1);
    var loopDetected2 = common.detectLoop(rootEntry2, symlinkCache.dir2);

    var symlinkCachePath1, symlinkCachePath2;
    if(rootEntry1 && !loopDetected1){
        symlinkCachePath1 = rootEntry1.symlink?fs.realpathSync(rootEntry1.absolutePath):rootEntry1.absolutePath;
        symlinkCache.dir1[symlinkCachePath1] = true;
    }
    if(rootEntry2 && !loopDetected2){
        symlinkCachePath2 = rootEntry2.symlink?fs.realpathSync(rootEntry2.absolutePath):rootEntry2.absolutePath;
        symlinkCache.dir2[symlinkCachePath2] = true;
    }
    var absolutePath1 = rootEntry1?rootEntry1.absolutePath:undefined;
    var absolutePath2 = rootEntry2?rootEntry2.absolutePath:undefined;
    var path1 = rootEntry1?rootEntry1.path:undefined;
    var path2 = rootEntry2?rootEntry2.path:undefined;

    return Promise.all([getEntries(absolutePath1, relativePath, path1, options, loopDetected1), getEntries(absolutePath2, relativePath, path2, options, loopDetected2)]).then(
            function(entriesResult){
                var entries1 = entriesResult[0];
                var entries2 = entriesResult[1];
                var i1 = 0, i2 = 0;
                var comparePromises = [];
                var compareFilePromises = [];

                while (i1 < entries1.length || i2 < entries2.length) {
                    var entry1 = entries1[i1];
                    var entry2 = entries2[i2];
                    var n1 = entry1 ? entry1.name : undefined;
                    var n2 = entry2 ? entry2.name : undefined;
                    var p1 = entry1 ? entry1.absolutePath : undefined;
                    var p2 = entry2 ? entry2.absolutePath : undefined;
                    var fileStat1 = entry1 ? entry1.stat : undefined;
                    var fileStat2 = entry2 ? entry2.stat : undefined;
                    var type1, type2;

                    // compare entry name (-1, 0, 1)
                    var cmp;
                    if (i1 < entries1.length && i2 < entries2.length) {
                        cmp = options.ignoreCase?common.compareEntryIgnoreCase(entry1, entry2):common.compareEntryCaseSensitive(entry1, entry2);
                        type1 = common.getType(fileStat1);
                        type2 = common.getType(fileStat2);
                    } else if (i1 < entries1.length) {
                        type1 = common.getType(fileStat1);
                        type2 = common.getType(undefined);
                        cmp = -1;
                    } else {
                        type1 = common.getType(undefined);
                        type2 = common.getType(fileStat2);
                        cmp = 1;
                    }

                    // process entry
                    if (cmp === 0) {
                        // Both left/right exist and have the same name and type
                        var samePromise = undefined, same = undefined;
                        if(type1==='file'){
                            if (options.compareSize && fileStat1.size !== fileStat2.size) {
                                same = false;
                            } else if(options.compareDate && !common.sameDate(fileStat1.mtime, fileStat2.mtime, options.dateTolerance)){
                                same = false;
                            } else if(options.compareContent){
                                var cmpFile = function(entry1, entry2, type1, type2){
                                    var subDiffSet;
                                    if(!options.noDiffSet){
                                        subDiffSet = [];
                                        diffSet.push(subDiffSet);
                                    }
                                    samePromise = options.compareFileAsync(p1, fileStat1, p2, fileStat2, options).then(function(comparisonResult){
                                    	var same, error;
                                    	if(typeof(comparisonResult) === "boolean"){
                                    		same = comparisonResult;
                                    	} else{
                                    		error = comparisonResult;
                                    	}

                                        return {entry1: entry1, entry2: entry2, same: same, error: error, type1: type1, type2: type2, diffSet: subDiffSet};
                                    });
                                }
                                cmpFile(entry1, entry2, type1, type2);
                            } else{
                                same = true;
                            }
                        } else{
                            same = true;
                        }
                        if(same !== undefined){
                            doStats(entry1, entry2, same, statistics, options, level, relativePath, diffSet, type1, type2);
                        } else{
                            compareFilePromises.push(samePromise);
                        }

                        i1++;
                        i2++;
                        if(!options.skipSubdirs && type1 === 'directory'){
                            var subDiffSet;
                            if(!options.noDiffSet){
                                subDiffSet = [];
                                diffSet.push(subDiffSet);
                            }
                            comparePromises.push(compare(entry1, entry2, level + 1,
                                    pathUtils.join(relativePath, entry1.name),
                                    options, statistics, subDiffSet, common.cloneSymlinkCache(symlinkCache)));
                        }
                    } else if (cmp < 0) {
                        // Right missing
                        if(!options.noDiffSet){
                            options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet);
                        }
                        statistics.left++;
                        if(type1==='file'){
                            statistics.leftFiles++;
                        } else{
                            statistics.leftDirs++;
                        }
                        i1++;
                        if (type1 === 'directory' && !options.skipSubdirs) {
                            var subDiffSet;
                            if(!options.noDiffSet){
                                subDiffSet = [];
                                diffSet.push(subDiffSet);
                            }
                            comparePromises.push(compare(entry1, undefined,
                                    level + 1,
                                    pathUtils.join(relativePath, entry1.name), options, statistics, subDiffSet, common.cloneSymlinkCache(symlinkCache)));
                        }
                    } else {
                        // Left missing
                        if(!options.noDiffSet){
                            var subDiffSet = [];
                            diffSet.push(subDiffSet);
                            options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, subDiffSet);
                        }
                        statistics.right++;
                        if(type2==='file'){
                            statistics.rightFiles++;
                        } else{
                            statistics.rightDirs++;
                        }
                        i2++;
                        if (type2 === 'directory' && !options.skipSubdirs) {
                            var subDiffSet;
                            if(!options.noDiffSet){
                                subDiffSet = [];
                                diffSet.push(subDiffSet);
                            }
                            comparePromises.push(compare(undefined, entry2,
                                    level + 1,
                                    pathUtils.join(relativePath, entry2.name), options, statistics, subDiffSet, common.cloneSymlinkCache(symlinkCache)));
                        }
                    }
                }
                return Promise.all(comparePromises).then(function(){
                    return Promise.all(compareFilePromises).then(function(sameResults){
                        for(var i = 0; i<sameResults.length; i++){
                            var sameResult = sameResults[i];
                            if(sameResult.error){
                            	return Promise.reject(sameResult.error);
                            } else{
                                doStats(sameResult.entry1, sameResult.entry2, sameResult.same, statistics, options, level, relativePath, sameResult.diffSet, sameResult.type1, sameResult.type2);
                            }
                        }
                    });
                });
            });
};

var doStats = function(entry1, entry2, same, statistics, options, level, relativePath, diffSet, type1, type2){
    if(!options.noDiffSet){
        options.resultBuilder(entry1, entry2, same ? 'equal' : 'distinct', level, relativePath, options, statistics, diffSet)
    }
    same ? statistics.equal++ : statistics.distinct++;
    if(type1==='file'){
        same ? statistics.equalFiles++ : statistics.distinctFiles++;
    } else{
        same ? statistics.equalDirs++ : statistics.distinctDirs++;
    }
}

module.exports = compare;

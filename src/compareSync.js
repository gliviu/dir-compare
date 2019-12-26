var fs = require('fs');
var pathUtils = require('path');
var common = require('./common');

/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (rootEntry, relativePath, loopDetected, options) {
    if (!rootEntry || loopDetected) {
        return [];
    }
    if (rootEntry.isDirectory) {
        var entries = fs.readdirSync(rootEntry.absolutePath);
        return common.buildDirEntries(rootEntry, entries, relativePath, options)
    }
    return [rootEntry];
}

/**
 * Compares two directories synchronously.
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
    var entries1 = getEntries(rootEntry1, relativePath, loopDetected1, options);
    var entries2 = getEntries(rootEntry2, relativePath, loopDetected2, options);
    var i1 = 0, i2 = 0;
    while (i1 < entries1.length || i2 < entries2.length) {
        var entry1 = entries1[i1];
        var entry2 = entries2[i2];
        var p1 = entry1 ? entry1.absolutePath : undefined;
        var p2 = entry2 ? entry2.absolutePath : undefined;
        var fileStat1 = entry1 ? entry1.stat : undefined;
        var fileStat2 = entry2 ? entry2.stat : undefined;
        var type1, type2;

        // compare entry name (-1, 0, 1)
        var cmp;
        if (i1 < entries1.length && i2 < entries2.length) {
            cmp = options.ignoreCase?common.compareEntryIgnoreCase(entry1, entry2):common.compareEntryCaseSensitive(entry1, entry2);
            type1 = common.getType(entry1);
            type2 = common.getType(entry2);
        } else if (i1 < entries1.length) {
            type1 = common.getType(entry1);
            type2 = common.getType(undefined);
            cmp = -1;
        } else {
            type1 = common.getType(undefined);
            type2 = common.getType(entry2);
            cmp = 1;
        }

        // process entry
        if (cmp === 0) {
            // Both left/right exist and have the same name and type
            var same;
            if(type1==='file'){
                if (options.compareSize && fileStat1.size !== fileStat2.size) {
                    same = false;
                } else if(options.compareDate && !common.sameDate(fileStat1.mtime, fileStat2.mtime, options.dateTolerance)){
                    same = false;
                } else if(options.compareContent){
                    same = options.compareFileSync(p1, fileStat1, p2, fileStat2, options);
                } else{
                    same = true;
                }
            } else if(type1==='directory'){
                same = true;
            } else if(type1==='broken-link'){
                same = false;
            } else {
                throw new Error('Unexpected type ' + type1);
            }
            if(!options.noDiffSet){
                options.resultBuilder(entry1, entry2, same ? 'equal' : 'distinct', level, relativePath, options, statistics, diffSet);
            }
            same ? statistics.equal++ : statistics.distinct++;
            if(type1==='file'){
                same ? statistics.equalFiles++ : statistics.distinctFiles++;
            } else if(type1==='directory'){
                same ? statistics.equalDirs++ : statistics.distinctDirs++;
            } else if(type1==='broken-link'){
                statistics.distinctBrokenLinks++;
            } else {
                throw new Error('Unexpected type ' + type1);
            }
            i1++;
            i2++;
            if(!options.skipSubdirs && type1 === 'directory'){
                compare(entry1, entry2, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
            }
        } else if (cmp < 0) {
            // Right missing
            if(!options.noDiffSet){
                options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet);
            }
            statistics.left++;
            if(type1==='file'){
                statistics.leftFiles++;
            } else if(type1==='directory'){
                statistics.leftDirs++;
            } else if(type1==='broken-link'){
                statistics.leftBrokenLinks++;
            } else {
                throw new Error('Unexpected type ' + type1);
            }
            i1++;
            if (type1 === 'directory' && !options.skipSubdirs) {
                compare(entry1, undefined, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
            }
        } else {
            // Left missing
            if(!options.noDiffSet){
                options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, diffSet);
            }
            statistics.right++;
            if(type2==='file'){
                statistics.rightFiles++;
            } else if(type2==='directory'){
                statistics.rightDirs++;
            } else if(type2==='broken-link'){
                statistics.rightBrokenLinks++;
            } else {
                throw new Error('Unexpected type ' + type2);
            }
            i2++;
            if (type2 === 'directory' && !options.skipSubdirs) {
                compare(undefined, entry2, level + 1, pathUtils.join(relativePath, entry2.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
            }
        }
    }
};

module.exports = compare;

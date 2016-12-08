var fs = require('fs');
var pathUtils = require('path');
var common = require('./common');

/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (path, options) {
    if (!path) {
        return [];
    } else {
        var statPath = fs.statSync(path);
        if (statPath.isDirectory()) {
           var entries = fs.readdirSync(path);

           var res = [];
           entries.forEach(function (entryName) {
               var entryPath = path + '/' + entryName;
               var lstatEntry = fs.lstatSync(entryPath);
               var isSymlink = lstatEntry.isSymbolicLink();
               var statEntry;
               if(options.skipSymlinks && isSymlink){
                   statEntry = undefined;
               } else{
                   statEntry = fs.statSync(entryPath);
               }
               var entry = {
                   name : entryName,
                   path : entryPath,
                   stat : statEntry,
                   lstat : lstatEntry,
                   symlink : isSymlink,
                   toString : function () {
                       return this.name;
                   }
               };
               if (common.filterEntry(entry, options)){
                   res.push(entry);
               }
           });
           return options.ignoreCase?res.sort(common.compareEntryIgnoreCase):res.sort(common.compareEntryCaseSensitive);
       } else {
           var name = pathUtils.basename(path);
           return [
               {
                   name : name,
                   path : path,
                   stat : statPath,
                   toString : function () {
                       return this.name;
                   }
               }

           ];
       }
    }
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
        symlinkCachePath1 = pathUtils.normalize(pathUtils.resolve(rootEntry1.symlink?fs.realpathSync(rootEntry1.path):rootEntry1.path)).toLowerCase();
        symlinkCache.dir1[symlinkCachePath1] = true;
    }
    if(rootEntry2 && !loopDetected2){
        symlinkCachePath2 = pathUtils.normalize(pathUtils.resolve(rootEntry2.symlink?fs.realpathSync(rootEntry2.path):rootEntry2.path)).toLowerCase();
        symlinkCache.dir2[symlinkCachePath2] = true;
    }
    var path1 = rootEntry1?rootEntry1.path:undefined;
    var path2 = rootEntry2?rootEntry2.path:undefined;
    var entries1 = loopDetected1?[]:getEntries(path1, options);
    var entries2 = loopDetected2?[]:getEntries(path2, options);
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
            // Both left/right exist and have the same name
            if (type1 === type2) {
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
                } else{
                    same = true;
                }
                if(!options.noDiffSet){
                    options.resultBuilder(entry1, entry2, same ? 'equal' : 'distinct', level, relativePath, options, statistics, diffSet);
                }
                same ? statistics.equal++ : statistics.distinct++;
                if(type1==='file'){
                    same ? statistics.equalFiles++ : statistics.distinctFiles++;
                } else{
                    same ? statistics.equalDirs++ : statistics.distinctDirs++;
                }
            } else {
                // File and directory with same name
                if(!options.noDiffSet){
                    options.resultBuilder(entry1, entry2, 'distinct', level, relativePath, options, statistics, diffSet);
                }
                statistics.distinct+=2;
                statistics.distinctFiles++;
                statistics.distinctDirs++;
            }
            i1++;
            i2++;
            if(!options.skipSubdirs){
                if (type1 === 'directory' && type2 === 'directory') {
                    compare(entry1, entry2, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
                } else if (type1 === 'directory') {
                    compare(entry1, undefined, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
                } else if (type2 === 'directory') {
                    compare(undefined, entry2, level + 1, relativePath + '/' + entry2.name, options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
                }
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
                compare(entry1, undefined, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
            }
        } else {
            // Left missing
            if(!options.noDiffSet){
                options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, diffSet);
            }
            statistics.right++;
            if(type2==='file'){
                statistics.rightFiles++;
            } else{
                statistics.rightDirs++;
            }
            i2++;
            if (type2 === 'directory' && !options.skipSubdirs) {
                compare(undefined, entry2, level + 1, relativePath + '/' + entry2.name, options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache));
            }
        }
    }
};

module.exports = compare;

var fs = require('fs');
var pathUtils = require('path');
var common = require('./common'); 






/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (path, options) {
	// TODO: fs.statSync(path) is called twice. Cache the result of the first call
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
                stat : fs.statSync(path)
            }

        ];
    }
}


/**
 * Compares two directories synchronously.
 */
var compare = function (path1, path2, level, relativePath, options, statistics, diffSet) {
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
                    same = options.callbacks.compareFile(p1, fileStat1, p2, fileStat2, options);
                } else{
                    same = true;
                }
                if(!options.noDiffSet){
                    options.callbacks.resultBuilder(entry1, entry2, same ? 'equal' : 'distinct', level, relativePath, options, statistics, diffSet);
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
                    options.callbacks.resultBuilder(entry1, entry2, 'distinct', level, relativePath, options, statistics, diffSet);
                }
                statistics.distinct+=2;
                statistics.distinctFiles++;
                statistics.distinctDirs++;
            }
            i1++;
            i2++;
            if(!options.skipSubdirs){
                if (type1 === 'directory' && type2 === 'directory') {
                    compare(p1, p2, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet);
                } else if (type1 === 'directory') {
                    compare(p1, undefined, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet);
                } else if (type2 === 'directory') {
                    compare(undefined, p2, level + 1, relativePath + '/' + entry2.name, options, statistics, diffSet);
                }
            }
        } else if (cmp < 0) {
            // Right missing
            if(!options.noDiffSet){
                options.callbacks.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet);
            }
            statistics.left++;
            if(type1==='file'){
                statistics.leftFiles++;
            } else{
                statistics.leftDirs++;
            }
            i1++;
            if (type1 === 'directory' && !options.skipSubdirs) {
                compare(p1, undefined, level + 1, relativePath + '/' + entry1.name, options, statistics, diffSet);
            }
        } else {
            // Left missing
            if(!options.noDiffSet){
                options.callbacks.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, diffSet);
            }
            statistics.right++;
            if(type2==='file'){
                statistics.rightFiles++;
            } else{
                statistics.rightDirs++;
            }
            i2++;
            if (type2 === 'directory' && !options.skipSubdirs) {
                compare(undefined, p2, level + 1, relativePath + '/' + entry2.name, options, statistics, diffSet);
            }
        }
    }
};

module.exports = compare;
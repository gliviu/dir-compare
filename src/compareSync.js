var fs = require('fs')
var pathUtils = require('path')
var common = require('./common')
var compareRules = require('./compareEntry')
var stats = require('./stats')

/**
 * Returns the sorted list of entries in a directory.
 */
var getEntries = function (rootEntry, relativePath, loopDetected, options) {
    if (!rootEntry || loopDetected) {
        return []
    }
    if (rootEntry.isDirectory) {
        var entries = fs.readdirSync(rootEntry.absolutePath)
        return common.buildDirEntries(rootEntry, entries, relativePath, options)
    }
    return [rootEntry]
}

/**
 * Compares two directories synchronously.
 */
var compare = function (rootEntry1, rootEntry2, level, relativePath, options, statistics, diffSet, symlinkCache) {
    symlinkCache = symlinkCache || {
        dir1: {},
        dir2: {}
    }
    var loopDetected1 = common.detectLoop(rootEntry1, symlinkCache.dir1)
    var loopDetected2 = common.detectLoop(rootEntry2, symlinkCache.dir2)

    var symlinkCachePath1, symlinkCachePath2
    if (rootEntry1 && !loopDetected1) {
        symlinkCachePath1 = rootEntry1.isSymlink ? fs.realpathSync(rootEntry1.absolutePath) : rootEntry1.absolutePath
        symlinkCache.dir1[symlinkCachePath1] = true
    }
    if (rootEntry2 && !loopDetected2) {
        symlinkCachePath2 = rootEntry2.isSymlink ? fs.realpathSync(rootEntry2.absolutePath) : rootEntry2.absolutePath
        symlinkCache.dir2[symlinkCachePath2] = true
    }
    var entries1 = getEntries(rootEntry1, relativePath, loopDetected1, options)
    var entries2 = getEntries(rootEntry2, relativePath, loopDetected2, options)
    var i1 = 0, i2 = 0
    while (i1 < entries1.length || i2 < entries2.length) {
        var entry1 = entries1[i1]
        var entry2 = entries2[i2]
        var type1, type2

        // compare entry name (-1, 0, 1)
        var cmp
        if (i1 < entries1.length && i2 < entries2.length) {
            cmp = options.ignoreCase ? common.compareEntryIgnoreCase(entry1, entry2) : common.compareEntryCaseSensitive(entry1, entry2)
            type1 = common.getType(entry1)
            type2 = common.getType(entry2)
        } else if (i1 < entries1.length) {
            type1 = common.getType(entry1)
            type2 = common.getType(undefined)
            cmp = -1
        } else {
            type1 = common.getType(undefined)
            type2 = common.getType(entry2)
            cmp = 1
        }

        // process entry
        if (cmp === 0) {
            // Both left/right exist and have the same name and type
            var compareEntryRes = compareRules.compareEntrySync(entry1, entry2, type1, options)
            options.resultBuilder(entry1, entry2,
                compareEntryRes.same ? 'equal' : 'distinct',
                level, relativePath, options, statistics, diffSet,
                compareEntryRes.reason)
            stats.updateStatisticsBoth(entry1, entry2, compareEntryRes.same, compareEntryRes.reason, type1, statistics, options)
            i1++
            i2++
            if (!options.skipSubdirs && type1 === 'directory') {
                compare(entry1, entry2, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache))
            }
        } else if (cmp < 0) {
            // Right missing
            options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet)
            stats.updateStatisticsLeft(entry1, type1, statistics, options)
            i1++
            if (type1 === 'directory' && !options.skipSubdirs) {
                compare(entry1, undefined, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache))
            }
        } else {
            // Left missing
            options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, diffSet)
            stats.updateStatisticsRight(entry2, type2, statistics, options)
            i2++
            if (type2 === 'directory' && !options.skipSubdirs) {
                compare(undefined, entry2, level + 1, pathUtils.join(relativePath, entry2.name), options, statistics, diffSet, common.cloneSymlinkCache(symlinkCache))
            }
        }
    }
}

module.exports = compare

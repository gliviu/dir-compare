var fs = require('fs')
/**
 * Compares two entries with identical name and type.
 */
module.exports = {
    compareEntrySync: function (entry1, entry2, type, options) {
        if (type === 'file') {
            return compareFileSync(entry1, entry2, options)
        }
        if (type === 'directory') {
            return compareDirectory(entry1, entry2, options)
        }
        if (type === 'broken-link') {
            return compareBrokenLink()
        }
        throw new Error('Unexpected type ' + type)
    },

    compareEntryAsync: function (entry1, entry2, type, diffSet, options) {
        if (type === 'file') {
            return compareFileAsync(entry1, entry2, type, diffSet, options)
        }
        if (type === 'directory') {
            return compareDirectory(entry1, entry2, options)
        }
        if (type === 'broken-link') {
            return compareBrokenLink()
        }
        throw new Error('Unexpected type ' + type)
    }
}


function compareFileSync(entry1, entry2, options) {
    var p1 = entry1 ? entry1.absolutePath : undefined
    var p2 = entry2 ? entry2.absolutePath : undefined
    if (options.compareSymlink && !compareSymlink(entry1, entry2)) {
        return { same: false, reason: 'different-symlink' }
    }
    if (options.compareSize && entry1.stat.size !== entry2.stat.size) {
        return { same: false, reason: 'different-size' }
    }
    if (options.compareDate && !sameDate(entry1.stat.mtime, entry2.stat.mtime, options.dateTolerance)) {
        return { same: false, reason: 'different-date' }
    }
    if (options.compareContent && !options.compareFileSync(p1, entry1.stat, p2, entry2.stat, options)) {
        return { same: false, reason: 'different-content' }
    }
    return { same: true }
}

function compareFileAsync(entry1, entry2, type, diffSet, options) {
    var p1 = entry1 ? entry1.absolutePath : undefined
    var p2 = entry2 ? entry2.absolutePath : undefined
    if (options.compareSymlink && !compareSymlink(entry1, entry2)) {
        return { same: false, reason: 'different-symlink' }
    }
    if (options.compareSize && entry1.stat.size !== entry2.stat.size) {
        return { same: false, samePromise: undefined, reason: 'different-size' }
    }

    if (options.compareDate && !sameDate(entry1.stat.mtime, entry2.stat.mtime, options.dateTolerance)) {
        return { same: false, samePromise: undefined, reason: 'different-date' }
    }

    if (options.compareContent) {
        var samePromise = undefined
        var subDiffSet
        if (!options.noDiffSet) {
            subDiffSet = []
            diffSet.push(subDiffSet)
        }
        samePromise = options.compareFileAsync(p1, entry1.stat, p2, entry2.stat, options)
            .then(function (comparisonResult) {
                var same, error
                if (typeof (comparisonResult) === "boolean") {
                    same = comparisonResult
                } else {
                    error = comparisonResult
                }

                return {
                    entry1: entry1, entry2: entry2, same: same,
                    error: error, type1: type, type2: type,
                    diffSet: subDiffSet,
                    reason: same ? undefined : 'different-content'
                }
            })
            .catch(function (error) {
                return {
                    error: error
                }
            })

        return { same: undefined, samePromise: samePromise }
    }

    return { same: true, samePromise: undefined }
}

function compareDirectory(entry1, entry2, options) {
    if (options.compareSymlink && !compareSymlink(entry1, entry2)) {
        return { same: false, reason: 'different-symlink' }
    }
    return { same: true }
}

function compareBrokenLink() {
    return { same: false, reason: 'broken-link' } // broken links are never considered equal
}

/**
 * Compares two dates and returns true/false depending on tolerance (milliseconds).
 * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
 */
function sameDate(date1, date2, tolerance) {
    return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false
}

/**
 * Compares two entries for symlink equality.
 */
function compareSymlink(entry1, entry2) {
    if (!entry1.isSymlink && !entry2.isSymlink) {
        return true
    }
    if (entry1.isSymlink && entry2.isSymlink && isIdenticalLink(entry1.absolutePath, entry2.absolutePath)) {
        return true
    }
    return false
}

function isIdenticalLink(path1, path2) {
    return fs.readlinkSync(path1) === fs.readlinkSync(path2)
}
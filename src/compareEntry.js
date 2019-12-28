/**
 * Compares two entries with identical name and type.
 */
module.exports = {
    compareEntrySync: function (entry1, entry2, type, options) {
        if (type === 'file') {
            return compareFileSync(entry1, entry2, options)
        }
        if (type === 'directory') {
            return compareDirectory()
        }
        if (type === 'broken-link') {
            return compareBrokenLink()
        }
        throw new Error('Unexpected type ' + type)
    },

    compareEntryAsync: function (entry1, entry2, type, diffSet, options) {
        if (type === 'file') {
            var compareRes = compareFileAsync(entry1, entry2, type, diffSet, options)
            return { same: compareRes.same, samePromise: compareRes.samePromise }
        }
        if (type === 'directory') {
            return { same: compareDirectory() }
        }
        if (type === 'broken-link') {
            return { same: compareBrokenLink() }
        }
        throw new Error('Unexpected type ' + type)
    }
}


function compareFileSync(entry1, entry2, options) {
    var p1 = entry1 ? entry1.absolutePath : undefined
    var p2 = entry2 ? entry2.absolutePath : undefined
    if (options.compareSize && entry1.stat.size !== entry2.stat.size) {
        return false
    }
    if (options.compareDate && !sameDate(entry1.stat.mtime, entry2.stat.mtime, options.dateTolerance)) {
        return false
    }
    if (options.compareContent && !options.compareFileSync(p1, entry1.stat, p2, entry2.stat, options)) {
        return false
    }
    return true
}

function compareFileAsync(entry1, entry2, type, diffSet, options) {
    var p1 = entry1 ? entry1.absolutePath : undefined
    var p2 = entry2 ? entry2.absolutePath : undefined
    if (options.compareSize && entry1.stat.size !== entry2.stat.size) {
        return { same: false, samePromise: undefined }
    }

    if (options.compareDate && !sameDate(entry1.stat.mtime, entry2.stat.mtime, options.dateTolerance)) {
        return { same: false, samePromise: undefined }
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
                    diffSet: subDiffSet
                }
            })

        return { same: undefined, samePromise: samePromise }
    }

    return { same: true, samePromise: undefined }
}

function compareDirectory() {
    return true
}

function compareBrokenLink() {
    return false // broken links are never consider equal
}

/**
 * Compares two dates and returns true/false depending on tolerance (milliseconds).
 * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
 */
function sameDate(date1, date2, tolerance) {
    return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false
}


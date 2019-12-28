/**
 * Compares two entries with identical name and type.
 */
module.exports = {
    compareFileSync: function (entry1, entry2, options) {
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
    },

    compareFileAsync: function (entry1, entry2, type1, type2, diffSet, options) {
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
                        error: error, type1: type1, type2: type2,
                        diffSet: subDiffSet
                    }
                })

            return { same: undefined, samePromise: samePromise }
        }

        return { same: true, samePromise: undefined }
    },

    compareDirectory: function () {
        return true
    },

    compareBrokenLink: function () {
        return false // broken links are never consider equal
    }
}

/**
 * Compares two dates and returns true/false depending on tolerance (milliseconds).
 * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
 */
function sameDate(date1, date2, tolerance) {
    return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false
}


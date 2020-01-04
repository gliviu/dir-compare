/**
 * Calculates comparison statistics.
 */
module.exports = {
    initStats(options) {
        var symlinkStatistics = undefined
        if (options.compareSymlink) {
            symlinkStatistics = {
                distinctSymlinks: 0,
                equalSymlinks: 0,
                leftSymlinks: 0,
                rightSymlinks: 0,
                differencesSymlinks: 0,
                totalSymlinks: 0,
            }
        }
        return {
            distinct: 0,
            equal: 0,
            left: 0,
            right: 0,
            distinctFiles: 0,
            equalFiles: 0,
            leftFiles: 0,
            rightFiles: 0,
            distinctDirs: 0,
            equalDirs: 0,
            leftDirs: 0,
            rightDirs: 0,
            leftBrokenLinks: 0,
            rightBrokenLinks: 0,
            distinctBrokenLinks: 0,
            symlinks: symlinkStatistics,
            same: undefined
        }
    },
    updateStatisticsBoth: function (entry1, entry2, same, reason, type, statistics, options) {
        same ? statistics.equal++ : statistics.distinct++
        if (type === 'file') {
            same ? statistics.equalFiles++ : statistics.distinctFiles++
        } else if (type === 'directory') {
            same ? statistics.equalDirs++ : statistics.distinctDirs++
        } else if (type === 'broken-link') {
            statistics.distinctBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        var isSymlink1 = entry1 ? entry1.isSymlink : false
        var isSymlink2 = entry2 ? entry2.isSymlink : false
        var isSymlink = isSymlink1 || isSymlink2
        if (options.compareSymlink && isSymlink) {
            var symlinks = statistics.symlinks
            if (reason === 'different-symlink') {
                symlinks.distinctSymlinks++
            } else {
                symlinks.equalSymlinks++
            }
        }

    },
    updateStatisticsLeft: function (entry1, type, statistics, options) {
        statistics.left++
        if (type === 'file') {
            statistics.leftFiles++
        } else if (type === 'directory') {
            statistics.leftDirs++
        } else if (type === 'broken-link') {
            statistics.leftBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        if (options.compareSymlink && entry1.isSymlink) {
            statistics.symlinks.leftSymlinks++
        }
    },
    updateStatisticsRight: function (entry2, type, statistics, options) {
        statistics.right++
        if (type === 'file') {
            statistics.rightFiles++
        } else if (type === 'directory') {
            statistics.rightDirs++
        } else if (type === 'broken-link') {
            statistics.rightBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        if (options.compareSymlink && entry2.isSymlink) {
            statistics.symlinks.rightSymlinks++
        }
    },
    completeStatistics(statistics, options) {
        statistics.differences = statistics.distinct + statistics.left + statistics.right
        statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles
        statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs
        statistics.total = statistics.equal + statistics.differences
        statistics.totalFiles = statistics.equalFiles + statistics.differencesFiles
        statistics.totalDirs = statistics.equalDirs + statistics.differencesDirs
        statistics.totalBrokenLinks = statistics.leftBrokenLinks + statistics.rightBrokenLinks + statistics.distinctBrokenLinks
        statistics.same = statistics.differences ? false : true

        if (options.compareSymlink) {
            statistics.symlinks.differencesSymlinks = statistics.symlinks.distinctSymlinks +
                statistics.symlinks.leftSymlinks + statistics.symlinks.rightSymlinks
            statistics.symlinks.totalSymlinks = statistics.symlinks.differencesSymlinks + statistics.symlinks.equalSymlinks
        }
    }

}
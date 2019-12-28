/**
 * Calculates comparison statistics.
 */
module.exports = {
    updateStatisticsBoth: function (same, type, statistics) {
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

    },
    updateStatisticsLeft: function (type, statistics) {
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
    },
    updateStatisticsRight: function (type, statistics) {
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
    }

}
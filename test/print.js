const util = require('util')
const pathUtils = require('path')

const PATH_SEP = pathUtils.sep

function print(res, writer, displayOptions) {
    // calculate relative path length for pretty print
    let relativePathMaxLength = 0, fileNameMaxLength = 0
    if (!displayOptions.csv && res.diffSet) {
        res.diffSet.forEach(diff => {
            if (diff.relativePath.length > relativePathMaxLength) {
                relativePathMaxLength = diff.relativePath.length
            }
            const len = getCompareFile(diff, '??').length
            if (len > fileNameMaxLength) {
                fileNameMaxLength = len
            }
        })
    }

    // csv header
    if (displayOptions.csv) {
        writer.write('path,name,state,type,size1,size2,date1,date2,reason\n')
    }
    if (res.diffSet) {
        for (let i = 0; i < res.diffSet.length; i++) {
            const detail = res.diffSet[i]
            let show = true

            if (!displayOptions.wholeReport) {
                // show only files or broken links
                const type = detail.type1 !== 'missing' ? detail.type1 : detail.type2
                if (type !== 'file' && type !== 'broken-link') {
                    show = false
                }
            }
            if (show) {
                switch (detail.state) {
                    case 'equal':
                        show = displayOptions.showAll || displayOptions.showEqual ? true : false
                        break
                    case 'left':
                        show = displayOptions.showAll || displayOptions.showLeft ? true : false
                        break
                    case 'right':
                        show = displayOptions.showAll || displayOptions.showRight ? true : false
                        break
                    case 'distinct':
                        show = displayOptions.showAll || displayOptions.showDistinct ? true : false
                        break
                    default:
                        show = true
                }
                if (show) {
                    if (displayOptions.csv) {
                        printCsv(writer, detail)
                    } else {
                        printPretty(writer, displayOptions, detail, relativePathMaxLength, fileNameMaxLength)
                    }
                }
            }
        }
    }

    // PRINT STATISTICS
    let statTotal, statEqual, statLeft, statRight, statDistinct
    if (displayOptions.wholeReport) {
        statTotal = res.total
        statEqual = res.equal
        statLeft = res.left
        statRight = res.right
        statDistinct = res.distinct
    } else {
        const brokenLInksStats = res.brokenLinks
        statTotal = res.totalFiles + brokenLInksStats.totalBrokenLinks
        statEqual = res.equalFiles
        statLeft = res.leftFiles + brokenLInksStats.leftBrokenLinks
        statRight = res.rightFiles + brokenLInksStats.rightBrokenLinks
        statDistinct = res.distinctFiles + brokenLInksStats.distinctBrokenLinks
    }
    if (!displayOptions.noDiffIndicator) {
        writer.write(res.same ? 'Entries are identical\n' : 'Entries are different\n')
    }
    let permissionDeniedStats = ''
    if (res.permissionDenied.totalPermissionDenied > 0) {
        permissionDeniedStats = `, permission denied: {left: ${res.permissionDenied.leftPermissionDenied}, right: ${res.permissionDenied.rightPermissionDenied}, distinct: ${res.permissionDenied.distinctPermissionDenied}, total: ${res.permissionDenied.totalPermissionDenied}}`
    }
    let stats = util.format('total: %s, equal: %s, distinct: %s, only left: %s, only right: %s%s',
        statTotal,
        statEqual,
        statDistinct,
        statLeft,
        statRight,
        permissionDeniedStats
    )
    if (res.brokenLinks.totalBrokenLinks > 0) {
        stats += util.format(', broken links: %s', res.brokenLinks.totalBrokenLinks)
    }
    stats += '\n'
    writer.write(stats)
}

/**
 * Print details for default view mode
 */
function printPretty(writer, displayOptions, detail) {
    const path = detail.relativePath === '' ? PATH_SEP : detail.relativePath

    let state
    switch (detail.state) {
        case 'equal':
            state = '=='
            break
        case 'left':
            state = '->'
            break
        case 'right':
            state = '<-'
            break
        case 'distinct':
            state = '<>'
            break
        default:
            state = '?'
    }
    let type = ''
    type = detail.type1 !== 'missing' ? detail.type1 : detail.type2
    const cmpEntry = getCompareFile(detail, state)
    let reason = ''
    if (displayOptions.reason && detail.reason) {
        reason = util.format(' <%s>', detail.reason)
    }
    let permissionDeniedState = ''
    if (detail.permissionDeniedState && detail.permissionDeniedState !== 'access-ok') {
        permissionDeniedState = ` EACCES: ${detail.permissionDeniedState} `
    }
    if (displayOptions.wholeReport || type === 'broken-link') {
        writer.write(util.format('[%s] %s (%s)%s%s\n', path, cmpEntry, type, reason, permissionDeniedState))
    } else {
        writer.write(util.format('[%s] %s%s%s\n', path, cmpEntry, reason, permissionDeniedState))
    }
}

function getCompareFile(detail, state) {
    const p1 = detail.name1 ? detail.name1 : ''
    const p2 = detail.name2 ? detail.name2 : ''
    const missing1 = detail.type1 === 'missing' ? 'missing' : ''
    const missing2 = detail.type2 === 'missing' ? 'missing' : ''
    return util.format('%s%s %s %s%s', missing1, p1, state, missing2, p2)
}

/**
 * Print csv details.
 */
function printCsv(writer, detail) {
    let size1 = '', size2 = ''
    if (detail.type1 === 'file') {
        size1 = detail.size1 !== undefined ? detail.size1 : ''
    }
    if (detail.type2 === 'file') {
        size2 = detail.size2 !== undefined ? detail.size2 : ''
    }

    const date1 = detail.date1 !== undefined ? detail.date1.toISOString() : ''
    const date2 = detail.date2 !== undefined ? detail.date2.toISOString() : ''

    let type = ''
    type = detail.type1 !== 'missing' ? detail.type1 : detail.type2

    const path = detail.relativePath ? detail.relativePath : PATH_SEP
    const name = (detail.name1 ? detail.name1 : detail.name2)
    const reason = detail.reason || ''

    writer.write(util.format('%s,%s,%s,%s,%s,%s,%s,%s,%s\n', path, name, detail.state, type, size1, size2, date1, date2, reason))
}

module.exports = print

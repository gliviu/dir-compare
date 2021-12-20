import { BrokenLinksStatistics, InitialStatistics, PermissionDeniedStatistics, Statistics, SymlinkStatistics } from ".."
import { ExtOptions } from "../ExtOptions"

/**
 * Controls creation/completion of global statistics object.
 */
export const StatisticsLifecycle = {
    initStats(options: ExtOptions): InitialStatistics {
        let symlinkStatistics: SymlinkStatistics | undefined = undefined
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
        const brokenLinksStatistics: BrokenLinksStatistics = {
            leftBrokenLinks: 0,
            rightBrokenLinks: 0,
            distinctBrokenLinks: 0,
            totalBrokenLinks: 0
        }
        const permissionDeniedStatistics: PermissionDeniedStatistics = {
            leftPermissionDenied: 0,
            rightPermissionDenied: 0,
            distinctPermissionDenied: 0,
            totalPermissionDenied: 0
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
            brokenLinks: brokenLinksStatistics,
            symlinks: symlinkStatistics,
            permissionDenied: permissionDeniedStatistics,
        }
    },

    completeStatistics(initialStatistics: InitialStatistics, options: ExtOptions): Statistics {
        const statistics: Statistics = JSON.parse(JSON.stringify(initialStatistics))
        
        statistics.differences = statistics.distinct + statistics.left + statistics.right
        statistics.differencesFiles = statistics.distinctFiles + statistics.leftFiles + statistics.rightFiles
        statistics.differencesDirs = statistics.distinctDirs + statistics.leftDirs + statistics.rightDirs
        statistics.total = statistics.equal + statistics.differences
        statistics.totalFiles = statistics.equalFiles + statistics.differencesFiles
        statistics.totalDirs = statistics.equalDirs + statistics.differencesDirs
        const brokenLInksStats = statistics.brokenLinks
        brokenLInksStats.totalBrokenLinks = brokenLInksStats.leftBrokenLinks + brokenLInksStats.rightBrokenLinks + brokenLInksStats.distinctBrokenLinks
        const permissionDeniedStats = statistics.permissionDenied
        permissionDeniedStats.totalPermissionDenied = permissionDeniedStats.leftPermissionDenied + permissionDeniedStats.rightPermissionDenied + permissionDeniedStats.distinctPermissionDenied
        statistics.same = statistics.differences ? false : true

        if (options.compareSymlink) {
            const symlinkStatistics = statistics.symlinks as SymlinkStatistics
            symlinkStatistics.differencesSymlinks = symlinkStatistics.distinctSymlinks +
                symlinkStatistics.leftSymlinks + symlinkStatistics.rightSymlinks
            symlinkStatistics.totalSymlinks = symlinkStatistics.differencesSymlinks + symlinkStatistics.equalSymlinks
        }

        return statistics
    }

}
import { DifferenceType, Entry, InitialStatistics, Options, PermissionDeniedState, Reason, SymlinkStatistics } from ".."
import { ExtOptions } from "../ExtOptions"

/**
 * Calculates comparison statistics.
 */
export const StatisticsUpdate = {
    updateStatisticsBoth(entry1: Entry, entry2: Entry, same: boolean, reason: Reason, type: DifferenceType,
        permissionDeniedState: PermissionDeniedState, statistics: InitialStatistics, options: ExtOptions): void {

        same ? statistics.equal++ : statistics.distinct++
        if (type === 'file') {
            same ? statistics.equalFiles++ : statistics.distinctFiles++
        } else if (type === 'directory') {
            same ? statistics.equalDirs++ : statistics.distinctDirs++
        } else if (type === 'broken-link') {
            statistics.brokenLinks.distinctBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        const isSymlink1 = entry1 ? entry1.isSymlink : false
        const isSymlink2 = entry2 ? entry2.isSymlink : false
        const isSymlink = isSymlink1 || isSymlink2
        if (options.compareSymlink && isSymlink) {
            const symlinkStatistics = statistics.symlinks as SymlinkStatistics
            if (reason === 'different-symlink') {
                symlinkStatistics.distinctSymlinks++
            } else {
                symlinkStatistics.equalSymlinks++
            }
        }

        if (permissionDeniedState === "access-error-left") {
            statistics.permissionDenied.leftPermissionDenied++
        } else if (permissionDeniedState === "access-error-right") {
            statistics.permissionDenied.rightPermissionDenied++
        } else if (permissionDeniedState === "access-error-both") {
            statistics.permissionDenied.distinctPermissionDenied++
        }
    },
    updateStatisticsLeft(entry1: Entry, type: DifferenceType, permissionDeniedState: PermissionDeniedState,
        statistics: InitialStatistics, options: ExtOptions): void {

        statistics.left++
        if (type === 'file') {
            statistics.leftFiles++
        } else if (type === 'directory') {
            statistics.leftDirs++
        } else if (type === 'broken-link') {
            statistics.brokenLinks.leftBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        if (options.compareSymlink && entry1.isSymlink) {
            const symlinkStatistics = statistics.symlinks as SymlinkStatistics
            symlinkStatistics.leftSymlinks++
        }

        if (permissionDeniedState === "access-error-left") {
            statistics.permissionDenied.leftPermissionDenied++
        }
    },
    updateStatisticsRight(entry2: Entry, type: DifferenceType, permissionDeniedState: PermissionDeniedState,
        statistics: InitialStatistics, options: Options): void {

        statistics.right++
        if (type === 'file') {
            statistics.rightFiles++
        } else if (type === 'directory') {
            statistics.rightDirs++
        } else if (type === 'broken-link') {
            statistics.brokenLinks.rightBrokenLinks++
        } else {
            throw new Error('Unexpected type ' + type)
        }

        if (options.compareSymlink && entry2.isSymlink) {
            const symlinkStatistics = statistics.symlinks as SymlinkStatistics
            symlinkStatistics.rightSymlinks++
        }

        if (permissionDeniedState === "access-error-right") {
            statistics.permissionDenied.rightPermissionDenied++
        }
    },
}
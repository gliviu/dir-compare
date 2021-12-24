import fs from 'fs'
import pathUtils from 'path'
import { Entry, InitialStatistics, OptionalDiffSet } from '.'
import { ExtOptions } from './ExtOptions'
import { EntryEquality } from './Entry/EntryEquality'
import { EntryBuilder } from './Entry/EntryBuilder'
import { LoopDetector, SymlinkCache } from './Symlink/LoopDetector'
import { EntryComparator } from './Entry/EntryComparator'
import { EntryType, OptionalEntry } from './Entry/EntryType'
import { Permission } from './Permission/Permission'
import { StatisticsUpdate } from './Statistics/StatisticsUpdate'

/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(rootEntry: OptionalEntry, relativePath: string, loopDetected: boolean,
    options: ExtOptions): Entry[] {

    if (!rootEntry || loopDetected) {
        return []
    }
    if (rootEntry.isDirectory) {
        if (rootEntry.isPermissionDenied) {
            return []
        }
        const entries = fs.readdirSync(rootEntry.absolutePath)
        return EntryBuilder.buildDirEntries(rootEntry, entries, relativePath, options)
    }
    return [rootEntry]
}

/**
 * Compares two directories synchronously.
 */
export function compareSync(rootEntry1: OptionalEntry, rootEntry2: OptionalEntry, level: number, relativePath: string,
    options: ExtOptions, statistics: InitialStatistics, diffSet: OptionalDiffSet, symlinkCache: SymlinkCache): void {

    const loopDetected1 = LoopDetector.detectLoop(rootEntry1, symlinkCache.dir1)
    const loopDetected2 = LoopDetector.detectLoop(rootEntry2, symlinkCache.dir2)
    LoopDetector.updateSymlinkCache(symlinkCache, rootEntry1, rootEntry2, loopDetected1, loopDetected2)

    const entries1 = getEntries(rootEntry1, relativePath, loopDetected1, options)
    const entries2 = getEntries(rootEntry2, relativePath, loopDetected2, options)
    let i1 = 0, i2 = 0
    while (i1 < entries1.length || i2 < entries2.length) {
        const entry1 = entries1[i1]
        const entry2 = entries2[i2]
        let type1, type2

        // compare entry name (-1, 0, 1)
        let cmp
        if (i1 < entries1.length && i2 < entries2.length) {
            cmp = EntryComparator.compareEntry(entry1, entry2, options)
            type1 = EntryType.getType(entry1)
            type2 = EntryType.getType(entry2)
        } else if (i1 < entries1.length) {
            type1 = EntryType.getType(entry1)
            type2 = EntryType.getType(undefined)
            cmp = -1
        } else {
            type1 = EntryType.getType(undefined)
            type2 = EntryType.getType(entry2)
            cmp = 1
        }

        // process entry
        if (cmp === 0) {
            // Both left/right exist and have the same name and type
            let same, reason, state
            const permissionDeniedState = Permission.getPermissionDeniedState(entry1, entry2)

            if (permissionDeniedState === "access-ok") {
                const compareEntryRes = EntryEquality.isEntryEqualSync(entry1, entry2, type1, options)
                state = compareEntryRes.same ? 'equal' : 'distinct'
                same = compareEntryRes.same
                reason = compareEntryRes.reason
            } else {
                state = 'distinct'
                same = false
                reason = "permission-denied"
            }


            options.resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet, reason, permissionDeniedState)
            StatisticsUpdate.updateStatisticsBoth(entry1, entry2, same, reason, type1, permissionDeniedState, statistics, options)
            i1++
            i2++
            if (!options.skipSubdirs && type1 === 'directory') {
                compareSync(entry1, entry2, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, LoopDetector.cloneSymlinkCache(symlinkCache))
            }
        } else if (cmp < 0) {
            // Right missing
            const permissionDeniedState = Permission.getPermissionDeniedStateWhenRightMissing(entry1)
            options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet, undefined, permissionDeniedState)
            StatisticsUpdate.updateStatisticsLeft(entry1, type1, permissionDeniedState, statistics, options)
            i1++
            if (type1 === 'directory' && !options.skipSubdirs) {
                compareSync(entry1, undefined, level + 1, pathUtils.join(relativePath, entry1.name), options, statistics, diffSet, LoopDetector.cloneSymlinkCache(symlinkCache))
            }
        } else {
            // Left missing
            const permissionDeniedState = Permission.getPermissionDeniedStateWhenLeftMissing(entry2)
            options.resultBuilder(undefined, entry2, "right", level, relativePath, options, statistics, diffSet, undefined, permissionDeniedState)
            StatisticsUpdate.updateStatisticsRight(entry2, type2, permissionDeniedState, statistics, options)
            i2++
            if (type2 === 'directory' && !options.skipSubdirs) {
                compareSync(undefined, entry2, level + 1, pathUtils.join(relativePath, entry2.name), options, statistics, diffSet, LoopDetector.cloneSymlinkCache(symlinkCache))
            }
        }
    }
}


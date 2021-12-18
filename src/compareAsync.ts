import entryBuilder from './entry/entryBuilder'
import entryEquality from './entry/entryEquality'
import stats from './statistics/statisticsUpdate'
import pathUtils from 'path'
import fsPromise from './fs/fsPromise'
import loopDetector from './symlink/loopDetector'
import entryComparator from './entry/entryComparator'
import entryType from './entry/entryType'
import { getPermissionDeniedStateWhenLeftMissing, getPermissionDeniedStateWhenRightMissing, getPermissionDeniedState } from './permissions/permissionDeniedState'
import { OptionalEntry } from './types/OptionalEntry'
import { ExtOptions } from './types/ExtOptions'
import { DifferenceType, DiffSet, Entry, InitialStatistics } from '.'
import { SymlinkCache } from './symlink/types/SymlinkCache'
import { SamePromise } from './entry/types/SamePromise'

/**
 * Returns the sorted list of entries in a directory.
 */
function getEntries(rootEntry: OptionalEntry, relativePath: string, loopDetected: boolean,
    options: ExtOptions): Promise<Entry[]> {

    if (!rootEntry || loopDetected) {
        return Promise.resolve([])
    }
    if (rootEntry.isDirectory) {
        if (rootEntry.isPermissionDenied) {
            return Promise.resolve([])
        }
        return fsPromise.readdir(rootEntry.absolutePath)
            .then(entries => entryBuilder.buildDirEntries(rootEntry, entries, relativePath, options))
    }
    return Promise.resolve([rootEntry])
}

/**
 * Compares two directories asynchronously.
 */
export = function compare(rootEntry1: OptionalEntry, rootEntry2: OptionalEntry, level: number, relativePath: string,
    options: ExtOptions, statistics: InitialStatistics, diffSet: DiffSet, symlinkCache: SymlinkCache): Promise<void> {

    const loopDetected1 = loopDetector.detectLoop(rootEntry1, symlinkCache.dir1)
    const loopDetected2 = loopDetector.detectLoop(rootEntry2, symlinkCache.dir2)
    loopDetector.updateSymlinkCache(symlinkCache, rootEntry1, rootEntry2, loopDetected1, loopDetected2)

    return Promise.all([getEntries(rootEntry1, relativePath, loopDetected1, options), getEntries(rootEntry2, relativePath, loopDetected2, options)])
        .then(entriesResult => {
            const entries1 = entriesResult[0]
            const entries2 = entriesResult[1]
            let i1 = 0, i2 = 0
            const comparePromises: Promise<void>[] = []
            const compareFilePromises: Promise<SamePromise>[] = []
            let subDiffSet

            while (i1 < entries1.length || i2 < entries2.length) {
                const entry1 = entries1[i1]
                const entry2 = entries2[i2]
                let type1, type2

                // compare entry name (-1, 0, 1)
                let cmp
                if (i1 < entries1.length && i2 < entries2.length) {
                    cmp = entryComparator.compareEntry(entry1, entry2, options)
                    type1 = entryType.getType(entry1)
                    type2 = entryType.getType(entry2)
                } else if (i1 < entries1.length) {
                    type1 = entryType.getType(entry1)
                    type2 = entryType.getType(undefined)
                    cmp = -1
                } else {
                    type1 = entryType.getType(undefined)
                    type2 = entryType.getType(entry2)
                    cmp = 1
                }

                // process entry
                if (cmp === 0) {
                    // Both left/right exist and have the same name and type
                    const permissionDeniedState = getPermissionDeniedState(entry1, entry2)

                    if (permissionDeniedState === "access-ok") {
                        const compareEntryRes = entryEquality.isEntryEqualAsync(entry1, entry2, type1, diffSet, options)
                        const samePromise = compareEntryRes.samePromise
                        const same = compareEntryRes.same
                        if (same !== undefined) {
                            options.resultBuilder(entry1, entry2,
                                same ? 'equal' : 'distinct',
                                level, relativePath, options, statistics, diffSet,
                                compareEntryRes.reason, permissionDeniedState)
                            stats.updateStatisticsBoth(entry1, entry2, same, compareEntryRes.reason, type1, permissionDeniedState, statistics, options)
                        } else {
                            compareFilePromises.push(samePromise as Promise<SamePromise>)
                        }
                    } else {
                        const state = 'distinct'
                        const reason = "permission-denied"
                        const same = false
                        options.resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet, reason, permissionDeniedState)
                        stats.updateStatisticsBoth(entry1, entry2, same, reason, type1, permissionDeniedState, statistics, options)
                    }

                    i1++
                    i2++
                    if (!options.skipSubdirs && type1 === 'directory') {
                        if (!options.noDiffSet) {
                            subDiffSet = []
                            diffSet.push(subDiffSet)
                        }
                        comparePromises.push(compare(entry1, entry2, level + 1,
                            pathUtils.join(relativePath, entry1.name),
                            options, statistics, subDiffSet, loopDetector.cloneSymlinkCache(symlinkCache)))
                    }
                } else if (cmp < 0) {
                    // Right missing
                    const permissionDeniedState = getPermissionDeniedStateWhenRightMissing(entry1)
                    options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, diffSet, undefined, permissionDeniedState)
                    stats.updateStatisticsLeft(entry1, type1, permissionDeniedState, statistics, options)
                    i1++
                    if (type1 === 'directory' && !options.skipSubdirs) {
                        if (!options.noDiffSet) {
                            subDiffSet = []
                            diffSet.push(subDiffSet)
                        }
                        comparePromises.push(compare(entry1, undefined,
                            level + 1,
                            pathUtils.join(relativePath, entry1.name), options, statistics, subDiffSet, loopDetector.cloneSymlinkCache(symlinkCache)))
                    }
                } else {
                    // Left missing
                    const permissionDeniedState = getPermissionDeniedStateWhenLeftMissing(entry2)
                    options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, diffSet, undefined, permissionDeniedState)
                    stats.updateStatisticsRight(entry2, type2, permissionDeniedState, statistics, options)
                    i2++
                    if (type2 === 'directory' && !options.skipSubdirs) {
                        if (!options.noDiffSet) {
                            subDiffSet = []
                            diffSet.push(subDiffSet)
                        }
                        comparePromises.push(compare(undefined, entry2,
                            level + 1,
                            pathUtils.join(relativePath, entry2.name), options, statistics, subDiffSet, loopDetector.cloneSymlinkCache(symlinkCache)))
                    }
                }
            }
            return Promise.all(comparePromises)
                .then(() => Promise.all(compareFilePromises)
                    .then(sameResults => {
                        for (let i = 0; i < sameResults.length; i++) {
                            const sameResult = sameResults[i]
                            if (sameResult.error) {
                                return Promise.reject(sameResult.error)
                            } else {
                                const permissionDeniedState = "access-ok"
                                options.resultBuilder(sameResult.entry1, sameResult.entry2,
                                    sameResult.same ? 'equal' : 'distinct',
                                    level, relativePath, options, statistics, sameResult.diffSet,
                                    sameResult.reason, permissionDeniedState)
                                stats.updateStatisticsBoth(sameResult.entry1 as Entry, sameResult.entry2 as Entry, sameResult.same as boolean,
                                    sameResult.reason, sameResult.type1 as DifferenceType, permissionDeniedState, statistics, options)
                            }
                        }
                    }))
        })
}


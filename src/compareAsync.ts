import pathUtils from 'path'
import { ExtOptions } from './ExtOptions'
import { Difference, DiffSet, Entry, InitialStatistics } from '.'
import { EntryEquality, FileEqualityAsync } from './Entry/EntryEquality'
import { FsPromise } from './FileSystem/FsPromise'
import { EntryBuilder } from './Entry/EntryBuilder'
import { LoopDetector, SymlinkCache } from './Symlink/LoopDetector'
import { EntryComparator } from './Entry/EntryComparator'
import { EntryType, OptionalEntry } from './Entry/EntryType'
import { Permission } from './Permission/Permission'
import { StatisticsUpdate } from './Statistics/StatisticsUpdate'
import pLimit from 'p-limit'

/**
 * Limits concurrent promises.
 */
const CONCURRENCY = 2

/**
 * List of differences occurred during comparison.
 * Async DiffSets are kept into recursive structures.
 */
export type AsyncDiffSet = Array<Difference | AsyncDiffSet>

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
        return FsPromise.readdir(rootEntry.absolutePath)
            .then(entries => EntryBuilder.buildDirEntries(rootEntry, entries, relativePath, options))
    }
    return Promise.resolve([rootEntry])
}

/**
 * Compares two directories asynchronously.
 */
export function compareAsync(rootEntry1: OptionalEntry, rootEntry2: OptionalEntry, level: number, relativePath: string,
    options: ExtOptions, statistics: InitialStatistics, asyncDiffSet: AsyncDiffSet, symlinkCache: SymlinkCache): Promise<void> {

    const limit = pLimit(CONCURRENCY)
    const loopDetected1 = LoopDetector.detectLoop(rootEntry1, symlinkCache.dir1)
    const loopDetected2 = LoopDetector.detectLoop(rootEntry2, symlinkCache.dir2)
    LoopDetector.updateSymlinkCache(symlinkCache, rootEntry1, rootEntry2, loopDetected1, loopDetected2)

    return Promise.all([getEntries(rootEntry1, relativePath, loopDetected1, options), getEntries(rootEntry2, relativePath, loopDetected2, options)])
        .then(entriesResult => {
            const entries1 = entriesResult[0]
            const entries2 = entriesResult[1]
            let i1 = 0, i2 = 0
            const comparePromises: Promise<void>[] = []
            const fileEqualityAsyncPromises: Promise<FileEqualityAsync>[] = []

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
                    const permissionDeniedState = Permission.getPermissionDeniedState(entry1, entry2)

                    if (permissionDeniedState === "access-ok") {
                        const compareEntryRes = EntryEquality.isEntryEqualAsync(entry1, entry2, type1, asyncDiffSet, options)
                        if (compareEntryRes.isSync) {
                            options.resultBuilder(entry1, entry2,
                                compareEntryRes.same ? 'equal' : 'distinct',
                                level, relativePath, options, statistics, asyncDiffSet as DiffSet,
                                compareEntryRes.reason, permissionDeniedState)
                            StatisticsUpdate.updateStatisticsBoth(entry1, entry2, compareEntryRes.same, compareEntryRes.reason,
                                type1, permissionDeniedState, statistics, options)
                        } else {
                            fileEqualityAsyncPromises.push(compareEntryRes.fileEqualityAsyncPromise)
                        }
                    } else {
                        const state = 'distinct'
                        const reason = "permission-denied"
                        const same = false
                        options.resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, asyncDiffSet as DiffSet, reason, permissionDeniedState)
                        StatisticsUpdate.updateStatisticsBoth(entry1, entry2, same, reason, type1, permissionDeniedState, statistics, options)
                    }

                    i1++
                    i2++
                    if (!options.skipSubdirs && type1 === 'directory') {
                        const subDiffSet: AsyncDiffSet = []
                        if (!options.noDiffSet) {
                            asyncDiffSet.push(subDiffSet)
                        }
                        const comparePromise = limit(() => compareAsync(entry1, entry2, level + 1,
                            pathUtils.join(relativePath, entry1.name),
                            options, statistics, subDiffSet, LoopDetector.cloneSymlinkCache(symlinkCache)))
                        comparePromises.push(comparePromise)
                    }
                } else if (cmp < 0) {
                    // Right missing
                    const permissionDeniedState = Permission.getPermissionDeniedStateWhenRightMissing(entry1)
                    options.resultBuilder(entry1, undefined, 'left', level, relativePath, options, statistics, asyncDiffSet as DiffSet, undefined, permissionDeniedState)
                    StatisticsUpdate.updateStatisticsLeft(entry1, type1, permissionDeniedState, statistics, options)
                    i1++
                    if (type1 === 'directory' && !options.skipSubdirs) {
                        const subDiffSet: AsyncDiffSet = []
                        if (!options.noDiffSet) {
                            asyncDiffSet.push(subDiffSet)
                        }
                        const comparePromise = limit(() => compareAsync(entry1, undefined,
                            level + 1,
                            pathUtils.join(relativePath, entry1.name), options, statistics, subDiffSet, LoopDetector.cloneSymlinkCache(symlinkCache)))
                        comparePromises.push(comparePromise)
                    }
                } else {
                    // Left missing
                    const permissionDeniedState = Permission.getPermissionDeniedStateWhenLeftMissing(entry2)
                    options.resultBuilder(undefined, entry2, 'right', level, relativePath, options, statistics, asyncDiffSet as DiffSet, undefined, permissionDeniedState)
                    StatisticsUpdate.updateStatisticsRight(entry2, type2, permissionDeniedState, statistics, options)
                    i2++
                    if (type2 === 'directory' && !options.skipSubdirs) {
                        const subDiffSet: AsyncDiffSet = []
                        if (!options.noDiffSet) {
                            asyncDiffSet.push(subDiffSet)
                        }
                        const comparePromise = limit(() => compareAsync(undefined, entry2,
                            level + 1,
                            pathUtils.join(relativePath, entry2.name), options, statistics, subDiffSet, LoopDetector.cloneSymlinkCache(symlinkCache)))
                        comparePromises.push(comparePromise)
                    }
                }
            }
            return Promise.all(comparePromises)
                .then(() => Promise.all(fileEqualityAsyncPromises)
                    .then(fileEqualityAsyncResults => {
                        for (let i = 0; i < fileEqualityAsyncResults.length; i++) {
                            const fileEqualityAsync = fileEqualityAsyncResults[i]
                            if (fileEqualityAsync.hasErrors) {
                                return Promise.reject(fileEqualityAsync.error)
                            }
                            const permissionDeniedState = "access-ok"
                            options.resultBuilder(fileEqualityAsync.context.entry1, fileEqualityAsync.context.entry2,
                                fileEqualityAsync.same ? 'equal' : 'distinct',
                                level, relativePath, options, statistics, fileEqualityAsync.context.asyncDiffSet as DiffSet,
                                fileEqualityAsync.reason, permissionDeniedState)
                            StatisticsUpdate.updateStatisticsBoth(fileEqualityAsync.context.entry1, fileEqualityAsync.context.entry2, fileEqualityAsync.same,
                                fileEqualityAsync.reason, fileEqualityAsync.context.type1, permissionDeniedState, statistics, options)
                        }
                    }))
        })
}


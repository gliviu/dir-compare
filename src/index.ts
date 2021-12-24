import pathUtils from 'path'
import fs from 'fs'
import { compareSync as compareSyncInternal } from './compareSync'
import { AsyncDiffSet, compareAsync as compareAsyncInternal } from './compareAsync'
import { defaultFileCompare } from './FileCompareHandler/default/defaultFileCompare'
import { lineBasedFileCompare } from './FileCompareHandler/lines/lineBasedFileCompare'
import { defaultNameCompare } from './NameCompare/defaultNameCompare'
import { Options, Result, Statistics, InitialStatistics, DiffSet, OptionalDiffSet, FileCompareHandlers, DifferenceType } from './types'
import { ExtOptions } from './ExtOptions'
import { EntryBuilder } from './Entry/EntryBuilder'
import { StatisticsLifecycle } from './Statistics/StatisticsLifecycle'
import { LoopDetector } from './Symlink/LoopDetector'
import { defaultResultBuilderCallback } from './ResultBuilder/defaultResultBuilderCallback'
import { fileBasedNameCompare } from './NameCompare/fileBasedNameCompare'

const ROOT_PATH = pathUtils.sep

export * from './types'

/**
 * Synchronously compares given paths.
 * @param path1 Left file or directory to be compared.
 * @param path2 Right file or directory to be compared.
 * @param options Comparison options.
 */
export function compareSync(path1: string, path2: string, options?: Options): Result {
    // realpathSync() is necessary for loop detection to work properly
    const absolutePath1 = pathUtils.normalize(pathUtils.resolve(fs.realpathSync(path1)))
    const absolutePath2 = pathUtils.normalize(pathUtils.resolve(fs.realpathSync(path2)))
    const compareInfo = getCompareInfo(absolutePath1, absolutePath2)
    const extOptions = prepareOptions(compareInfo, options)

    let diffSet: OptionalDiffSet
    if (!extOptions.noDiffSet) {
        diffSet = []
    }
    const initialStatistics = StatisticsLifecycle.initStats(extOptions)

    if (compareInfo.mode === 'mixed') {
        compareMixedEntries(absolutePath1, absolutePath2, diffSet, initialStatistics, compareInfo)
    } else {
        compareSyncInternal(
            EntryBuilder.buildEntry(absolutePath1, path1, pathUtils.basename(absolutePath1), extOptions),
            EntryBuilder.buildEntry(absolutePath2, path2, pathUtils.basename(absolutePath2), extOptions),
            0, ROOT_PATH, extOptions, initialStatistics, diffSet, LoopDetector.initSymlinkCache())
    }

    const result: Result = StatisticsLifecycle.completeStatistics(initialStatistics, extOptions)
    result.diffSet = diffSet

    return result
}

/**
 * Asynchronously compares given paths.
 * @param path1 Left file or directory to be compared.
 * @param path2 Right file or directory to be compared.
 * @param extOptions Comparison options.
 */
export function compare(path1: string, path2: string, options?: Options): Promise<Result> {
    let absolutePath1, absolutePath2
    return Promise.resolve()
        .then(() => Promise.all([wrapper.realPath(path1), wrapper.realPath(path2)]))
        .then(realPaths => {
            const realPath1 = realPaths[0]
            const realPath2 = realPaths[1]
            // realpath() is necessary for loop detection to work properly
            absolutePath1 = pathUtils.normalize(pathUtils.resolve(realPath1))
            absolutePath2 = pathUtils.normalize(pathUtils.resolve(realPath2))
        })
        .then(() => {
            const compareInfo = getCompareInfo(absolutePath1, absolutePath2)
            const extOptions = prepareOptions(compareInfo, options)
            const asyncDiffSet: AsyncDiffSet = []
            const initialStatistics = StatisticsLifecycle.initStats(extOptions)
            if (compareInfo.mode === 'mixed') {
                let diffSet: OptionalDiffSet
                if (!extOptions.noDiffSet) {
                    diffSet = []
                }
                compareMixedEntries(absolutePath1, absolutePath2, diffSet, initialStatistics, compareInfo)
                const result: Result = StatisticsLifecycle.completeStatistics(initialStatistics, extOptions)
                result.diffSet = diffSet
                return result
            }
            return compareAsyncInternal(
                EntryBuilder.buildEntry(absolutePath1, path1, pathUtils.basename(absolutePath1), extOptions),
                EntryBuilder.buildEntry(absolutePath2, path2, pathUtils.basename(absolutePath2), extOptions),
                0, ROOT_PATH, extOptions, initialStatistics, asyncDiffSet, LoopDetector.initSymlinkCache())
                .then(() => {
                    const result: Result = StatisticsLifecycle.completeStatistics(initialStatistics, extOptions)
                    if (!extOptions.noDiffSet) {
                        const diffSet = []
                        rebuildAsyncDiffSet(result, asyncDiffSet, diffSet)
                        result.diffSet = diffSet
                    }
                    return result
                })
        })
}

/**
 * File content comparison handlers.
 * These comparators are included with dir-compare.
 * 
 * The `defaultFileCompare` is used when {@link Options.compareContent} is enabled 
 * and {@link Options.compareFileSync} or {@link Options.compareFileAsync} are sent as `undefined`.
 * 
 * See [Custom file content comparators](https://github.com/gliviu/dir-compare#custom-file-content-comparators) for details.
 */
export const fileCompareHandlers: FileCompareHandlers = {
    defaultFileCompare,
    lineBasedFileCompare
}

type RealPathOptions = { encoding?: BufferEncoding | null } | BufferEncoding

const wrapper = {
    realPath(path: string, options?: RealPathOptions): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.realpath(path, options, (err, resolvedPath) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(resolvedPath)
                }
            })
        })
    }
}

function prepareOptions(compareInfo: CompareInfo, options?: Options): ExtOptions {
    options = options || {}
    const clone: Options = JSON.parse(JSON.stringify(options))
    clone.resultBuilder = options.resultBuilder
    clone.compareFileSync = options.compareFileSync
    clone.compareFileAsync = options.compareFileAsync
    clone.compareNameHandler = options.compareNameHandler
    if (!clone.resultBuilder) {
        clone.resultBuilder = defaultResultBuilderCallback
    }
    if (!clone.compareFileSync) {
        clone.compareFileSync = defaultFileCompare.compareSync
    }
    if (!clone.compareFileAsync) {
        clone.compareFileAsync = defaultFileCompare.compareAsync
    }
    if (!clone.compareNameHandler) {
        const isFileBasedCompare = compareInfo.mode === 'files'
        clone.compareNameHandler = isFileBasedCompare ? fileBasedNameCompare : defaultNameCompare
    }
    clone.dateTolerance = clone.dateTolerance || 1000
    clone.dateTolerance = Number(clone.dateTolerance)
    if (isNaN(clone.dateTolerance)) {
        throw new Error('Date tolerance is not a number')
    }
    return clone as ExtOptions
}


// Async DiffSets are kept into recursive structures.
// This method transforms them into one dimensional arrays.
function rebuildAsyncDiffSet(statistics: Statistics, asyncDiffSet: AsyncDiffSet, diffSet: DiffSet): void {
    asyncDiffSet.forEach(rawDiff => {
        if (!Array.isArray(rawDiff)) {
            diffSet.push(rawDiff)
        } else {
            rebuildAsyncDiffSet(statistics, rawDiff, diffSet)
        }
    })
}


type CompareInfo = {
    mode: 'directories' | 'files' | 'mixed'
    type1: DifferenceType
    type2: DifferenceType
    size1: number
    size2: number
    date1: Date
    date2: Date
}

function getCompareInfo(path1: string, path2: string): CompareInfo {
    const stat1 = fs.lstatSync(path1)
    const stat2 = fs.lstatSync(path2)
    if (stat1.isDirectory() && stat2.isDirectory()) {
        return {
            mode: 'directories',
            type1: 'directory',
            type2: 'directory',
            size1: stat1.size,
            size2: stat2.size,
            date1: stat1.mtime,
            date2: stat2.mtime,
        }
    }
    if (stat1.isFile() && stat2.isFile()) {
        return {
            mode: 'files',
            type1: 'file',
            type2: 'file',
            size1: stat1.size,
            size2: stat2.size,
            date1: stat1.mtime,
            date2: stat2.mtime,
        }
    }
    return {
        mode: 'mixed',
        type1: stat1.isFile() ? 'file' : 'directory',
        type2: stat2.isFile() ? 'file' : 'directory',
        size1: stat1.size,
        size2: stat2.size,
        date1: stat1.mtime,
        date2: stat2.mtime,
    }
}

/**
 * Normally dir-compare is used to compare either two directories or two files.
 * This method is used when one directory needs to be compared to a file.
 */
function compareMixedEntries(path1: string, path2: string, diffSet: OptionalDiffSet,
    initialStatistics: InitialStatistics, compareInfo: CompareInfo): void {
    initialStatistics.distinct = 2
    initialStatistics.distinctDirs = 1
    initialStatistics.distinctFiles = 1
    if (diffSet) {
        diffSet.push({
            path1,
            path2,
            relativePath: '',
            name1: pathUtils.basename(path1),
            name2: pathUtils.basename(path2),
            state: 'distinct',
            permissionDeniedState: 'access-ok',
            type1: compareInfo.type1,
            type2: compareInfo.type2,
            level: 0,
            size1: compareInfo.size1,
            size2: compareInfo.size2,
            date1: compareInfo.date1,
            date2: compareInfo.date2,
            reason: 'different-content',
        })
    }
}

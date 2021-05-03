import pathUtils from 'path'
import fs from 'fs'
import compareSyncInternal from './compareSync'
import compareAsyncInternal from './compareAsync'
import defaultResultBuilderCallback from './resultBuilder/defaultResultBuilderCallback'
import { defaultFileCompare } from './fileCompareHandler/default/defaultFileCompare'
import { lineBasedFileCompare } from './fileCompareHandler/lines/lineBasedFileCompare'
import defaultNameCompare from './nameCompare/defaultNameCompare'
import entryBuilder from './entry/entryBuilder'
import statsLifecycle from './statistics/statisticsLifecycle'
import loopDetector from './symlink/loopDetector'
import { Options, Result } from './types'
import { FileCompareHandlers } from './FileCompareHandlers'

const ROOT_PATH = pathUtils.sep

export * from './types'
export { FileCompareHandlers }

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
    let diffSet
    options = prepareOptions(options)
    if (!options.noDiffSet) {
        diffSet = []
    }
    const statistics = statsLifecycle.initStats(options)
    compareSyncInternal(
        entryBuilder.buildEntry(absolutePath1, path1, pathUtils.basename(absolutePath1), options),
        entryBuilder.buildEntry(absolutePath2, path2, pathUtils.basename(absolutePath2), options),
        0, ROOT_PATH, options, statistics, diffSet, loopDetector.initSymlinkCache())
    statsLifecycle.completeStatistics(statistics, options)
    statistics.diffSet = diffSet

    return statistics as unknown as Result
}

/**
 * Asynchronously compares given paths.
 * @param path1 Left file or directory to be compared.
 * @param path2 Right file or directory to be compared.
 * @param options Comparison options.
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
            options = prepareOptions(options)
            let asyncDiffSet
            if (!options.noDiffSet) {
                asyncDiffSet = []
            }
            const statistics = statsLifecycle.initStats(options)
            return compareAsyncInternal(
                entryBuilder.buildEntry(absolutePath1, path1, pathUtils.basename(path1), options),
                entryBuilder.buildEntry(absolutePath2, path2, pathUtils.basename(path2), options),
                0, ROOT_PATH, options, statistics, asyncDiffSet, loopDetector.initSymlinkCache())
                .then(() => {
                    statsLifecycle.completeStatistics(statistics, options)
                    if (!options?.noDiffSet) {
                        const diffSet = []
                        rebuildAsyncDiffSet(statistics, asyncDiffSet, diffSet)
                        statistics.diffSet = diffSet
                    }
                    return statistics
                })
        })
}

/**
 * File comparison handlers.
 * These handlers are used when [[Options.compareContent]] is set.
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

function prepareOptions(options?: Options): Options {
    options = options || {}
    const clone = JSON.parse(JSON.stringify(options))
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
        clone.compareNameHandler = defaultNameCompare
    }
    clone.dateTolerance = clone.dateTolerance || 1000
    clone.dateTolerance = Number(clone.dateTolerance)
    if (isNaN(clone.dateTolerance)) {
        throw new Error('Date tolerance is not a number')
    }
    return clone
}


// Async diffsets are kept into recursive structures.
// This method transforms them into one dimensional arrays.
function rebuildAsyncDiffSet(statistics, asyncDiffSet, diffSet) {
    asyncDiffSet.forEach(rawDiff => {
        if (!Array.isArray(rawDiff)) {
            diffSet.push(rawDiff)
        } else {
            rebuildAsyncDiffSet(statistics, rawDiff, diffSet)
        }
    })
}


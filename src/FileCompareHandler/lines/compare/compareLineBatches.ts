import { Options } from '../../../index'
import { LineBatch } from '../lineReader/LineBatch'
import { compareLines } from './compareLines'

interface RestLines {
    restLines1: string[]
    restLines2: string[]
}

interface CompareLineBatchResult {
    reachedEof: boolean
    batchIsEqual: boolean
    /**
     * Lines that were not compared because the two line batches
     * contained different number of lines.
     * These remaining lines will be compared in the next step. 
     */
    restLines: RestLines
}

/**
 * Compares two batches of lines.
 * 
 * @param lineBatch1 Batch to compare.
 * @param lineBatch2 Batch to compare.
 * @param context Comparison context.
 * @param options Comparison options.
 */
export function compareLineBatches(lineBatch1: LineBatch, lineBatch2: LineBatch, options: Options): CompareLineBatchResult {

    const compareResult = compareLines(lineBatch1.lines, lineBatch2.lines, options)
    if (!compareResult.isEqual) {
        return { batchIsEqual: false, reachedEof: false, restLines: emptyRestLines()}
    }

    const reachedEof = lineBatch1.reachedEof && lineBatch2.reachedEof
    const hasMoreLinesToProcess = compareResult.restLines1.length > 0 || compareResult.restLines2.length > 0
    if (reachedEof && hasMoreLinesToProcess) {
        return { batchIsEqual: false, reachedEof: true , restLines: emptyRestLines()}
    }

    if (reachedEof) {
        return { batchIsEqual: true, reachedEof: true , restLines: emptyRestLines()}
    }

    return { batchIsEqual: true, reachedEof: false, 
        restLines: {
            restLines1: compareResult.restLines1,
            restLines2: compareResult.restLines2,
        }
    }
}

function emptyRestLines(): RestLines{
    return {
        restLines1: [],
        restLines2: []
    }
}
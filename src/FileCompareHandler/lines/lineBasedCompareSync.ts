import fs from 'fs'
import { Options } from '../../index'
import { LineBasedCompareContext } from './LineBasedCompareContext'
import { compareLineBatches } from './compare/compareLineBatches'
import { readBufferedLines } from './lineReader/readBufferedLines'
import { BufferPair } from '../../FileSystem/BufferPool'
import { LineBatch } from './lineReader/LineBatch'
import { CompareFileSync } from '../../types'
import { FileCloser } from '../../FileSystem/FileCloser'

const BUF_SIZE = 100000

const bufferPair: BufferPair = {
    buf1: Buffer.alloc(BUF_SIZE),
    buf2: Buffer.alloc(BUF_SIZE),
    busy: true
}

export const lineBasedCompareSync: CompareFileSync = (path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): boolean =>  {
    const bufferSize = Math.min(BUF_SIZE, options.lineBasedHandlerBufferSize ?? Number.MAX_VALUE)
    let context: LineBasedCompareContext | undefined
    try {
        context = new LineBasedCompareContext(
            fs.openSync(path1, 'r'),
            fs.openSync(path2, 'r'),
            bufferPair
        )
        for (; ;) {
            const lineBatch1 = readLineBatchSync(context.fd1, context.buffer.buf1, bufferSize, context.rest.rest1, context.restLines.restLines1)
            const lineBatch2 = readLineBatchSync(context.fd2, context.buffer.buf2, bufferSize, context.rest.rest2, context.restLines.restLines2)

            context.rest.rest1 = lineBatch1.rest
            context.rest.rest2 = lineBatch2.rest
        
            const compareResult = compareLineBatches(lineBatch1, lineBatch2, options)
            if (!compareResult.batchIsEqual) {
                return false
            }
            if (compareResult.reachedEof) {
                return compareResult.batchIsEqual
            }

            context.restLines.restLines1 = compareResult.restLines.restLines1
            context.restLines.restLines2 = compareResult.restLines.restLines2
        }
    } finally {
        FileCloser.closeFilesSync(context?.fd1, context?.fd2)
    }
}

/**
 * Reads a batch of lines from file starting with current position.
 * 
 * @param fd File to read lines from.
 * @param buf Buffer used as temporary line storage.
 * @param bufferSize Allocated buffer size. The number of lines in the batch is limited by this size.
 * @param rest Part of a line that was split at buffer boundary in a previous read.
 *             Will be added to result.
 * @param restLines Lines that remain unprocessed from a previous read.
 *             Will be added to result.
 */
function readLineBatchSync(fd: number, buf: Buffer, bufferSize: number, rest: string, restLines: string[]): LineBatch {
    const size = fs.readSync(fd, buf, 0, bufferSize, null)
    return readBufferedLines(buf, size, bufferSize, rest, restLines)
}


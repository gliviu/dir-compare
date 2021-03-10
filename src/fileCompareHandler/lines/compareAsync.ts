/**
 * Compare files line by line with options to ignore
 * line endings and white space differences.
 */
import { FileDescriptorQueue } from '../../fs/FileDescriptorQueue'
import closeFiles from '../common/closeFile'
import fsPromise from '../../fs/fsPromise'
import common from './common'
import fs from 'fs'
import { Options } from '../..'
import { BufferPair } from '../../fs/BufferPool'

const closeFilesAsync = closeFiles.closeFilesAsync

const fdQueue = new FileDescriptorQueue(common.MAX_CONCURRENT_FILE_COMPARE * 2)

export default async function compareAsync(path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): Promise<boolean> {
    let fd1: number | undefined
    let fd2: number | undefined
    const bufferSize = options.lineBasedHandlerBufferSize || common.BUF_SIZE
    let bufferPair: BufferPair | undefined
    try {
        const fds = await Promise.all([fdQueue.openPromise(path1, 'r'), fdQueue.openPromise(path2, 'r')])
        bufferPair = common.bufferPool.allocateBuffers()
        fd1 = fds[0]
        fd2 = fds[1]
        const buf1 = bufferPair.buf1
        const buf2 = bufferPair.buf2
        let nextPosition1 = 0, nextPosition2 = 0
        for (; ;) {
            const lines1 = await readLinesAsync(fd1, buf1, bufferSize, nextPosition1)
            const lines2 = await readLinesAsync(fd2, buf2, bufferSize, nextPosition2)
            if (lines1.length === 0 && lines2.length === 0) {
                // End of file reached
                return true
            }
            const equalLines = common.compareLines(lines1, lines2, options)
            if (equalLines === 0) {
                return false
            }
            nextPosition1 += common.calculateSize(lines1, equalLines)
            nextPosition2 += common.calculateSize(lines2, equalLines)
        }
    } finally {
        if (bufferPair) {
            common.bufferPool.freeBuffers(bufferPair)
        }
        await closeFilesAsync(fd1, fd2, fdQueue)
    }
}

/**
 * Read lines from file starting with nextPosition.
 * Returns 0 lines if eof is reached, otherwise returns at least one complete line.
 */
async function readLinesAsync(fd: number, buf: Buffer, bufferSize: number, nextPosition: number): Promise<string[]> {
    let lines: string[] = []
    let chunk = ""
    for (; ;) {
        const size = await fsPromise.read(fd, buf, 0, bufferSize, nextPosition)
        if (size === 0) {
            // end of file
            common.normalizeLastFileLine(lines)
            return lines
        }
        chunk += buf.toString('utf8', 0, size)
        lines = chunk.match(common.LINE_TOKENIZER_REGEXP) as string[]
        if (lines.length > 1) {
            return common.removeLastIncompleteLine(lines)
        }
        nextPosition += size
    }
}


import fs from 'fs'
import { Options } from '../..'
import closeFiles from '../common/closeFile'
import common from './common'

const closeFilesSync = closeFiles.closeFilesSync

export default function compareSync(path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): boolean {
    let fd1: number | undefined
    let fd2: number | undefined
    const bufferPair = common.bufferPool.allocateBuffers()
    const bufferSize = options.lineBasedHandlerBufferSize || common.BUF_SIZE
    try {
        fd1 = fs.openSync(path1, 'r')
        fd2 = fs.openSync(path2, 'r')
        const buf1 = bufferPair.buf1
        const buf2 = bufferPair.buf2
        let nextPosition1 = 0, nextPosition2 = 0
        for (; ;) {
            const lines1 = readLinesSync(fd1, buf1, bufferSize, nextPosition1)
            const lines2 = readLinesSync(fd2, buf2, bufferSize, nextPosition2)
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
        closeFilesSync(fd1, fd2)
        common.bufferPool.freeBuffers(bufferPair)
    }
}

/**
 * Read lines from file starting with nextPosition.
 * Returns 0 lines if eof is reached, otherwise returns at least one complete line.
 */
function readLinesSync(fd: number, buf: Buffer, bufferSize: number, nextPosition: number): string[] {
    let lines: string[] = []
    let chunk = ""
    for (; ;) {
        const size = fs.readSync(fd, buf, 0, bufferSize, nextPosition)
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

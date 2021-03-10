import fs from 'fs'
import bufferEqual from 'buffer-equal'
import { FileDescriptorQueue } from '../../fs/FileDescriptorQueue'
import fsPromise from '../../fs/fsPromise'
import { BufferPair, BufferPool } from '../../fs/BufferPool'
import closeFile from '../../fs/closeFile'
import { Options } from '../../index'

const MAX_CONCURRENT_FILE_COMPARE = 8
const BUF_SIZE = 100000
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2)
const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE)  // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently


/**
 * Compares two files by content.
 */
function compareSync(path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): boolean {
    let fd1: number | undefined
    let fd2: number | undefined
    if (stat1.size !== stat2.size) {
        return false
    }
    const bufferPair = bufferPool.allocateBuffers()
    try {
        fd1 = fs.openSync(path1, 'r')
        fd2 = fs.openSync(path2, 'r')
        const buf1 = bufferPair.buf1
        const buf2 = bufferPair.buf2
        for (; ;) {
            const size1 = fs.readSync(fd1, buf1, 0, BUF_SIZE, null)
            const size2 = fs.readSync(fd2, buf2, 0, BUF_SIZE, null)
            if (size1 !== size2) {
                return false
            } else if (size1 === 0) {
                // End of file reached
                return true
            } else if (!compareBuffers(buf1, buf2, size1)) {
                return false
            }
        }
    } finally {
        closeFile.closeFilesSync(fd1, fd2)
        bufferPool.freeBuffers(bufferPair)
    }
}


/**
 * Compares two files by content
 */
function compareAsync(path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): Promise<boolean> {
    let fd1: number | undefined
    let fd2: number | undefined
    let bufferPair: BufferPair | undefined
    if (stat1.size !== stat2.size) {
        return Promise.resolve(false)
    }
    return Promise.all([fdQueue.openPromise(path1, 'r'), fdQueue.openPromise(path2, 'r')])
        .then(fds => {
            bufferPair = bufferPool.allocateBuffers()
            fd1 = fds[0]
            fd2 = fds[1]
            const buf1 = bufferPair.buf1
            const buf2 = bufferPair.buf2
            const compareAsyncInternal = () => Promise.all([
                fsPromise.read(fd1, buf1, 0, BUF_SIZE, null),
                fsPromise.read(fd2, buf2, 0, BUF_SIZE, null)
            ])
                .then((bufferSizes) => {
                    const size1 = bufferSizes[0]
                    const size2 = bufferSizes[1]
                    if (size1 !== size2) {
                        return false
                    } else if (size1 === 0) {
                        // End of file reached
                        return true
                    } else if (!compareBuffers(buf1, buf2, size1)) {
                        return false
                    } else {
                        return compareAsyncInternal()
                    }
                })
            return compareAsyncInternal()
        })
        .then(
            // 'finally' polyfill for node 8 and below
            res => finalizeAsync(fd1, fd2, bufferPair).then(() => res),
            err => finalizeAsync(fd1, fd2, bufferPair).then(() => { throw err })
        )
}

function compareBuffers(buf1: Buffer, buf2: Buffer, contentSize: number) {
    return bufferEqual(buf1.slice(0, contentSize), buf2.slice(0, contentSize))
}

function finalizeAsync(fd1?: number, fd2?: number, bufferPair?: BufferPair) {
    if (bufferPair) {
        bufferPool.freeBuffers(bufferPair)
    }
    return closeFile.closeFilesAsync(fd1, fd2, fdQueue)
}

export default {
    compareSync, compareAsync
}

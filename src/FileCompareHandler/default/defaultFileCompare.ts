import fs from 'fs'
import { FileDescriptorQueue } from '../../FileSystem/FileDescriptorQueue'
import { BufferPair, BufferPool } from '../../FileSystem/BufferPool'
import { Options } from '../../index'
import { CompareFileHandler } from '../../types'
import { FileCloser } from '../../FileSystem/FileCloser'
import { FsPromise } from '../../FileSystem/FsPromise'

const MAX_CONCURRENT_FILE_COMPARE = 8
const BUF_SIZE = 1000000
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2)
const asyncBufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE)  // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently
const syncBufferPool = new BufferPool(BUF_SIZE, 2)

export const defaultFileCompare: CompareFileHandler = {
    compareSync, compareAsync
}

/**
 * Compares two files by content.
 */
function compareSync(path1: string, stat1: fs.Stats, path2: string, stat2: fs.Stats, options: Options): boolean {
    let fd1: number | undefined
    let fd2: number | undefined
    if (stat1.size !== stat2.size) {
        return false
    }
    const bufferPair = syncBufferPool.allocateBuffers()
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
        FileCloser.closeFilesSync(fd1, fd2)
        syncBufferPool.freeBuffers(bufferPair)
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
    if (stat1.size < BUF_SIZE && !options.forceAsyncContentCompare) {
        return Promise.resolve(compareSync(path1, stat1, path2, stat2, options))
    }
    return Promise.all([fdQueue.openPromise(path1, 'r'), fdQueue.openPromise(path2, 'r')])
        .then(fds => {
            bufferPair = asyncBufferPool.allocateBuffers()
            fd1 = fds[0]
            fd2 = fds[1]
            const buf1 = bufferPair.buf1
            const buf2 = bufferPair.buf2
            const compareAsyncInternal = () => {
                return Promise.all([
                    FsPromise.read(fd1 as number, buf1, 0, BUF_SIZE, null),
                    FsPromise.read(fd2 as number, buf2, 0, BUF_SIZE, null)
                ]).then((bufferSizes) => {
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
            }
            return compareAsyncInternal()
        })
        .then(
            // 'finally' polyfill for node 8 and below
            res => finalizeAsync(fd1, fd2, bufferPair).then(() => res),
            err => finalizeAsync(fd1, fd2, bufferPair).then(() => { throw err })
        )
}

function compareBuffers(buf1: Buffer, buf2: Buffer, contentSize: number) {
    return buf1.slice(0, contentSize).equals(buf2.slice(0, contentSize))
}

function finalizeAsync(fd1?: number, fd2?: number, bufferPair?: BufferPair) {
    if (bufferPair) {
        asyncBufferPool.freeBuffers(bufferPair)
    }
    return FileCloser.closeFilesAsync(fd1, fd2, fdQueue)
}


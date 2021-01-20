/**
 * Compare files line by line with options to ignore
 * line endings and white space differencies.
 */
const fs = require('fs')
const FileDescriptorQueue = require('../fs/FileDescriptorQueue')
const closeFilesSync = require('./closeFile').closeFilesSync
const closeFilesAsync = require('./closeFile').closeFilesAsync
const fsPromise = require('../fs/fsPromise')
const BufferPool = require('../fs/BufferPool')

const LINE_TOKENIZER_REGEXP = /[^\n]+\n?|\n/g
const TRIM_LINE_ENDING_REGEXP = /\r\n$/g
const SPLIT_CONTENT_AND_LINE_ENDING_REGEXP = /([^\r\n]*)([\r\n]*)/
const TRIM_WHITE_SPACES_REGEXP = /^[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+|[ \f\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+$/g

const MAX_CONCURRENT_FILE_COMPARE = 8
const BUF_SIZE = 100000
const fdQueue = new FileDescriptorQueue(MAX_CONCURRENT_FILE_COMPARE * 2)
const bufferPool = new BufferPool(BUF_SIZE, MAX_CONCURRENT_FILE_COMPARE);  // fdQueue guarantees there will be no more than MAX_CONCURRENT_FILE_COMPARE async processes accessing the buffers concurrently

function compareSync(path1, stat1, path2, stat2, options) {
    let fd1, fd2
    const bufferPair = bufferPool.allocateBuffers()
    const bufferSize = options.lineBasedHandlerBufferSize || BUF_SIZE
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
            const equalLines = compareLines(lines1, lines2, options)
            if (equalLines === 0) {
                return false
            }
            nextPosition1 += calculateSize(lines1, equalLines)
            nextPosition2 += calculateSize(lines2, equalLines)
        }
    } finally {
        closeFilesSync(fd1, fd2)
        bufferPool.freeBuffers(bufferPair)
    }
}

async function compareAsync(path1, stat1, path2, stat2, options) {
    let fd1, fd2
    const bufferSize = options.lineBasedHandlerBufferSize || BUF_SIZE
    let bufferPair
    try {
        const fds = await Promise.all([fdQueue.promises.open(path1, 'r'), fdQueue.promises.open(path2, 'r')])
        bufferPair = bufferPool.allocateBuffers()
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
            const equalLines = compareLines(lines1, lines2, options)
            if (equalLines === 0) {
                return false
            }
            nextPosition1 += calculateSize(lines1, equalLines)
            nextPosition2 += calculateSize(lines2, equalLines)
        }
    } finally {
        bufferPool.freeBuffers(bufferPair)
        await closeFilesAsync(fd1, fd2, fdQueue)
    }
}

/**
 * Read lines from file starting with nextPosition.
 * Returns 0 lines if eof is reached, otherwise returns at least one complete line.
 */
function readLinesSync(fd, buf, bufferSize, nextPosition) {
    let lines = []
    let chunk = ""
    for (; ;) {
        const size = fs.readSync(fd, buf, 0, bufferSize, nextPosition)
        if (size === 0) {
            // end of file
            normalizeLastFileLine(lines)
            return lines
        }
        chunk += buf.toString('utf8', 0, size)
        lines = chunk.match(LINE_TOKENIZER_REGEXP)
        if (lines.length > 1) {
            return removeLastIncompleteLine(lines)
        }
        nextPosition += size
    }
}

/**
 * Read lines from file starting with nextPosition.
 * Returns 0 lines if eof is reached, otherwise returns at least one complete line.
 */
async function readLinesAsync(fd, buf, bufferSize, nextPosition) {
    let lines = []
    let chunk = ""
    for (; ;) {
        const size = await fsPromise.read(fd, buf, 0, bufferSize, nextPosition)
        if (size === 0) {
            // end of file
            normalizeLastFileLine(lines)
            return lines
        }
        chunk += buf.toString('utf8', 0, size)
        lines = chunk.match(LINE_TOKENIZER_REGEXP)
        if (lines.length > 1) {
            return removeLastIncompleteLine(lines)
        }
        nextPosition += size
    }
}

function removeLastIncompleteLine(lines) {
    const lastLine = lines[lines.length - 1]
    if (!lastLine.endsWith('\n')) {
        return lines.slice(0, lines.length - 1)
    }
    return lines
}

function normalizeLastFileLine(lines) {
    if (lines.length === 0) {
        return
    }
    const lastLine = lines[lines.length - 1]
    if (!lastLine.endsWith('\n')) {
        lines[lines.length - 1] = lastLine + '\n'
    }
}

function calculateSize(lines, numberOfLines) {
    let size = 0
    for (let i = 0; i < numberOfLines; i++) {
        const line = lines[i]
        size += line.length
    }
    return size
}

function compareLines(lines1, lines2, options) {
    let equalLines = 0
    const len = lines1.length < lines2.length ? lines1.length : lines2.length
    for (let i = 0; i < len; i++) {
        let line1 = lines1[i]
        let line2 = lines2[i]
        if (options.ignoreLineEnding) {
            line1 = trimLineEnding(line1)
            line2 = trimLineEnding(line2)
        }
        if (options.ignoreWhiteSpaces) {
            line1 = trimSpaces(line1)
            line2 = trimSpaces(line2)
        }
        if (line1 !== line2) {
            return equalLines
        }
        equalLines++
    }
    return equalLines
}

// Trims string like '   abc   \n' into 'abc\n'
function trimSpaces(s) {
    const matchResult = s.match(SPLIT_CONTENT_AND_LINE_ENDING_REGEXP);
    const content = matchResult[1]
    const lineEnding = matchResult[2]
    const trimmed = content.replace(TRIM_WHITE_SPACES_REGEXP, '')
    return trimmed + lineEnding
}

// Trims string like 'abc\r\n' into 'abc\n'
function trimLineEnding(s) {
    return s.replace(TRIM_LINE_ENDING_REGEXP, '\n')
}

module.exports = {
    compareSync: compareSync,
    compareAsync: compareAsync
}

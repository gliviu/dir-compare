import { LineBatch } from './LineBatch'


const LINE_TOKENIZER_REGEXP = /[^\n]+\n?|\n/g

/**
 * Reads lines from given buffer.
 * @param buf Buffer to read lines from.
 * @param size Size of data available in buffer.
 * @param allocatedBufferSize Maximum buffer storage.
 * @param rest Part of a line that was split at buffer boundary in a previous read.
 *             Will be added to result.
 * @param restLines Lines that remain unprocessed from a previous read due to unbalanced buffers.
 *             Will be added to result.
 */
export function readBufferedLines(buf: Buffer, size: number, allocatedBufferSize: number, rest: string, restLines: string[]): LineBatch {
    if (size === 0 && rest.length === 0) {
        return { lines: [...restLines], rest: '', reachedEof: true }
    }
    if (size === 0) {
        return { lines: [...restLines, rest], rest: '', reachedEof: true }
    }

    const fileContent = rest + buf.toString('utf8', 0, size)
    const lines = [...restLines, ...fileContent.match(LINE_TOKENIZER_REGEXP) as string[]]

    const reachedEof = size < allocatedBufferSize
    if (reachedEof) {
        return {
            lines, rest: '', reachedEof: true
        }
    }

    return removeLastLine(lines)
}

/**
 * Last line is usually incomplete because our buffer rarely matches exactly the end of a line.
 * So we remove it from the line batch.
 * The deleted line is returned as the 'rest' parameter and will be incorporate at the beginning 
 * of next read operation.
 */
function removeLastLine(lines: string[]): LineBatch {
    const lastLine = lines[lines.length - 1]
    return {
        lines: lines.slice(0, lines.length - 1),
        rest: lastLine,
        reachedEof: false
    }
}

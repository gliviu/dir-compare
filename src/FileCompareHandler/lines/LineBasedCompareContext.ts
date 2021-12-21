import { BufferPair } from '../../FileSystem/BufferPool'

interface RestPair {
    rest1: string
    rest2: string
}

interface RestLines {
    restLines1: string[]
    restLines2: string[]
}

export class LineBasedCompareContext {
    /**
     * File to compare.
     */
    public fd1: number
    /**
     * File to compare.
     */
    public fd2: number
    /**
     * Buffers used as temporary storage.
     */
    public buffer: BufferPair
    /**
     * Part of a line that was split at buffer boundary in a previous read.
     * Will be prefixed to the next read.
     */
    public rest: RestPair = {rest1: '', rest2: ''}
    /**
     * Lines that remain unprocessed from a previous read.
     * Will be prefixed to the next read.
     */
    public restLines: RestLines = {restLines1: [], restLines2: []}

    constructor(fd1: number, fd2: number, bufferPair: BufferPair) {
        this.fd1 = fd1
        this.fd2 = fd2
        this.buffer = bufferPair
    }
}

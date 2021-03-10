export interface BufferPair {
    buf1: Buffer
    buf2: Buffer
    busy: boolean
}

/**
 * Collection of buffers to be shared between async processes.
 * Avoids allocating buffers each time async process starts.
 */
export class BufferPool {
    private readonly bufferPool: BufferPair[] = []
    /**
     * 
     * @param bufSize Size of each buffer. 
     * @param bufNo Number of buffers. Caller has to make sure no more than bufNo async processes run simultaneously.
     */
    constructor(private readonly bufSize: number, private readonly bufNo: number) {
        for (let i = 0; i < this.bufNo; i++) {
            this.bufferPool.push({
                buf1: Buffer.alloc(this.bufSize),
                buf2: Buffer.alloc(this.bufSize),
                busy: false
            })
        }
    }

    public allocateBuffers(): BufferPair {
        for (let j = 0; j < this.bufNo; j++) {
            const bufferPair = this.bufferPool[j]
            if (!bufferPair.busy) {
                bufferPair.busy = true
                return bufferPair
            }
        }
        throw new Error('Async buffer limit reached')
    }

    public freeBuffers(bufferPair: BufferPair): void {
        bufferPair.busy = false
    }
}

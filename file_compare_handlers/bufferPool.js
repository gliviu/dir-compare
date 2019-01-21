var alloc = require('./common').alloc;

/**
 * Collection of buffers to be shared between async processes.
 * Avoids allocating buffers each time async process starts.
 * bufSize - size of each buffer
 * bufNo - number of buffers
 * Caller has to make sure no more than bufNo async processes run simultaneously.
 */
function BuferPool(bufSize, bufNo) {
    var bufferPool = []
    var createAsyncBuffers = function() {
        for(var i=0;i<bufNo;i++){
            bufferPool.push({
                buf1: alloc(bufSize),
                buf2: alloc(bufSize),
                busy: false})
        }
    }
    createAsyncBuffers()

    var allocateBuffers = function() {
        for(var i=0;i<bufNo;i++){
            var bufferPair = bufferPool[i]
            if(!bufferPair.busy) {
                bufferPair.busy = true
                return bufferPair
            }
        }
        throw new Error('Async buffer limit reached')
    }

    var freeBuffers = function(bufferPair) {
        bufferPair.busy = false
    }

    return {
        allocateBuffers : allocateBuffers,
        freeBuffers : freeBuffers
    };

}

module.exports = BuferPool;


var alloc = function(bufSize) {
    if(Buffer.alloc){
        return Buffer.alloc(bufSize);
    }
    return new Buffer(bufSize);
}

module.exports = {
    alloc : alloc,
};

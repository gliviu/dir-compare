const compareSync = require('./compareSync')
const compareAsync = require('./compareAsync')

/**
 * Compare files line by line with options to ignore
 * line endings and white space differences.
 */
module.exports = {
    compareSync: compareSync,
    compareAsync: compareAsync
}

var fs = require('fs')

module.exports = {
    readdir: function (path) {
        return new Promise(function (resolve, reject) {
            fs.readdir(path, function (err, files) {
                if (err) {
                    reject(err)
                } else {
                    resolve(files)
                }
            })
        })
    },
}

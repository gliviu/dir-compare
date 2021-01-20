const tar = require('tar-fs')
const fs = require('fs')
const pathUtils = require('path')

function extractFiles(tarFile, output, onExtracted, onError) {

    const extractLinks = () => {
        const linkExtractor = tar.extract(output, {
            ignore: (_, header) => {
                // use the 'ignore' handler for symlink creation.
                if (header.type === 'symlink') {
                    let target
                    if (process.platform === 'win32') {
                        // Absolute symlinks
                        target = pathUtils.join(output, pathUtils.dirname(header.name), header.linkname)
                    } else {
                        // Relative symlinks
                        target = header.linkname
                    }


                    const linkPath = pathUtils.join(output, header.name)
                    if (!fs.existsSync(linkPath)) {
                        if (fs.existsSync(target)) {
                            const statTarget = fs.statSync(target)
                            if (statTarget.isFile()) {
                                fs.symlinkSync(target, linkPath, 'file')
                            } else if (statTarget.isDirectory()) {
                                fs.symlinkSync(target, linkPath, 'junction')
                            } else {
                                throw new Error('unsupported')
                            }
                        } else {
                            fs.symlinkSync(target, linkPath, 'junction')
                        }
                    }
                }
                return true
            }
        }).on('error', onError).on('finish', onExtracted)
        fs.createReadStream(tarFile).on('error', onError).pipe(linkExtractor)
    }

    const fileExtractor = tar.extract(output, {
        ignore: (_, header) => {
            if (header.type === 'symlink') {
                return true
            } else {
                return false
            }
        }
    }).on('error', onError).on('finish', extractLinks)
    fs.createReadStream(tarFile).on('error', onError).pipe(fileExtractor)
}

function untar(tarFile, output, onExtracted, onError) {
    extractFiles(tarFile, output, onExtracted, onError)
}

module.exports = untar

var tar = require('tar-fs');
var fs = require('fs');
var pathUtils = require('path');

var extractFiles = function(tarFile, output, onExtracted, onError){

    var extractLinks = function(){
        var linkExtractor = tar.extract(output, {
            ignore : function(_, header){
                // use the 'ignore' handler for symlink creation.
                if(header.type==='symlink'){
                    var target;
                    if(process.platform==='win32'){
                        // Absolute symlinks
                        target = pathUtils.join(output, pathUtils.dirname(header.name), header.linkname);
                    } else{
                        // Relative symlinks
                        target = header.linkname;
                    }


                    var linkPath = pathUtils.join(output, header.name);
                    if(!fs.existsSync(linkPath)){
                        if(fs.existsSync(target)){
                            var statTarget = fs.statSync(target);
                            if(statTarget.isFile()){
                                fs.symlinkSync(target, linkPath, 'file');
                            } else if(statTarget.isDirectory()){
                                fs.symlinkSync(target, linkPath, 'junction');
                            } else{
                                throw 'unsupported';
                            }
                        } else{
                            fs.symlinkSync(target, linkPath, 'junction');
                        }
                    }
                }
                return true;
            }
        }).on('error', onError).on('finish', onExtracted);
        fs.createReadStream(tarFile).on('error', onError).pipe(linkExtractor);
    }

    var fileExtractor = tar.extract(output, {
        ignore : function(_, header){
            if(header.type==='symlink'){
                return true;
            } else{
                return false;
            }
        }
    }).on('error', onError).on('finish', extractLinks);
    fs.createReadStream(tarFile).on('error', onError).pipe(fileExtractor);
}

var untar = function(tarFile, output, onExtracted, onError){
    extractFiles(tarFile, output, onExtracted, onError);
}

module.exports = untar;

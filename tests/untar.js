var tar = require('tar-fs');
var fs = require('fs');
var pathUtils = require('path');

var untar = function(output, onExtracted, onError){
    var extractor = tar.extract(output, {
        ignore : function(_, header){
            // use the 'ignore' handler for symlink creation.
            if(header.type==='symlink'){
                var target = pathUtils.join(output, pathUtils.dirname(header.name), header.linkname);
                var linkPath = pathUtils.join(output, header.name); 
                if(!fs.existsSync(linkPath)){
                    fs.symlinkSync(target, linkPath, 'junction');
                }
            }
            return false;
        }
    }).on('error', onError).on('finish', onExtracted);
    fs.createReadStream(__dirname + "/testdir.tar").on('error', onError).pipe(extractor);
}

module.exports = untar;
var fs = require('fs');
var Promise = require('bluebird');

module.exports = {
    stat : function(path){
        return new Promise(function(resolve, reject){
            fs.stat(path, function(err, stats){
                if(err){
                    reject(err);
                } else{
                    resolve(stats);
                }
            })
        });
    },
    lstat : function(path){
        return new Promise(function(resolve, reject){
            fs.lstat(path, function(err, stats){
                if(err){
                    reject(err);
                } else{
                    resolve(stats);
                }
            })
        });
    },
    readdir : function(path){
        return new Promise(function(resolve, reject){
            fs.readdir(path, function(err, files){
                if(err){
                    reject(err);
                } else{
                    resolve(files);
                }
            })
        });
    },
};

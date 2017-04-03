var fs = require('fs');
var minimatch = require('minimatch');
var pathUtils = require('path');

module.exports = {
    detectLoop : function(entry, symlinkCache){
        if(entry && entry.symlink){
            var realPath = pathUtils.normalize(fs.realpathSync(entry.path)).toLowerCase();
            if(symlinkCache[realPath]){
                return true;
            }
        }
        return false;
    },

    cloneSymlinkCache : function(symlinkCache){
        return {
            dir1 : this.shallowClone(symlinkCache.dir1),
            dir2 : this.shallowClone(symlinkCache.dir2)
        }
    },

    shallowClone : function(obj){
    	var cloned = {};
    	Object.keys(obj).forEach(function(key){
    		cloned[key] = obj[key];
    	});
    	return cloned;
    },

    buildEntry : function(path, name){
        var statEntry = fs.statSync(path);
        var lstatEntry = fs.lstatSync(path);
        var isSymlink = lstatEntry.isSymbolicLink();
        return {
            name : name,
            path : path,
            stat : statEntry,
            lstat : lstatEntry,
            symlink : isSymlink,
            toString : function () {
                return this.name;
            }
        };
    },

	/**
	 * One of 'missing','file','directory'
	 */
	getType : function(fileStat) {
		if (fileStat) {
			if (fileStat.isDirectory()) {
				return 'directory';
			} else {
				return 'file';
			}
		} else {
			return 'missing';
		}
	},
	/**
	 * Matches fileName with pattern.
	 */
	match : function(fileName, pattern){
	    var patternArray = pattern.split(',');
	    for(var i = 0; i<patternArray.length; i++){
	        var pat = patternArray[i];
	        if(minimatch(fileName, pat, { dot: true })){ //nocase
	            return true;
	        }
	    }
	    return false;
	},

	/**
	 * Filter entries by file name. Returns true if the file is to be processed.
	 */
	filterEntry : function(entry, options){
	    if (entry.symlink && options.skipSymlinks){
	        return false;
	    }

        if ((entry.stat.isFile() && options.includeFilter) && (!this.match(entry.name, options.includeFilter))) {
            return false;
        }

        if ((options.excludeFilter) && (this.match(entry.name, options.excludeFilter))) {
            return false;
        }

        return true;
	},
	/**
	 * Comparator for directory entries sorting.
	 */
	compareEntryCaseSensitive : function (a, b, ignoreCase) {
	    if (a.stat.isDirectory() && b.stat.isFile()) {
	        return -1;
	    } else if (a.stat.isFile() && b.stat.isDirectory()) {
	        return 1;
	    } else {
	    	// http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
	    	var str1 = a.name, str2 = b.name;
	    	return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
	    }
	},
	/**
	 * Comparator for directory entries sorting.
	 */
	compareEntryIgnoreCase : function (a, b, ignoreCase) {
	    if (a.stat.isDirectory() && b.stat.isFile()) {
	        return -1;
	    } else if (a.stat.isFile() && b.stat.isDirectory()) {
	        return 1;
	    } else {
	    	// http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp
	    	var str1 = a.name.toLowerCase(), str2 = b.name.toLowerCase();
	    	return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
	    }
	},
    /**
     * Compares two dates and returns true/false depending on tolerance (milliseconds).
     * Two dates are considered equal if the difference in milliseconds between them is less or equal than tolerance.
     */
    sameDate : function(date1, date2, tolerance){
        return Math.abs(date1.getTime() - date2.getTime()) <= tolerance ? true : false;
    },
    isNumeric : function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}

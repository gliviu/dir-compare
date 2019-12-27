var fs = require('fs');
var minimatch = require('minimatch');
var pathUtils = require('path');

module.exports = {
    detectLoop : function(entry, symlinkCache){
        if(entry && entry.symlink){
            var realPath = fs.realpathSync(entry.absolutePath);
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

	buildEntry: function (absolutePath, path, name) {
		var stats = getStatIgnoreBrokenLink(absolutePath);
		
		return {
			name: name,
			absolutePath: absolutePath,
			path: path,
			stat: stats.stat,
			lstat: stats.lstat,
			symlink: stats.lstat.isSymbolicLink(),
			isBrokenLink: stats.isBrokenLink,
			isDirectory: stats.stat.isDirectory()
		};
	},

	/**
	 * One of 'missing','file','directory'
	 */
	getType: function (entry) {
		if (!entry) {
			return 'missing';
		}
		if (entry.isBrokenLink) {
			return 'broken-link';
		}
		if (entry.isDirectory) {
			return 'directory';
		}
		return 'file';
	},

	/**
	 * Matches path by pattern.
	 */
	match : function(path, pattern){
	    var patternArray = pattern.split(',');
	    for(var i = 0; i<patternArray.length; i++){
	        var pat = patternArray[i];
	        if(minimatch(path, pat, { dot: true, matchBase: true})){ //nocase
	            return true;
	        }
	    }
	    return false;
	},

	/**
	 * Filter entries by file name. Returns true if the file is to be processed.
	 */
	filterEntry : function(entry, relativePath, options){
	    if (entry.symlink && options.skipSymlinks){
	        return false;
		}
		var path = pathUtils.join(relativePath, entry.name)
		
        if ((entry.stat.isFile() && options.includeFilter) && (!this.match(path, options.includeFilter))) {
            return false;
        }

        if ((options.excludeFilter) && (this.match(path, options.excludeFilter))) {
            return false;
        }

        return true;
	},

	/**
	 * Comparator for directory entries sorting.
	 */
	compareEntryCaseSensitive : function (a, b, ignoreCase) {
		if(a.isBrokenLink && b.isBrokenLink) {
			return strcmp(a.name, b.name)
		} else if(a.isBrokenLink) {
			return -1
		} else if(b.isBrokenLink) {
			return 1
		} else if (a.stat.isDirectory() && b.stat.isFile()) {
	        return -1;
	    } else if (a.stat.isFile() && b.stat.isDirectory()) {
	        return 1;
	    } else {
			return strcmp(a.name, b.name)
	    }
	},

	/**
	 * Comparator for directory entries sorting.
	 */
	compareEntryIgnoreCase : function (a, b, ignoreCase) {
		if(a.isBrokenLink && b.isBrokenLink) {
			return strcmp(a.name, b.name)
		} else if(a.isBrokenLink) {
			return -1
		} else if(b.isBrokenLink) {
			return 1
		} else if (a.stat.isDirectory() && b.stat.isFile()) {
	        return -1;
	    } else if (a.stat.isFile() && b.stat.isDirectory()) {
	        return 1;
	    } else {
			return strcmp(a.name.toLowerCase(), b.name.toLowerCase())
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


function getStatIgnoreBrokenLink(absolutePath) {
	var lstat = fs.lstatSync(absolutePath);
	try {
		return {
			stat: fs.statSync(absolutePath),
			lstat: lstat,
			isBrokenLink: false
		}
	} catch (error) {
		if (error.code === 'ENOENT') {
			return {
				stat: lstat,
				lstat: lstat,
				isBrokenLink: true
			}
		}
		throw error
	}
}

function strcmp(str1, str2) {
	return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
}

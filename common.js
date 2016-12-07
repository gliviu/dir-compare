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
	    if(entry.symlink && options.skipSymlinks){
	        return false;
	    }

	    if(entry.stat.isFile() && options.includeFilter){
	        if(this.match(entry.name, options.includeFilter)){
	            return true;
	        } else{
	            return false;
	        }
	    }
	    if(options.excludeFilter){
	        if(this.match(entry.name, options.excludeFilter)){
	            return false;
	        } else{
	            return true;
	        }
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
     * Compares two dates and returns true/false depending on precision.
     * 2016-12-31T23:59:59.999Z and 2016-12-30T20:50:50.900Z are considered equal when presision is 'month' or 'year'
     * Allowed values for precision: 'none', 'second', 'minute', 'hour', 'day', 'month', 'year'
     * 'none' causes all date fields to be compared.
     */
    sameDate : function(date1, date2, precision){
        date1 = roundDate(date1, precision);
        date2 = roundDate(date2, precision);
        return date1.getTime() === date2.getTime()
    }
}

/**
 * Rounds down the date to given precision.
 * 2016-12-31T23:59:59.999Z is rounded to 2016-12-31T00:00:00.000Z when precisionis is 'day'
 * Returns a new date.
 * Allowed values for precision: 'none', 'second', 'minute', 'hour', 'day', 'month', 'year'
 * A value of 'none' for precision does no rounding at all.
 */
var roundDate = function (date, precision) {
    var res = new Date(date.getTime())
    switch(precision){
        case 'none':
            break;
        case 'second':
            res.setUTCMilliseconds(0);
            break;
        case 'minute':
            res.setUTCMilliseconds(0); res.setUTCSeconds(0);
            break;
        case 'hour':
            res.setUTCMilliseconds(0); res.setUTCSeconds(0); res.setUTCMinutes(0);
            break;
        case 'day':
            res.setUTCMilliseconds(0); res.setUTCSeconds(0); res.setUTCMinutes(0); res.setUTCHours(0);
            break;
        case 'month':
            res.setUTCMilliseconds(0); res.setUTCSeconds(0); res.setUTCMinutes(0); res.setUTCHours(0); res.setUTCDate(1);
            break;
        case 'year':
            res.setUTCMilliseconds(0); res.setUTCSeconds(0); res.setUTCMinutes(0); res.setUTCHours(0); res.setUTCDate(1); res.setUTCMonth(0);
            break;
        default:
            throw new Error("Bad argument - " + precision + ". Any of 'none', 'second', 'minute', 'hour', 'day', 'month', 'year' is expected")
    }
    return res;
}

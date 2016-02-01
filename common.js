var minimatch = require('minimatch');

module.exports = {
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
	}


}

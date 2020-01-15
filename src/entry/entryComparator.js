/**
 * Determines order criteria for sorting entries in a directory.
 */
module.exports = {
	compareEntryCaseSensitive: function (a, b) {
		if (a.isBrokenLink && b.isBrokenLink) {
			return strcmp(a.name, b.name)
		} else if (a.isBrokenLink) {
			return -1
		} else if (b.isBrokenLink) {
			return 1
		} else if (a.stat.isDirectory() && b.stat.isFile()) {
			return -1
		} else if (a.stat.isFile() && b.stat.isDirectory()) {
			return 1
		} else {
			return strcmp(a.name, b.name)
		}
	},

	compareEntryIgnoreCase: function (a, b) {
		if (a.isBrokenLink && b.isBrokenLink) {
			return strcmp(a.name, b.name)
		} else if (a.isBrokenLink) {
			return -1
		} else if (b.isBrokenLink) {
			return 1
		} else if (a.stat.isDirectory() && b.stat.isFile()) {
			return -1
		} else if (a.stat.isFile() && b.stat.isDirectory()) {
			return 1
		} else {
			return strcmp(a.name.toLowerCase(), b.name.toLowerCase())
		}
	},
}

function strcmp(str1, str2) {
	return ((str1 === str2) ? 0 : ((str1 > str2) ? 1 : -1))
}

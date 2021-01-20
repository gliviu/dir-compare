const fs = require('fs')
const minimatch = require('minimatch')
const pathUtils = require('path')
const entryComparator = require('./entryComparator')

const PATH_SEP = pathUtils.sep

module.exports = {
	/**
	 * Returns the sorted list of entries in a directory.
	 */
	buildDirEntries(rootEntry, dirEntries, relativePath, options) {
		const res = []
		for (let i = 0; i < dirEntries.length; i++) {
			const entryName = dirEntries[i]
			const entryAbsolutePath = rootEntry.absolutePath + PATH_SEP + entryName
			const entryPath = rootEntry.path + PATH_SEP + entryName

			const entry = this.buildEntry(entryAbsolutePath, entryPath, entryName)
			if (options.skipSymlinks && entry.isSymlink) {
				entry.stat = undefined
			}

			if (filterEntry(entry, relativePath, options)) {
				res.push(entry)
			}
		}
		return res.sort((a, b) => entryComparator.compareEntry(a, b, options))
	},

	buildEntry (absolutePath, path, name) {
		const stats = getStatIgnoreBrokenLink(absolutePath)

		return {
			name: name,
			absolutePath: absolutePath,
			path: path,
			stat: stats.stat,
			lstat: stats.lstat,
			isSymlink: stats.lstat.isSymbolicLink(),
			isBrokenLink: stats.isBrokenLink,
			isDirectory: stats.stat.isDirectory()
		}
	},

}


function getStatIgnoreBrokenLink(absolutePath) {
	const lstat = fs.lstatSync(absolutePath)
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

/**
 * Filter entries by file name. Returns true if the file is to be processed.
 */
function filterEntry(entry, relativePath, options) {
	if (entry.isSymlink && options.skipSymlinks) {
		return false
	}
	const path = pathUtils.join(relativePath, entry.name)

	if ((entry.stat.isFile() && options.includeFilter) && (!match(path, options.includeFilter))) {
		return false
	}

	if ((options.excludeFilter) && (match(path, options.excludeFilter))) {
		return false
	}

	return true
}

/**
 * Matches path by pattern.
 */
function match(path, pattern) {
	const patternArray = pattern.split(',')
	for (let i = 0; i < patternArray.length; i++) {
		const pat = patternArray[i]
		if (minimatch(path, pat, { dot: true, matchBase: true })) { //nocase
			return true
		}
	}
	return false
}


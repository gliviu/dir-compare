import fs, { Stats } from 'fs'
import pathUtils from 'path'
import { Entry, EntryOrigin } from '..'
import { ExtOptions } from '../ExtOptions'
import { EntryComparator } from './EntryComparator'

const PATH_SEP = pathUtils.sep

export const EntryBuilder = {
	/**
	 * Returns the sorted list of entries in a directory.
	 */
	buildDirEntries(rootEntry: Entry, dirEntries: string[], relativePath: string, origin: EntryOrigin, options: ExtOptions): Entry[] {
		const res: Entry[] = []
		for (let i = 0; i < dirEntries.length; i++) {
			const entryName = dirEntries[i]
			const entryAbsolutePath = rootEntry.absolutePath + PATH_SEP + entryName
			const entryPath = rootEntry.path + PATH_SEP + entryName

			const entry = this.buildEntry(entryAbsolutePath, entryPath, entryName, origin, options)
			if (options.skipSymlinks && entry.isSymlink) {
				entry.stat = undefined
			}

			if (filterEntry(entry, relativePath, options)) {
				res.push(entry)
			}
		}
		return res.sort((a, b) => EntryComparator.compareEntry(a, b, options))
	},

	buildEntry(absolutePath: string, path: string, name: string, origin: EntryOrigin, options: ExtOptions): Entry {
		const stats = getStatIgnoreBrokenLink(absolutePath)
		const isDirectory = stats.stat.isDirectory()

		let isPermissionDenied = false
		if (options.handlePermissionDenied) {
			const isFile = !isDirectory
			isPermissionDenied = hasPermissionDenied(absolutePath, isFile, options)
		}

		return {
			name,
			absolutePath,
			path,
			origin,
			stat: stats.stat,
			lstat: stats.lstat,
			isSymlink: stats.lstat.isSymbolicLink(),
			isBrokenLink: stats.isBrokenLink,
			isDirectory,
			isPermissionDenied
		}
	},

}

function hasPermissionDenied(absolutePath: string, isFile: boolean, options: ExtOptions): boolean {
	if (isFile && !options.compareContent) {
		return false
	}
	try {
		fs.accessSync(absolutePath, fs.constants.R_OK)
		return false
	} catch {
		return true
	}
}

type CombinedStats = {
	stat: Stats
	lstat: Stats
	isBrokenLink: boolean
}

function getStatIgnoreBrokenLink(absolutePath: string): CombinedStats {
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
 * Filter entries by name. Returns true if the entry is to be processed.
 */
function filterEntry(entry: Entry, relativePath: string, options: ExtOptions): boolean {
	if (entry.isSymlink && options.skipSymlinks) {
		return false
	}

	if (options.skipEmptyDirs && entry.stat.isDirectory() && isEmptyDir(entry.absolutePath)) {
		return false
	}

	return options.filterHandler(entry, relativePath, options)
}

function isEmptyDir(path: string): boolean {
	return fs.readdirSync(path).length === 0
}



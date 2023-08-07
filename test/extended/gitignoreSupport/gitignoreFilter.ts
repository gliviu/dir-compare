import { Options, FilterHandler, Entry, filterHandlers } from 'dir-compare'
import { isGitIgnoredSync, GlobbyFilterFunction } from 'globby'

/**
 * Implements a custom filter that ignores files according to .gitignore rules.  
 * Relies on globby library to provide the filtering logic.  
 * Note that globby has some issues reported for .gitignore handling:
 * * https://github.com/sindresorhus/globby/issues/86
 * * https://github.com/sindresorhus/globby/issues/146
 * * https://github.com/sindresorhus/globby/issues/255
 * @param pathLeft This has to be the same as dir1 sent to dircompare.compare(dir1, dir2)
 * @param pathRight This has to be the same as dir2 sent to dircompare.compare(dir1, dir2)
 * @returns The filter function to be used as dircompare Option.
 */
export function getGitignoreFilter(pathLeft: string, pathRight: string): FilterHandler {
    const isIgnoredLeft: GlobbyFilterFunction = isGitIgnoredSync({ cwd: pathLeft })
    const isIgnoredRight: GlobbyFilterFunction = isGitIgnoredSync({ cwd: pathRight })

    const gitignoreFilter: FilterHandler = (entry: Entry, relativePath: string, options: Options): boolean => {
        const isIgnored: GlobbyFilterFunction = entry.origin === 'left' ? isIgnoredLeft : isIgnoredRight
        // .git is not ignored by globby. We have to handle it.
        if (entry.name === '.git') {
            return false
        }
        // Use globby to evaluate the current path
        if (isIgnored(entry.absolutePath)) {
            return false
        }
        // Fallback on the default 'minimatch' implementation to deal with includeFilter and excludeFilter options
        return filterHandlers.defaultFilterHandler(entry, relativePath, options)
    }

    return gitignoreFilter
}



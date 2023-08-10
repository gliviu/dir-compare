import pathUtils from 'path'
import { ExtOptions } from "../ExtOptions";
import { Entry, FilterHandler } from "../types";
import minimatch from 'minimatch'

/**
 * Default filter handler that uses minimatch to accept/ignore files based on includeFilter and excludeFilter options.
 */
export const defaultFilterHandler: FilterHandler = (entry: Entry, relativePath: string, options: ExtOptions): boolean => {
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
function match(path: string, pattern: string): boolean {
    const patternArray = pattern.split(',')
    for (let i = 0; i < patternArray.length; i++) {
        const pat = patternArray[i]
        if (minimatch(path, pat, { dot: true, matchBase: true })) { //nocase
            return true
        }
    }
    return false
}

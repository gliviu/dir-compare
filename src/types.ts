/// <reference types="node" />

import * as fs from "fs"



/**
 * Comparison options.
 */
export interface Options {
    /**
     * Properties to be used in various extension points ie. result builder.
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any

    /**
     * Compares files by size. Defaults to 'false'.
     * 
     * Usually one of `compareSize` or `compareContent` options has to be activated. Otherwise files are compared by name disregarding size or content.
     */
    compareSize?: boolean

    /**
     * Compares files by content. Defaults to 'false'.
     * 
     * Usually one of `compareSize` or `compareContent` options has to be activated. Otherwise files are compared by name disregarding size or content.
     */
    compareContent?: boolean

    /**
     * Compares files by date of modification (stat.mtime). Defaults to 'false'.
     * 
     * Also see {@link Options.dateTolerance}.
     */
    compareDate?: boolean

    /**
     * Two files are considered to have the same date if the difference between their modification dates fits within date tolerance. Defaults to 1000 ms.
     */
    dateTolerance?: number

    /**
     * Compares entries by symlink. Defaults to 'false'.

     * If this option is enabled two entries must have the same type in order to be considered equal. 
     * They have to be either two fies, two directories or two symlinks.
     * 
     * If left entry is a file and right entry is a symlink, they are considered distinct disregarding the content of the file.
     * 
     * Further if both entries are symlinks they need to have the same link value. For example if one symlink points to '/x/b.txt' and the other to '/x/../x/b.txt' the symlinks are considered distinct even if they point to the same file.
     */
    compareSymlink?: boolean

    /**
     * Skips sub directories. Defaults to 'false'.
     */
    skipSubdirs?: boolean

    /**
     * Ignore empty directories. Defaults to 'false'.
     */
    skipEmptyDirs?: boolean

    /**
     * Ignore symbolic links. Defaults to 'false'.
     */
    skipSymlinks?: boolean

    /**
     * Ignores case when comparing names. Defaults to 'false'.
     */
    ignoreCase?: boolean

    /**
     * Toggles presence of diffSet in output. If true, only statistics are provided. Use this when comparing large number of files to avoid out of memory situations. Defaults to 'false'.
     */
    noDiffSet?: boolean

    /**
     * File name filter. Comma separated minimatch patterns. See [Glob patterns](https://github.com/gliviu/dir-compare#glob-patterns).
     */
    includeFilter?: string

    /**
     * File/directory name exclude filter. Comma separated minimatch patterns. See [Glob patterns](https://github.com/gliviu/dir-compare#glob-patterns).
     */
    excludeFilter?: string

    /**
     * Handle permission denied errors. Defaults to 'false'.
     * 
     * By default when some entry cannot be read due to `EACCES` error the comparison will
     * stop immediately with an exception.
     * 
     * If `handlePermissionDenied` is set to true the comparison will continue when unreadable entries are encountered.
     * 
     * Offending entries will be reported within {@link Difference.permissionDeniedState}, {@link Difference.reason} and {@link Result.permissionDenied}.
     * 
     * Lets consider we want to compare two identical folders `A` and `B` with `B/dir2` being unreadable for the current user.
     * ```
     * A                    B
     * ├── dir1             ├── dir1   
     * ├──── file1          ├──── file1
     * ├── dir2             ├── dir2 (permission denied)  
     * └─────file2          └─────file2
     * ```
     * 
     * {@link Result.diffSet} will look like:
     * 
     * |relativePath  |path1    |path2    | state      |reason                  |permissionDeniedState|
     * |--------------|---------|---------|------------|------------------------|---------------------|
     * |[/]           |dir1     |dir1     |`equal`     |                        |                     |  
     * |[/dir1]       |file1    |file1    |`equal`     |                        |                     |  
     * |[/]           |dir2     |dir2     |`distinct`  |  `permission-denied`   |`access-error-right` |  
     * |[/dir2]       |file2    |missing  |`left`      |                        |                     |  
     * 
     * And {@link Result.permissionDenied} statistics look like 
     * ```json
     * {
     *   leftPermissionDenied: 0, 
     *   rightPermissionDenied: 1, 
     *   distinctPermissionDenied: 0, 
     *   totalPermissionDenied: 1
     * }
     * ```
     */
    handlePermissionDenied?: boolean

    /**
     * Extension point used for constructing the {@link Result} object.
     * 
     * See [Result builder](https://github.com/gliviu/dir-compare#result-builder).
     */
    resultBuilder?: ResultBuilder

    /**
     * Extension point used to perform sync file content comparison.
     * 
     * See [File comparators](https://github.com/gliviu/dir-compare#file-content-comparators).
     */
    compareFileSync?: CompareFileSync

    /**
     * Extension point used to perform async file content comparison.
     * 
     * See [File comparators](https://github.com/gliviu/dir-compare#file-content-comparators).
     */
    compareFileAsync?: CompareFileAsync

    /**
     * Extension point used to compare files or directories names.
     * 
     * See [Name comparators](https://github.com/gliviu/dir-compare#name-comparators).
     */
    compareNameHandler?: CompareNameHandler

    /**
     * Extension point used to control which files or directories should be included in the comparison.
     * 
     * See [Glob filter](https://github.com/gliviu/dir-compare#glob-filter).
     */
    filterHandler?: FilterHandler
}

/**
 * List of differences occurred during comparison.
 */
export type DiffSet = Array<Difference>

/**
 * @internal
 */
export type OptionalDiffSet = DiffSet | undefined

export type EntryOrigin = 'left' | 'right'

export interface Entry {
    name: string
    absolutePath: string
    path: string
    /**
     * Whether this entry originated from the left or the right dir.
     */
    origin: EntryOrigin
    stat: fs.Stats
    lstat: fs.Stats
    isDirectory: boolean
    isSymlink: boolean
    isBrokenLink: boolean
    /**
     * True when this entry is not readable.
     * This value is set only when {@link Options.handlePermissionDenied} is enabled.
     */
    isPermissionDenied: boolean
}

/**
 * Comparison result.
 */
export interface Result extends Statistics {
    /**
     * Detailed list of comparison results.
     * Present if {@link Options.noDiffSet} is false.
     */
    diffSet?: DiffSet
}

/**
 * Basic statistics information. Does not have any computed fields.
 */
export interface InitialStatistics {
    /**
     * Any property is allowed if default result builder is not used.
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any

    /**
     * Number of distinct entries.
     */
    distinct: number

    /**
     * Number of equal entries.
     */
    equal: number

    /**
     * Number of entries only in path1.
     */
    left: number

    /**
     * Number of entries only in path2.
     */
    right: number

    /**
     * Number of distinct files.
     */
    distinctFiles: number

    /**
     * Number of equal files.
     */
    equalFiles: number

    /**
     * Number of files only in path1.
     */
    leftFiles: number

    /**
     * Number of files only in path2
     */
    rightFiles: number

    /**
     * Number of distinct directories.
     */
    distinctDirs: number

    /**
     * Number of equal directories.
     */
    equalDirs: number

    /**
     * Number of directories only in path1.
     */
    leftDirs: number

    /**
     * Number of directories only in path2.
     */
    rightDirs: number

    /**
     * Stats about broken links.
     */
    brokenLinks: BrokenLinksStatistics

    /**
     * Statistics available if 'compareSymlink' options is used.
     */
    symlinks?: SymlinkStatistics

    /**
     * Stats about entries that could not be accessed.
     */
    permissionDenied: PermissionDeniedStatistics
}

/**
 * In addition to fields inherited from {@link InitialStatistics} this class
 * adds fields computed at the final stage of the comparison.
 */
export interface Statistics extends InitialStatistics {

    /**
     * True if directories are identical.
     */
    same: boolean

    /**
     * Total number of differences (distinct+left+right).
     */
    differences: number

    /**
     * Total number of entries (differences+equal).
     */
    total: number

    /**
     * Total number of different files (distinctFiles+leftFiles+rightFiles).
     */
    differencesFiles: number

    /**
     * Total number of files (differencesFiles+equalFiles).
     */
    totalFiles: number

    /**
     * Total number of different directories (distinctDirs+leftDirs+rightDirs).
     */
    differencesDirs: number

    /**
     * Total number of directories (differencesDirs+equalDirs).
     */
    totalDirs: number

}

export interface BrokenLinksStatistics {
    /**
     * Number of broken links only in path1
     */
    leftBrokenLinks: number

    /**
     * Number of broken links only in path2
     */
    rightBrokenLinks: number

    /**
     * Number of broken links with same name appearing in both path1 and path2  (leftBrokenLinks + rightBrokenLinks + distinctBrokenLinks)
     */
    distinctBrokenLinks: number

    /**
     * Total number of broken links
     */
    totalBrokenLinks: number

}

export interface PermissionDeniedStatistics {
    /**
     * Number of forbidden entries found only in path1
     */
    leftPermissionDenied: number

    /**
     * Number of forbidden entries found only in path2
     */
    rightPermissionDenied: number

    /**
     * Number of forbidden entries with same name appearing in both path1 and path2  (leftPermissionDenied + rightPermissionDenied + distinctPermissionDenied)
     */
    distinctPermissionDenied: number

    /**
     * Total number of forbidden entries
     */
    totalPermissionDenied: number

}

export interface SymlinkStatistics {
    /**
     * Number of distinct links.
     */
    distinctSymlinks: number

    /**
     * Number of equal links.
     */
    equalSymlinks: number

    /**
     * Number of links only in path1.
     */
    leftSymlinks: number

    /**
     * Number of links only in path2
     */
    rightSymlinks: number

    /**
     * Total number of different links (distinctSymlinks+leftSymlinks+rightSymlinks).
     */
    differencesSymlinks: number

    /**
     * Total number of links (differencesSymlinks+equalSymlinks).
     */
    totalSymlinks: number

}

/**
 * State of left/right entries relative to each other.
 * * `equal` - Identical entries are found in both left/right dirs.
 * * `left` - Entry is found only in left dir.
 * * `right` - Entry is found only in right dir.
 * * `distinct` - Entries exist in both left/right dir but have different content. See {@link Difference.reason} to understan why entries are considered distinct.
 */
export type DifferenceState = "equal" | "left" | "right" | "distinct"

/**
 * Permission related state of left/right entries. Available only when {@link Options.handlePermissionDenied} is enabled.
 * * `access-ok`          - Both entries are accessible.
 * * `access-error-both`  - Neither entry can be accessed.
 * * `access-error-left`  - Left entry cannot be accessed.
 * * `access-error-right` - Right entry cannot be accessed.
 */
export type PermissionDeniedState = "access-ok" | "access-error-both" | "access-error-left" | "access-error-right"

/**
 * Type of entry.
 */
export type DifferenceType = "missing" | "file" | "directory" | "broken-link"

/**
 * Provides reason when two identically named entries are distinct.
 * 
 * Not available if entries are equal.
 * 
 * * `different-size` - Files differ in size.
 * * `different-date - Entry dates are different. Used when {@link Options.compareDate} is `true`.
 * * `different-content` - File contents are different. Used when {@link Options.compareContent} is `true`.
 * * `broken-link` - Both left/right entries are broken links.
 * * `different-symlink` - Symlinks are different. See {@link Options.compareSymlink} for details.
 * * `permission-denied` - One or both left/right entries are not accessible. See {@link Options.handlePermissionDenied} for details.
 */
export type Reason = undefined | "different-size" | "different-date" | "different-content" | "broken-link" | 'different-symlink' | 'permission-denied'

export interface Difference {
    /**
     * Any property is allowed if default result builder is not used.
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any

    /**
     * Path not including file/directory name; can be relative or absolute depending on call to compare().
     * Is undefined if missing on the left side.
     */
    path1?: string

    /**
     * Path not including file/directory name; can be relative or absolute depending on call to compare().
     * Is undefined if missing on the right side.
     */
    path2?: string

    /**
     * Path relative to the root directory of the comparison.
     */
    relativePath: string

    /**
     * Left file/directory name.
     * Is undefined if missing on the left side.
     */
    name1?: string

    /**
     * Right file/directory name.
     * Is undefined if missing on the right side.
     */
    name2?: string

    /**
     * See {@link DifferenceState}
     */
    state: DifferenceState

    /**
     * Permission related state of left/right entries.
     */
    permissionDeniedState: PermissionDeniedState

    /**
     * Type of left entry.
     * Is undefined if missing on the left side.
     */
    type1: DifferenceType

    /**
     * Type of right entry.
     * Is undefined if missing on the right side.
     */
    type2: DifferenceType

    /**
     * Left file size.
     * Is undefined if missing on the left side.
     */
    size1?: number

    /**
     * Right file size.
     * Is undefined if missing on the right side.
     */
    size2?: number

    /**
     * Left entry modification date (stat.mtime).
     * Is undefined if missing on the left side.
     */
    date1?: Date

    /**
     * Right entry modification date (stat.mtime).
     * Is undefined if missing on the right side.
     */
    date2?: Date

    /**
     * Depth level relative to root dir.
     */
    level: number

    /**
     * Provides reason when two identically named entries are distinct.
     */
    reason: Reason
}

/**
 * Extension point used for constructing the {@link Result} object.
 * Called for each compared entry pair.
 * Updates 'statistics' and 'diffSet'.
 * @param entry1 Left entry.
 * @param entry2 Right entry.
 * @param state See {@link DifferenceState}.
 * @param level Depth level relative to root dir.
 * @param relativePath Path relative to the root directory of the comparison.
 * @param statistics Statistics to be updated.
 * @param diffSet Status per each entry to be appended.
 * Do not append if {@link Options.noDiffSet} is false.
 * @param reason See {@link Reason}. Not available if entries are equal.
 */
export type ResultBuilder = (entry1: Entry | undefined, entry2: Entry | undefined, state: DifferenceState, level: number,
    relativePath: string, options: Options, statistics: InitialStatistics, diffSet: DiffSet | undefined,
    reason: Reason | undefined, permissionDeniedState: PermissionDeniedState
) => void

/**
 * Extension point used to perform sync file content comparison.
 */
export type CompareFileSync = (path1: string, stat1: fs.Stats,
    path2: string, stat2: fs.Stats, options: Options) => boolean

/**
 * Extension point used to perform async file content comparison.
 */
export type CompareFileAsync = (path1: string, stat1: fs.Stats,
    path2: string, stat2: fs.Stats, options: Options) => Promise<boolean>

export interface CompareFileHandler {
    compareSync: CompareFileSync,
    compareAsync: CompareFileAsync
}

/**
 * Extension point used to compare files or directories names.
 * The comparison should be dependent on received options (ie. case sensitive, ...).
 * Returns 0 if names are identical, -1 if name1<name2, 1 if name1>name2.
 */
export type CompareNameHandler = (name1: string, name2: string, options: Options) => 0 | 1 | -1

/**
 * Extension point used to control which files or directories should be included in the comparison.
 * 
 * @param entry Filesystem entry to include or ignore.
 * @param relativePath Path relative to the root directory of the comparison. It depends on {@link Entry.origin}.
 * @param option Comparison options.
 * @returns Returns true if the entry is to be processed or false to ignore it.
 */
export type FilterHandler = (entry: Entry, relativePath: string, options: Options) => boolean

export interface FileCompareHandlers {
    /**
     * Compares files based on their binary content.
     * 
     * This is the default file content comparator.
     * It is used when {@link Options.compareContent} is true and custom file comparator
     * is not specified (ie. {@link Options.compareFileSync} or {@link Options.compareFileAsync} are 'undefined').
     */
    defaultFileCompare: CompareFileHandler;
    /**
     * Compares files line by line.
     *
     * These additional options are available:
     * * ignoreLineEnding - true/false (default: false) - Ignore cr/lf line endings
     * * ignoreWhiteSpaces - true/false (default: false) - Ignore white spaces at the beginning and ending of a line (similar to 'diff -b')
     * * ignoreAllWhiteSpaces - true/false (default: false) - Ignore all white space differences (similar to 'diff -w')
     * * ignoreEmptyLines - true/false (default: false) - Ignores differences caused by empty lines (similar to 'diff -B')
     */
    lineBasedFileCompare: CompareFileHandler;
}

export interface CompareNameHandlers {
    /**
     * Compares file or directory names using the 'strcmp' function.
     * It is used if {@link Options.compareNameHandler} is not specified.
     */
    defaultNameCompare: CompareNameHandler
}

export interface FilterHandlers {
    /**
     * Uses minimatch to include/ignore files based on {@link Options.includeFilter} and {@link Options.excludeFilter}.
     * It is used if {@link Options.filterHandler} is not specified.
     */
    defaultFilterHandler: FilterHandler
}

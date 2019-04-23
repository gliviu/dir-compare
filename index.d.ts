/// <reference types="node" />

import * as fs from "fs";

export function compareSync(path1: string, path2: string, options?: Partial<Options>): Statistics;
export function compare(path1: string, path2: string, options?: Partial<Options>): Promise<Statistics>;

export interface Options {
    /**
     * Properties to be used in various extension points ie. result builder.
     */
    [key: string]: any

    /**
     * Compares files by size. Defaults to 'false'.
     */
    compareSize: boolean;

    /**
     *  Compares files by date of modification (stat.mtime). Defaults to 'false'.
     */
    compareDate: boolean;

    /**
     * Two files are considered to have the same date if the difference between their modification dates fits within date tolerance. Defaults to 1000 ms.
     */
    dateTolerance: number;

    /**
     *  Compares files by content. Defaults to 'false'.
     */
    compareContent: boolean;

    /**
     * Skips sub directories. Defaults to 'false'.
     */
    skipSubdirs: boolean;

    /**
     * Ignore symbolic links. Defaults to 'false'.
     */
    skipSymlinks: boolean;

    /**
     * Ignores case when comparing names. Defaults to 'false'.
     */
    ignoreCase: boolean;

    /**
     * Toggles presence of diffSet in output. If true, only statistics are provided. Use this when comparing large number of files to avoid out of memory situations. Defaults to 'false'.
     */
    noDiffSet: boolean;

    /**
     * File name filter. Comma separated minimatch patterns.
     */
    includeFilter: string;

    /**
     * File/directory name exclude filter. Comma separated minimatch patterns.
     */
    excludeFilter: string;

    /**
     * Callback for constructing result - function (entry1, entry2, state, level, relativePath, options, statistics, diffSet). Called for each compared entry pair. Updates 'statistics' and 'diffSet'.
     */
    resultBuilder: (
        entry1: Entry | undefined,
        entry2: Entry | undefined,
        state: DifferenceState,
        level: number,
        relativePath: string,
        options: Partial<Options>,
        statistics: Statistics,
        diffset: Array<Difference> | undefined
    ) => void;

    /**
     * File comparison handler.
     */
    compareFileSync: CompareFileSync;

    /**
     * File comparison handler.
     */
    compareFileAsync: CompareFileAsync;
}

export interface Entry {
    name: string;
    absolutePath: string;
    path: string;
    stat: fs.Stats;
    lstat: fs.Stats;
    symlink: boolean;
}

export interface Statistics {
    /**
     * Any property is allowed if default result builder is not used.
     */
    [key: string]: any

    /**
     * number of distinct entries.
     */
    distinct: number;

    /**
     * number of equal entries.
     */
    equal: number;

    /**
     * number of entries only in path1.
     */
    left: number;

    /**
     * number of entries only in path2.
     */
    right: number;

    /**
     * total number of differences (distinct+left+right).
     */
    differences: number;

    /**
     * number of distinct files.
     */
    distinctFiles: number;

    /**
     * number of equal files.
     */
    equalFiles: number;

    /**
     * number of files only in path1.
     */
    leftFiles: number;

    /**
     * number of files only in path2
     */
    rightFiles: number;

    /**
     * total number of different files (distinctFiles+leftFiles+rightFiles).
     */
    differencesFiles: number;

    /**
     * number of distinct directories.
     */
    distinctDirs: number;

    /**
     * number of equal directories.
     */
    equalDirs: number;

    /**
     * number of directories only in path1.
     */
    leftDirs: number;

    /**
     * number of directories only in path2.
     */
    rightDirs: number;

    /**
     * total number of different directories (distinctDirs+leftDirs+rightDirs).
     */
    differencesDirs: number;

    /**
     * true if directories are identical.
     */
    same: boolean;

    /**
     * List of changes (present if Options.noDiffSet is false).
     */
    diffSet?: Array<Difference>;
}

export type DifferenceState = "equal" | "left" | "right" | "distinct";
export type DifferenceType = "missing" | "file" | "directory";


export interface DifferenceEqual {
    /**
     * path not including file/directory name; can be relative or absolute depending on call to compare().
     */
    path1: string;

    /**
     * path not including file/directory name; can be relative or absolute depending on call to compare().
     */
    path2: string;

    /**
     * path relative to root.
     */
    relativePath: string;

    /**
     * file/directory name.
     */
    name1: string;

    /**
     * file/directory name.
     */
    name2: string;

    /**
     * one of equal, left, right, distinct.
     */
    state: 'equal';

    /**
     * one of missing, file, directory.
     */
    type1: 'file' | 'directory';

    /**
     * one of missing, file, directory.
     */
    type2: 'file' | 'directory';

    /**
     * file size.
     */
    size1: number;

    /**
     * file size.
     */
    size2: number;

    /**
     * modification date (stat.mtime).
     */
    date1: number;

    /**
     * modification date (stat.mtime).
     */
    date2: number;

    /**
     * depth.
     */
    level: number;
}

export interface DifferenceDistinct {
    path1: string;
    path2: string;
    relativePath: string;
    name1: string;
    name2: string;
    state: 'distinct';
    type1: 'file' | 'directory';
    type2: 'file' | 'directory';
    size1: number;
    size2: number;
    date1: number;
    date2: number;
    level: number;
}

export interface DifferenceLeft {
    path1: string;
    path2: undefined;
    relativePath: string;
    name1: string;
    name2: undefined;
    state: 'left';
    type1: 'file' | 'directory';
    type2: 'missing';
    size1: number;
    size2: undefined;
    date1: number;
    date2: undefined;
    level: number;
}

export interface DifferenceRight {
    path1: undefined;
    path2: string;
    relativePath: string;
    name1: undefined;
    name2: string;
    state: 'right';
    type1: 'missing';
    type2: 'file' | 'directory';
    size1: undefined;
    size2: number;
    date1: undefined;
    date2: number;
    level: number;
}

export type Difference = DifferenceEqual | DifferenceDistinct | DifferenceLeft | DifferenceRight

export type CompareFileSync = (
    path1: string,
    stat1: fs.Stats,
    path2: string,
    stat2: fs.Stats,
    options: Partial<Options>
) => boolean;

export type CompareFileAsync = (
    path1: string,
    stat1: fs.Stats,
    path2: string,
    stat2: fs.Stats,
    options: Partial<Options>
) => Promise<boolean>;

export const fileCompareHandlers: {
    defaultFileCompare: {
        compareSync: CompareFileSync,
        compareAsync: CompareFileAsync
    },
    lineBasedFileCompare: {
        compareSync: CompareFileSync,
        compareAsync: CompareFileAsync
    }
};

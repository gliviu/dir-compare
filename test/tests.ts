import { Difference, Options, Result, Statistics, SymlinkStatistics } from "../src"
import { compare as compareAsync, fileCompareHandlers } from "../src"
import util = require('util')
import path from 'path'
import Streams from 'memory-streams'

export interface DisplayOptions {
    showAll: boolean,
    wholeReport: boolean,
    csv: boolean,
    noDiffIndicator: boolean,
    reason: boolean
}

export interface Test {
    // Test name. This represents also the name of the file holding expected result unless overriden by 'expected' param.
    name: string
    path1: string
    path2: string
    // Short test description.
    description: string
    // Expected result.
    expected: string
    // If defined, specifies substring to be matched against any occurring error.
    expectedError?: string
    // Left/right dirs will be relative to current process.
    withRelativePath: boolean
    // Options sent to library test.
    options: Partial<Options>
    // Display parameters for print method.
    displayOptions: Partial<DisplayOptions>
    // Prints test result. If missing 'defaultPrint()' is used.
    print: (res: Result, writer: Streams.WritableStream, displayOptions: DisplayOptions) => void
    // Do not call checkStatistics() after each library test.
    skipStatisticsCheck: boolean
    // only apply for synchronous compare
    onlySync: boolean
    // only apply for synchronous compare
    onlyAsync: boolean
    // limit test to specific node versions; ie. '>=2.5.0'
    nodeVersionSupport: string
    // exclude platform from run test; by default all platforms are allowed
    excludePlatform: Platform[]
    // Execute hand-written async test
    runAsync: () => Promise<string>
    // Custom validation function
    customValidator: (result: Statistics) => boolean
}

type Platform = 'aix' | 'android' | 'darwin' | 'freebsd' | 'linux' | 'openbsd' | 'sunos' | 'win32' | 'cygwin' | 'netbsd'

export function getTests(testDirPath: string): Partial<Test>[] {
    const res: Partial<Test>[] = [
        {
            name: 'test001_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test001_2', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, csv: true, },
        },
        {
            name: 'test001_3', path1: 'd3', path2: 'd4',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test001_4', path1: 'd4', path2: 'd4',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test001_5', path1: 'd8', path2: 'd9',
            options: { compareSize: true, },
            displayOptions: { showAll: true, },
        },
        {
            name: 'test001_6', path1: 'd8', path2: 'd9',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test001_8', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: {},
        },
        {
            name: 'test001_9', path1: 'd1/a1.txt', path2: 'd2/a1.txt',
            description: 'should compare two files',
            options: { compareSize: true, },
            displayOptions: {},
        },
        {
            name: 'test001_10',
            description: 'should propagate async exception',
            onlyAsync: true,
            runAsync: () => {
                return compareAsync(testDirPath + '/d1', testDirPath + '/none', {})
                    .then(cmpres => { return 'res: ' + JSON.stringify(cmpres) })
                    .catch(() => { return `error occurred` })
            }
        },
        {
            name: 'test001_11', path1: 'd37', path2: 'd38',
            description: 'provides reason when entries are distinct',
            options: { compareSize: true, compareContent: true, forceAsyncContentCompare: true,compareDate: true },
            displayOptions: { showAll: true, reason: true, wholeReport: true },
        },
        {
            name: 'test001_12', path1: 'd37', path2: 'd38',
            description: 'provides reason when entries are distinct (csv)',
            options: { compareSize: true, compareContent: true, forceAsyncContentCompare: true,compareDate: true },
            displayOptions: { showAll: true, reason: true, wholeReport: true, csv: true },
        },


        ////////////////////////////////////////////////////
        // Filters                                        //
        ////////////////////////////////////////////////////
        {
            description: 'include files by name',
            name: 'test002_0', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.e1' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'include files by name; show directories in report',
            name: 'test002_1', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.e1' },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            description: 'exclude directories by name; show directories in report',
            name: 'test002_2', path1: 'd1', path2: 'd10',
            options: { compareSize: true, excludeFilter: '.x' },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            description: 'exclude files by name',
            name: 'test002_3', path1: 'd1', path2: 'd2',
            options: { compareSize: true, excludeFilter: '*.txt' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'exclude files by name; show directories in report',
            name: 'test002_4', path1: 'd1', path2: 'd2',
            options: { compareSize: true, excludeFilter: '*.txt' },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            description: 'exclude files and directories by name with multiple patterns; match names beginning with dot',
            name: 'test002_5', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '*.e1,*.e2' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'exclude files by name with multiple patterns;  match names beginning with dot; show directories in report',
            name: 'test002_6', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '*.e1,*.e2' },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            description: 'include files by path',
            name: 'test002_7', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '**/A2/**/*.e*' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'exclude directories by path',
            name: 'test002_8', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '**/A4/**' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'exclude files by path',
            name: 'test002_9', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '**/A2/**/*.e*' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'simultaneous use of include/exclude patterns',
            name: 'test002_10', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.txt', excludeFilter: 'A2' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'include directories by relative path ("/...")',
            name: 'test002_11', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/A2/**' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'include files by relative path ("/...")',
            name: 'test002_12', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/A2/**/*.txt' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'exclude files and directories by relative path ("/...")',
            name: 'test002_13', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '/A2/**/*.txt,/.A3/**,/A1.e1' },
            displayOptions: { showAll: true, },
        },
        {
            description: 'include all files in root directory',
            name: 'test002_14', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/*' },
            displayOptions: { showAll: true, },
        },

        ////////////////////////////////////////////////////
        // Compare by content                             //
        ////////////////////////////////////////////////////
        {
            name: 'test003_0', path1: 'd11', path2: 'd12',
            options: { compareSize: true, compareContent: true },
            displayOptions: { showAll: true, },
        },
        {
            name: 'test003_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test003_2', path1: 'd39/a', path2: 'd39/b',
            description: 'compare only by content',
            options: { compareSize: false, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },
        {
            name: 'test003_3', path1: 'd39/a', path2: 'd39/b',
            description: 'compare only by size',
            options: { compareSize: true, compareContent: false },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },

        ////////////////////////////////////////////////////
        // Symlinks                                      //
        ////////////////////////////////////////////////////
        {
            name: 'test005_0', path1: 'd13', path2: 'd14',
            options: { compareSize: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_1', path1: 'd17', path2: 'd17',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_1_1', path1: 'd17', path2: 'd17', withRelativePath: true,
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_2', path1: 'd17', path2: 'd17',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_3', path1: 'd17', path2: 'd18',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_4', path1: 'd22', path2: 'd22',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_5', path1: 'd19', path2: 'd19',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_5_1', path1: 'd19', path2: 'd19', withRelativePath: true,
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_6', path1: 'd19', path2: 'd19',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_7', path1: 'd20', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_8', path1: 'd21', path2: 'd21',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_9', path1: 'd20', path2: 'd21',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_10', path1: 'd21', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_11', path1: 'd20', path2: 'd22',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_12', path1: 'd22', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_13', path1: 'd23', path2: 'd23',
            description: 'be able to compare symlinks to files',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_14', path1: 'd24', path2: 'd24',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_15', path1: 'd25', path2: 'd25',
            description: 'do not fail when broken symlinks are encountered and skipSymlinks option is used',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_16', path1: 'd26', path2: 'd27',
            description: 'detect symbolic link loops; loops span between left/right directories',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_17', path1: 'd28', path2: 'd28',
            description: 'detect symbolic link loops; loop back to root directory',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_18', path1: 'd29', path2: 'd30',
            description: 'compare two symlinks',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test005_19', path1: 'd34_symlink/d', path2: 'd34_symlink/d',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },

        ////////////////////////////////////////////////////
        // Broken symlinks                                //
        ////////////////////////////////////////////////////
        {
            name: 'test005_30', path1: '#16/02/b', path2: '#16/02/a',
            description: "evaluate single broken link on both sides as different",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },
        {
            name: 'test005_31', path1: '#16/03/b', path2: '#16/03/a',
            description: "report broken links before files or directories",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },
        {
            name: 'test005_32', path1: '#16/01/a', path2: '#16/01/b',
            description: "handle broken links (left)",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },
        {
            name: 'test005_33', path1: '#16/01/b', path2: '#16/01/a',
            description: "handle broken links (right)",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },
        {
            name: 'test005_34', path1: '#16/03/b', path2: '#16/03/a',
            description: "ignores broken links if skipSymlinks is used",
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
        },


        ////////////////////////////////////////////////////
        // Compare symlinks                               //
        ////////////////////////////////////////////////////
        {
            name: 'test005_50', path1: '#19/01/a', path2: '#19/01/b',
            description: "evaluate identical file symlinks pointing to identical files as equal when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_51', path1: '#19/01/a', path2: '#19/01/b',
            description: "evaluate identical file symlinks pointing to identical files as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_52', path1: '#19/06/a', path2: '#19/06/b',
            description: "evaluate identical file symlinks pointing to different files as different when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_53', path1: '#19/06/a', path2: '#19/06/b',
            description: "evaluate identical file symlinks pointing to different files as different when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_54', path1: '#19/05/a', path2: '#19/05/b',
            description: "evaluate identical directory symlinks as equal when compare-symlink option is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_55', path1: '#19/05/a', path2: '#19/05/b',
            description: "evaluate identical directory symlinks as equal when compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_56_1', path1: '#19/02/a', path2: '#19/02/b',
            description: "evaluate different file symlinks pointing to identical files as distinct when compare-symlink is used (comparing by size)",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_56_2', path1: '#19/02/a', path2: '#19/02/b',
            description: "evaluate different file symlinks pointing to identical files as distinct when compare-symlink is used (comparing by content)",
            options: { compareContent: true, forceAsyncContentCompare: true,compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_57', path1: '#19/02/a', path2: '#19/02/b',
            description: "evaluate different file symlinks pointing to identical files as equal if compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_58', path1: '#19/07/a', path2: '#19/07/b',
            description: "evaluate different directory symlinks as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_59', path1: '#19/07/a', path2: '#19/07/b',
            description: "evaluate different directory symlinks as equal if compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_60', path1: '#19/03/a', path2: '#19/03/b',
            description: "evaluate mixed file/symlink as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_61', path1: '#19/03/a', path2: '#19/03/b',
            description: "evaluate mixed file/symlink as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_62', path1: '#19/08/a', path2: '#19/08/b',
            description: "evaluate mixed directory/symlink as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_63', path1: '#19/08/a', path2: '#19/08/b',
            description: "evaluate mixed directory/symlink as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_64', path1: '#19/04/a', path2: '#19/04/b',
            description: "evaluate mixed file symlink and directory symlink as different when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 0, leftSymlinks: 1, rightSymlinks: 1, differencesSymlinks: 2, totalSymlinks: 2 }),
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_65', path1: '#19/04/a', path2: '#19/04/b',
            description: "evaluate mixed file symlink and directory symlink as different when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
        },
        {
            name: 'test005_66', path1: '#19/07/a', path2: '#19/07/b',
            description: "no symlink is compared if skipSymlink is used",
            options: { compareSize: true, compareSymlink: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, reason: true },
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 0 }),
            excludePlatform: ['win32'],
        },

        ////////////////////////////////////////////////////
        // Skip subdirs                                   //
        ////////////////////////////////////////////////////
        {
            name: 'test006_0', path1: 'd1', path2: 'd2',
            options: { compareSize: true, skipSubdirs: true },
            displayOptions: { showAll: true, },
        },
        {
            name: 'test006_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, skipSubdirs: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        ////////////////////////////////////////////////////
        // Skip empty directories                         //
        ////////////////////////////////////////////////////
        {
            name: 'test006_10', path1: '#43/a', path2: '#43/b',
            description: 'should ignore empty directories',
            options: { compareSize: true, skipEmptyDirs: true },
            displayOptions: { showAll: true, wholeReport: true },
        },
        ////////////////////////////////////////////////////
        // Ignore case                                    //
        ////////////////////////////////////////////////////
        {
            name: 'test007_0', path1: 'd15', path2: 'd16',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test007_1', path1: 'd15', path2: 'd16',
            options: { compareSize: true, ignoreCase: false },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        ////////////////////////////////////////////////////
        // Options handling                               //
        ////////////////////////////////////////////////////
        {
            name: 'test008_1', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: {},
            displayOptions: { wholeReport: true, noDiffIndicator: true },
        },
        {
            name: 'test008_2', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: undefined,
            displayOptions: { wholeReport: true, noDiffIndicator: true },
        },
        {
            name: 'test008_3', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: {},
            displayOptions: { wholeReport: true, noDiffIndicator: true },
        },
        ////////////////////////////////////////////////////
        // Result Builder Callback                        //
        ////////////////////////////////////////////////////
        {
            name: 'test009_1', path1: 'd1', path2: 'd2',
            expected: 'test: 17',
            options: {
                resultBuilder(entry1, entry2, state, level, relativePath, options, statistics) {
                    if (!statistics.test) {
                        statistics.test = 0
                    }
                    statistics.test++
                }
            },
            displayOptions: {},
            skipStatisticsCheck: true,
            print(cmpres, writer) { writer.write('test: ' + cmpres.test); }
        },
        {
            name: 'test009_2', path1: 'd1', path2: 'd2',
            expected: 'diffset: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]',
            options: {
                resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet) {
                    if (!statistics.test) {
                        statistics.test = 0
                    }
                    statistics.test++
                    if (diffSet) {
                        diffSet.push(statistics.test)
                    }
                }
            },
            displayOptions: {},
            skipStatisticsCheck: true,
            print(cmpres, writer) {
                const comparator = (a: Difference, b: Difference): number => {
                    return (a as unknown as number) - (b as unknown as number)
                }
                writer.write(' diffset: ' + JSON.stringify(cmpres.diffSet?.sort(comparator), null, 0));
            }
        },
        ////////////////////////////////////////////////////
        // Compare date                                   //
        ////////////////////////////////////////////////////
        {
            name: 'test010_0', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: false },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_1', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_2', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: false, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_3', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: true, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_4', path1: 'd33/1', path2: 'd33/2',
            description: 'should correctly use tolerance in date comparison',
            options: { compareSize: true, compareDate: true, dateTolerance: 5000 },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_5', path1: 'd33/1', path2: 'd33/2',
            description: 'should correctly use tolerance in date comparison',
            options: { compareSize: true, compareDate: true, dateTolerance: 9000 },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        {
            name: 'test010_6', path1: 'd33/1', path2: 'd33/2',
            description: 'should default to 1000 ms for date tolerance',
            options: { compareSize: true, compareDate: true },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        ////////////////////////////////////////////////////
        // Line by line compare                           //
        ////////////////////////////////////////////////////
        {
            name: 'test011_1', path1: 'd35/lf-spaces', path2: 'd35/crlf-spaces',
            description: 'should ignore line endings',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
            },
            displayOptions: {},
        },
        {
            name: 'test011_1_1', path1: 'd35/crlf-spaces', path2: 'd35/lf-spaces',
            description: 'should ignore line endings (small buffer',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                lineBasedHandlerBufferSize: 2,
            },
            displayOptions: {},
        },
        {
            name: 'test011_2', path1: 'd35/crlf-spaces', path2: 'd35/lf-spaces',
            description: 'should not ignore line endings',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: false,
            },
            displayOptions: {},
        },
        {
            name: 'test011_3', path1: 'd35/lf-spaces', path2: 'd35/lf-tabs',
            description: 'should ignore white spaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_4', path1: 'd35/crlf-spaces', path2: 'd35/lf-tabs',
            description: 'should ignore white spaces and line endings',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_5', path1: 'd35/lf-spaces', path2: 'd35/lf-tabs',
            description: 'should not ignore white spaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_6', path1: 'd35/lf-spaces', path2: 'd35/lf-mix',
            description: 'should ignore mixed white spaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_7', path1: 'd35/lf-tabs', path2: 'd35/lf-mix',
            description: 'should ignore mixed white spaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_8', path1: 'd35/lf-spaces', path2: 'd35/lf-spaces-inside',
            description: 'should not ignore white spaces situated inside line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_20', path1: 'd35/single-line/single-line-lf', path2: 'd35/single-line/single-line-crlf',
            description: 'should ignore line endings for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_21', path1: 'd35/single-line/single-line-lf', path2: 'd35/single-line/single-line-crlf',
            description: 'should ignore line endings for files with single line if buffer size is smaller than line size',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_22', path1: 'd35/single-line/single-line-lf', path2: 'd35/single-line/single-line-crlf',
            description: 'should not ignore line endings for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: false,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_23', path1: 'd35/single-line/single-line-lf', path2: 'd35/single-line/single-line-no-line-ending',
            description: 'should ignore line endings when comparing file with single line (lf) and file with single line (no line ending)',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_24', path1: 'd35/single-line/single-line-crlf', path2: 'd35/single-line/single-line-no-line-ending',
            description: 'should ignore line endings when comparing file with single line (crlf) and file with single line (no line ending)',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_25', path1: 'd35/single-line/single-line-no-line-ending', path2: 'd35/single-line/single-line-no-line-ending',
            description: 'should ignore line endings when comparing two files with single line and no line endings',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_26', path1: 'd35/single-line/single-line-no-line-ending', path2: 'd35/single-line/single-line-no-line-ending',
            description: 'should ignore line endings when comparing two files with single line and no line endings, buffer size less than line size',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_27', path1: 'd35/single-line/single-line-lf', path2: 'd35/single-line/single-line-crlf-spaces',
            description: 'should ignore line endings amd spaces for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_28', path1: 'd35/single-line/single-line-crlf', path2: 'd35/single-line/single-line-crlf-spaces',
            description: 'should ignore line endings amd spaces for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_29', path1: 'd35/single-line/single-line-no-line-ending', path2: 'd35/single-line/single-line-crlf-spaces',
            description: 'should ignore line endings amd spaces for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_30', path1: 'd35/single-line/single-line-no-line-ending', path2: 'd35/single-line/single-line-no-line-ending-spaces',
            description: 'should ignore line endings amd spaces for files with single line',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_50', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-no-ending-lf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_51', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-no-ending-lf',
            description: 'should not ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: false,
                ignoreWhiteSpaces: false
            },
            displayOptions: {},
        },
        {
            name: 'test011_52', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-no-ending-spaces-crlf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },

        {
            name: 'test011_53', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-no-ending-spaces-lf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_54', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-with-ending-crlf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_55', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-with-ending-lf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true
            },
            displayOptions: {},
        },
        {
            name: 'test011_56', path1: 'd35/last-line-no-ending/last-line-no-ending-crlf', path2: 'd35/last-line-no-ending/last-line-no-ending-spaces-crlf',
            description: 'should ignore line endings amd spaces for files where last line has no ending',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: true,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_70', path1: 'd35/#29-ignore-all-whitespaces/a/app.ts', path2: 'd35/#29-ignore-all-whitespaces/b/app.ts',
            description: 'should ignore all white spaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                ignoreAllWhiteSpaces: true,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_71', path1: 'd35/#29-ignore-all-whitespaces/a/app.ts', path2: 'd35/#29-ignore-all-whitespaces/c/app.ts',
            description: 'should not ignore empty lines if `ignore all whitespaces` is active',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                ignoreAllWhiteSpaces: true,
                ignoreEmptyLines: false,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_72', path1: 'd35/#29-ignore-all-whitespaces/a/app.ts', path2: 'd35/#29-ignore-all-whitespaces/c/app.ts',
            description: 'should ignore empty lines and all whitespaces',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                ignoreAllWhiteSpaces: true,
                ignoreEmptyLines: true,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_80', path1: 'd35/#29-ignore-empty-lines/a-lf/app.ts', path2: 'd35/#29-ignore-empty-lines/b-lf/app.ts',
            description: 'should ignore empty lines',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: false,
                ignoreWhiteSpaces: false,
                ignoreAllWhiteSpaces: false,
                ignoreEmptyLines: true,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        {
            name: 'test011_81', path1: 'd35/#29-ignore-empty-lines/a-lf/app.ts', path2: 'd35/#29-ignore-empty-lines/b-crlf/app.ts',
            description: 'should ignore empty lines when line endings are different',
            options: {
                compareContent: true,
                compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                ignoreLineEnding: true,
                ignoreWhiteSpaces: false,
                ignoreAllWhiteSpaces: false,
                ignoreEmptyLines: true,
                lineBasedHandlerBufferSize: 3
            },
            displayOptions: {},
        },
        ////////////////////////////////////////////////////
        // Relative paths                                 //
        ////////////////////////////////////////////////////
        {
            name: 'test012_0', path1: 'd1', path2: 'd2',
            description: 'should report relative paths',
            options: {},
            withRelativePath: true,
            print(cmpres, writer) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
        {
            name: 'test012_1', path1: 'd1/A6/../../d1', path2: 'd2',
            description: 'should report absolute paths',
            options: {},
            withRelativePath: false,
            print(cmpres, writer) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
        {
            name: 'test012_2', path1: testDirPath + '/d1', path2: 'd2',
            description: 'should report absolute and relative paths',
            options: {},
            withRelativePath: true,
            print(cmpres, writer) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
        ////////////////////////////////////////////////////
        // Custom name comparator                         //
        ////////////////////////////////////////////////////
        {
            name: 'test013_1', path1: 'd40/a', path2: 'd40/b',
            description: 'should use custom name comparator (node <11>)',
            // Older node versions do not have stable sort order.
            // See https://github.com/nodejs/node/pull/22754#issuecomment-419551068
            // File order is not considered in this test.
            nodeVersionSupport: '<11',
            options: {
                compareContent: true,
                compareNameHandler: customNameCompare,
                ignoreExtension: true
            },
            displayOptions: { wholeReport: true, },
        },
        {
            name: 'test013_2', path1: 'd40/a', path2: 'd40/b',
            description: 'should use custom name comparator (node >11',
            nodeVersionSupport: '>=11',
            options: {
                compareContent: true,
                compareNameHandler: customNameCompare,
                ignoreExtension: true
            },
            displayOptions: { showAll: true, wholeReport: true, },
        },
        ////////////////////////////////////////////////////
        // Compare mode (directories/files/mixt)          //
        ////////////////////////////////////////////////////
        {
            name: 'test014_1', path1: '#48/01/index1.html', path2: '#48/01/index1.html',
            description: 'should compare two files with same name',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_2', path1: '#48/01/index1.html', path2: '#48/01/index2.html',
            description: 'should compare two files with different name',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_3', path1: '#48/01/index1.html', path2: '#48/01/index2.html',
            description: 'should compare two files by content',
            options: { compareContent: true, forceAsyncContentCompare: true,},
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_4', path1: '#48/01/index1_symlink.html', path2: '#48/01/index2.html',
            description: 'should compare one symlink and one file',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_5', path1: '#48/01/index1_symlink.html', path2: '#48/01/index2.html',
            description: 'should compare one symlink and one file by content',
            options: { compareContent: true, forceAsyncContentCompare: true,},
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_6', path1: '#48/01/index1_symlink.html', path2: '#48/01/index2_symlink.html',
            description: 'should compare two symlinks pointing to files',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_7', path1: '#48/01/index1_symlink.html', path2: '#48/01/index2_symlink.html',
            description: 'should compare two symlinks pointing to files by content',
            options: { compareContent: true, forceAsyncContentCompare: true,},
            displayOptions: {wholeReport: true, showAll: true},
        },
        {
            name: 'test014_8', path1: '#48/01/index1_symlink.html', path2: '#48/01/broken_symlink.html',
            description: 'should fail if file is compared with broken symlink',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
            expectedError: 'ENOENT'
        },
        {
            name: 'test014_9', path1: '#48/01/index1_symlink.html', path2: '#48/01/missing_file',
            description: 'should fail if file is compared with missing entry',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
            expectedError: 'ENOENT'
        },
        {
            name: 'test014_10', path1: '#48/01/index1.html', path2: '#48/01',
            description: 'should compare file to directory',
            options: { compareSize: true, },
            displayOptions: {wholeReport: true, showAll: true},
        },
    ]
    return res
}

function customNameCompare(name1: string, name2: string, options: Options) {
    if (options.ignoreCase) {
        name1 = name1.toLowerCase()
        name2 = name2.toLowerCase()
    }
    if (options.ignoreExtension) {
        name1 = path.basename(name1, path.extname(name1))
        name2 = path.basename(name2, path.extname(name2))
    }
    return ((name1 === name2) ? 0 : ((name1 > name2) ? 1 : -1))
}

function printRelativePathResult(res, testDirPath, writer) {
    let result = res.diffSet.map(diff =>
        util.format('path1: %s, path2: %s', diff.path1, diff.path2))
    result = JSON.stringify(result)
    result = result.replace(/\\\\/g, "/")
    result = result.replace(new RegExp(testDirPath.replace(/\\/g, "/"), 'g'), 'absolute_path')
    writer.write(result)
}


function validateSymlinks(expected: SymlinkStatistics | undefined, actual: SymlinkStatistics) {
    return JSON.stringify(expected) === JSON.stringify(actual)
}
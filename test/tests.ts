import { Options, Statistics, SymlinkStatistics } from "../src"
import { compare as compareAsync, fileCompareHandlers } from "../src"
import util = require('util')

export interface DisplayOptions {
    showAll: boolean,
    wholeReport: boolean,
    nocolors: boolean,
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
    // Left/right dirs will be relative to current process.
    withRelativePath: boolean
    // Options sent to library test. Should match 'commandLineOptions.
    options: Partial<Options>
    // Options sent to command line test. Should match 'options'.
    commandLineOptions: string
    // Command line expected exit code.
    exitCode: number
    // Display parameters for print method.
    displayOptions: Partial<DisplayOptions>
    // Prints test result. If missing 'defaultPrint()' is used.
    print: any
    // Test is run only on API methods.
    onlyLibrary: boolean
    // Test is run only on command line.
    onlyCommandLine: boolean
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

export function getTests(testDirPath) {
    const res: Array<Partial<Test>> = [
        {
            name: 'test001_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test001_2', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, csv: true, nocolors: true },
            commandLineOptions: '-aw --csv',
            exitCode: 1,
        },
        {
            name: 'test001_3', path1: 'd3', path2: 'd4',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test001_4', path1: 'd4', path2: 'd4',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test001_5', path1: 'd8', path2: 'd9',
            options: { compareSize: true, },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a',
            exitCode: 1,
        },
        {
            name: 'test001_6', path1: 'd8', path2: 'd9',
            options: { compareSize: true, },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test001_8', path1: 'd1', path2: 'd2',
            options: { compareSize: true, },
            displayOptions: { nocolors: true },
            commandLineOptions: '',
            exitCode: 1,
        },
        {
            name: 'test001_9', path1: 'd1/a1.txt', path2: 'd2/a1.txt',
            description: 'should compare two files',
            options: { compareSize: true, },
            displayOptions: { nocolors: true },
            commandLineOptions: '',
            exitCode: 0,
        },
        {
            name: 'test001_10',
            description: 'should propagate async exception',
            onlyAsync: true,
            onlyLibrary: true,
            runAsync: () => {
                return compareAsync(testDirPath + '/d1', testDirPath + '/none', {})
                    .then(function (cmpres) { return 'res: ' + JSON.stringify(cmpres) })
                    .catch(function (error) { return 'error occurred' })
            }
        },
        {
            name: 'test001_11', path1: 'd37', path2: 'd38',
            description: 'provides reason when entries are distinct',
            options: { compareSize: true, compareContent: true, compareDate: true },
            displayOptions: { showAll: true, nocolors: true, reason: true, wholeReport: true },
            commandLineOptions: '-awcD --reason',
            exitCode: 1,
        },
        {
            name: 'test001_12', path1: 'd37', path2: 'd38',
            description: 'provides reason when entries are distinct (csv)',
            options: { compareSize: true, compareContent: true, compareDate: true },
            displayOptions: { showAll: true, nocolors: true, reason: true, wholeReport: true, csv: true },
            commandLineOptions: '-awcD --csv',
            exitCode: 1,
        },


        ////////////////////////////////////////////////////
        // Filters                                        //
        ////////////////////////////////////////////////////
        {
            description: 'include files by name',
            name: 'test002_0', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.e1' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "*.e1"',
            exitCode: 1,
        },
        {
            description: 'include files by name; show directories in report',
            name: 'test002_1', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.e1' },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw -f "*.e1"',
            exitCode: 1,
        },
        {
            description: 'exclude directories by name; show directories in report',
            name: 'test002_2', path1: 'd1', path2: 'd10',
            options: { compareSize: true, excludeFilter: '.x' },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw -x .x',
            exitCode: 1,
        },
        {
            description: 'exclude files by name',
            name: 'test002_3', path1: 'd1', path2: 'd2',
            options: { compareSize: true, excludeFilter: '*.txt' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -x "*.txt"',
            exitCode: 1,
        },
        {
            description: 'exclude files by name; show directories in report',
            name: 'test002_4', path1: 'd1', path2: 'd2',
            options: { compareSize: true, excludeFilter: '*.txt' },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw -x "*.txt"',
            exitCode: 1,
        },
        {
            description: 'exclude files and directories by name with multiple patterns; match names beginning with dot',
            name: 'test002_5', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '*.e1,*.e2' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -x "*.e1,*.e2"',
            exitCode: 1,
        },
        {
            description: 'exclude files by name with multiple patterns;  match names beginning with dot; show directories in report',
            name: 'test002_6', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '*.e1,*.e2' },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw -x "*.e1,*.e2"',
            exitCode: 1,
        },
        {
            description: 'include files by path',
            name: 'test002_7', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '**/A2/**/*.e*' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "**/A2/**/*.e*"',
            exitCode: 1,
        },
        {
            description: 'exclude directories by path',
            name: 'test002_8', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '**/A4/**' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -x "**/A4/**"',
            exitCode: 1,
        },
        {
            description: 'exclude files by path',
            name: 'test002_9', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '**/A2/**/*.e*' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -x "**/A2/**/*.e*"',
            exitCode: 1,
        },
        {
            description: 'simultaneous use of include/exclude patterns',
            name: 'test002_10', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '*.txt', excludeFilter: 'A2' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "*.txt" -x A2',
            exitCode: 1,
        },
        {
            description: 'include directories by relative path ("/...")',
            name: 'test002_11', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/A2/**' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "/A2/**"',
            exitCode: 1,
        },
        {
            description: 'include files by relative path ("/...")',
            name: 'test002_12', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/A2/**/*.txt' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "/A2/**/*.txt"',
            exitCode: 1,
        },
        {
            description: 'exclude files and directories by relative path ("/...")',
            name: 'test002_13', path1: 'd6', path2: 'd7',
            options: { compareSize: true, excludeFilter: '/A2/**/*.txt,/.A3/**,/A1.e1' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -x "/A2/**/*.txt,/.A3/**,/A1.e1"',
            exitCode: 1,
        },
        {
            description: 'include all files in root directory',
            name: 'test002_14', path1: 'd6', path2: 'd7',
            options: { compareSize: true, includeFilter: '/*' },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-a -f "/*"',
            exitCode: 1,
        },

        ////////////////////////////////////////////////////
        // Compare by content                             //
        ////////////////////////////////////////////////////
        {
            name: 'test003_0', path1: 'd11', path2: 'd12',
            options: { compareSize: true, compareContent: true },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-ac',
            exitCode: 1,
        },
        {
            name: 'test003_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awc',
            exitCode: 1,
        },
        {
            name: 'test003_2', path1: 'd39/a', path2: 'd39/b',
            description: 'compare only by content',
            options: { compareSize: false, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            onlyLibrary: true,
        },
        {
            name: 'test003_3', path1: 'd39/a', path2: 'd39/b',
            description: 'compare only by size',
            options: { compareSize: true, compareContent: false },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            exitCode: 1,
        },
        ////////////////////////////////////////////////////
        // Command line                                   //
        ////////////////////////////////////////////////////
        {
            name: 'test004_0', path1: 'd11', path2: 'd11',
            onlyCommandLine: true,
            commandLineOptions: '',
            exitCode: 0,
        },
        {
            name: 'test004_1', path1: 'd11', path2: 'd12',
            onlyCommandLine: true,
            commandLineOptions: '-c',
            exitCode: 1,
        },
        {
            name: 'test004_2', path1: 'd11', path2: 'd11',
            onlyCommandLine: true,
            commandLineOptions: '--WRONGCMD ',
            exitCode: 2,
        },
        {
            name: 'test004_3', path1: 'd11', path2: '',
            onlyCommandLine: true,
            commandLineOptions: '',
            exitCode: 2,
        },
        {
            name: 'test004_4', path1: 'd11', path2: 'miss',
            onlyCommandLine: true,
            commandLineOptions: '',
            exitCode: 2,
        },
        {
            name: 'test004_5', path1: 'd11', path2: 'd1',
            onlyCommandLine: true,
            commandLineOptions: '-ABCD',
            exitCode: 2,
        },
        {
            name: 'test004_6', path1: 'd11', path2: 'd1',
            onlyCommandLine: true,
            commandLineOptions: '-ABCD --csv',
            exitCode: 2,
        },
        {
            name: 'test004_7', path1: 'd11', path2: 'd1',
            onlyCommandLine: true,
            commandLineOptions: '--csv -ABCD --csv',
            exitCode: 2,
        },
        {
            name: 'test004_8', path1: 'd11', path2: 'd1',
            onlyCommandLine: true,
            commandLineOptions: '--csv -ABCD',
            exitCode: 2,
        },
        {
            name: 'test004_9', path1: 'd11', path2: 'd1',
            onlyCommandLine: true,
            commandLineOptions: '--ABC --async -x --async',
            exitCode: 2,
        },

        ////////////////////////////////////////////////////
        // Symlinks                                      //
        ////////////////////////////////////////////////////
        {
            name: 'test005_0', path1: 'd13', path2: 'd14',
            options: { compareSize: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awL',
            exitCode: 1,
        },
        {
            name: 'test005_1', path1: 'd17', path2: 'd17',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_1_1', path1: 'd17', path2: 'd17', withRelativePath: true,
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_2', path1: 'd17', path2: 'd17',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awL',
            exitCode: 0,
        },
        {
            name: 'test005_3', path1: 'd17', path2: 'd18',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_4', path1: 'd22', path2: 'd22',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_5', path1: 'd19', path2: 'd19',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_5_1', path1: 'd19', path2: 'd19', withRelativePath: true,
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_6', path1: 'd19', path2: 'd19',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awL',
            exitCode: 0,
        },
        {
            name: 'test005_7', path1: 'd20', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_8', path1: 'd21', path2: 'd21',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_9', path1: 'd20', path2: 'd21',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_10', path1: 'd21', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_11', path1: 'd20', path2: 'd22',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_12', path1: 'd22', path2: 'd20',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_13', path1: 'd23', path2: 'd23',
            description: 'be able to compare symlinks to files',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_14', path1: 'd24', path2: 'd24',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_15', path1: 'd25', path2: 'd25',
            description: 'do not fail when broken symlinks are encountered and skipSymlinks option is used',
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw --skip-symlinks',
            exitCode: 0,
        },
        {
            name: 'test005_16', path1: 'd26', path2: 'd27',
            description: 'detect symbolic link loops; loops span between left/right directories',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        {
            name: 'test005_17', path1: 'd28', path2: 'd28',
            description: 'detect symbolic link loops; loop back to root directory',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_18', path1: 'd29', path2: 'd30',
            description: 'compare two symlinks',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test005_19', path1: 'd34_symlink/d', path2: 'd34_symlink/d',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },

        ////////////////////////////////////////////////////
        // Broken symlinks                                //
        ////////////////////////////////////////////////////
        {
            name: 'test005_30', path1: '#16/02/b', path2: '#16/02/a',
            description: "evaluate single broken link on both sides as different",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            exitCode: 1,
        },
        {
            name: 'test005_31', path1: '#16/03/b', path2: '#16/03/a',
            description: "report broken links before files or directories",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            exitCode: 1,
        },
        {
            name: 'test005_32', path1: '#16/01/a', path2: '#16/01/b',
            description: "handle broken links (left)",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            exitCode: 1,
        },
        {
            name: 'test005_33', path1: '#16/01/b', path2: '#16/01/a',
            description: "handle broken links (right)",
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            exitCode: 1,
        },
        {
            name: 'test005_34', path1: '#16/03/b', path2: '#16/03/a',
            description: "ignores broken links if skipSymlinks is used",
            options: { compareSize: true, ignoreCase: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --skip-symlinks',
            exitCode: 0,
        },
        {
            name: 'test005_35', path1: '#16/01/a', path2: '#16/01/b',
            description: "count broken links when no option is used in cli",
            options: { compareSize: true },
            commandLineOptions: '',
            onlyCommandLine: true,
            exitCode: 1,
        },

        ////////////////////////////////////////////////////
        // Compare symlinks                               //
        ////////////////////////////////////////////////////
        {
            name: 'test005_50', path1: '#19/01/a', path2: '#19/01/b',
            description: "evaluate identical file symlinks pointing to identical files as equal when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_51', path1: '#19/01/a', path2: '#19/01/b',
            description: "evaluate identical file symlinks pointing to identical files as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_52', path1: '#19/06/a', path2: '#19/06/b',
            description: "evaluate identical file symlinks pointing to different files as different when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_53', path1: '#19/06/a', path2: '#19/06/b',
            description: "evaluate identical file symlinks pointing to different files as different when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_54', path1: '#19/05/a', path2: '#19/05/b',
            description: "evaluate identical directory symlinks as equal when compare-symlink option is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 1, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_55', path1: '#19/05/a', path2: '#19/05/b',
            description: "evaluate identical directory symlinks as equal when compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_56', path1: '#19/02/a', path2: '#19/02/b',
            description: "evaluate different file symlinks pointing to identical files as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_57', path1: '#19/02/a', path2: '#19/02/b',
            description: "evaluate different file symlinks pointing to identical files as equal if compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_58', path1: '#19/07/a', path2: '#19/07/b',
            description: "evaluate different directory symlinks as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_59', path1: '#19/07/a', path2: '#19/07/b',
            description: "evaluate different directory symlinks as equal if compare-symlink option is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_60', path1: '#19/03/a', path2: '#19/03/b',
            description: "evaluate mixed file/symlink as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_61', path1: '#19/03/a', path2: '#19/03/b',
            description: "evaluate mixed file/symlink as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_62', path1: '#19/08/a', path2: '#19/08/b',
            description: "evaluate mixed directory/symlink as distinct when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 1, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 1, totalSymlinks: 1 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_63', path1: '#19/08/a', path2: '#19/08/b',
            description: "evaluate mixed directory/symlink as equal when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 0,
        },
        {
            name: 'test005_64', path1: '#19/04/a', path2: '#19/04/b',
            description: "evaluate mixed file symlink and directory symlink as different when compare-symlink is used",
            options: { compareSize: true, compareSymlink: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 0, leftSymlinks: 1, rightSymlinks: 1, differencesSymlinks: 2, totalSymlinks: 2 }),
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_65', path1: '#19/04/a', path2: '#19/04/b',
            description: "evaluate mixed file symlink and directory symlink as different when compare-symlink is not used",
            options: { compareSize: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason',
            customValidator: stats => !stats.symlinks,
            excludePlatform: ['win32'],
            exitCode: 1,
        },
        {
            name: 'test005_66', path1: '#19/07/a', path2: '#19/07/b',
            description: "no symlink is compared if skipSymlink is used",
            options: { compareSize: true, compareSymlink: true, skipSymlinks: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true, reason: true },
            commandLineOptions: '-aw --reason --compare-symlink --skip-symlinks',
            customValidator: stats => validateSymlinks(stats.symlinks, { distinctSymlinks: 0, equalSymlinks: 0, leftSymlinks: 0, rightSymlinks: 0, differencesSymlinks: 0, totalSymlinks: 0 }),
            excludePlatform: ['win32'],
            exitCode: 0,
        },

        ////////////////////////////////////////////////////
        // Skip subdirs                                   //
        ////////////////////////////////////////////////////
        {
            name: 'test006_0', path1: 'd1', path2: 'd2',
            options: { compareSize: true, skipSubdirs: true },
            displayOptions: { showAll: true, nocolors: true },
            commandLineOptions: '-aS',
            exitCode: 1,
        },
        {
            name: 'test006_1', path1: 'd1', path2: 'd2',
            options: { compareSize: true, skipSubdirs: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awS',
            exitCode: 1,
        },
        ////////////////////////////////////////////////////
        // Ignore case                                    //
        ////////////////////////////////////////////////////
        {
            name: 'test007_0', path1: 'd15', path2: 'd16',
            options: { compareSize: true, ignoreCase: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awi',
            exitCode: 0,
        },
        {
            name: 'test007_1', path1: 'd15', path2: 'd16',
            options: { compareSize: true, ignoreCase: false },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 1,
        },
        ////////////////////////////////////////////////////
        // Options handling                               //
        ////////////////////////////////////////////////////
        {
            name: 'test008_1', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: {},
            displayOptions: { wholeReport: true, nocolors: true, noDiffIndicator: true },
            onlyLibrary: true,
        },
        {
            name: 'test008_2', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: undefined,
            displayOptions: { wholeReport: true, nocolors: true, noDiffIndicator: true },
            onlyLibrary: true,
        },
        {
            name: 'test008_3', path1: 'd1', path2: 'd2',
            expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
            options: {},
            displayOptions: { wholeReport: true, nocolors: true, noDiffIndicator: true },
            onlyLibrary: true,
        },
        ////////////////////////////////////////////////////
        // Result Builder Callback                        //
        ////////////////////////////////////////////////////
        {
            name: 'test009_1', path1: 'd1', path2: 'd2',
            expected: 'test: 17',
            options: {
                resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet) {
                    if (!statistics.test) {
                        statistics.test = 0
                    }
                    statistics.test++
                }
            },
            displayOptions: {},
            onlyLibrary: true,
            skipStatisticsCheck: true,
            print(cmpres, writer, program) { writer.write('test: ' + cmpres.test); }
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
            onlyLibrary: true,
            skipStatisticsCheck: true,
            print(cmpres, writer, program) { writer.write(' diffset: ' + JSON.stringify(cmpres.diffSet.sort(function (a, b) { return a - b; }), null, 0)); }
        },
        ////////////////////////////////////////////////////
        // Compare date                                   //
        ////////////////////////////////////////////////////
        {
            name: 'test010_0', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: false },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-aw',
            exitCode: 0,
        },
        {
            name: 'test010_1', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awD',
            exitCode: 1,
        },
        {
            name: 'test010_2', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: false, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awc',
            exitCode: 1,
        },
        {
            name: 'test010_3', path1: 'd31', path2: 'd32',
            options: { compareSize: true, compareDate: true, compareContent: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awcD',
            exitCode: 1,
        },
        {
            name: 'test010_4', path1: 'd33/1', path2: 'd33/2',
            description: 'should correctly use tolerance in date comparison',
            options: { compareSize: true, compareDate: true, dateTolerance: 5000 },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awD --date-tolerance 5000',
            exitCode: 1,
        },
        {
            name: 'test010_5', path1: 'd33/1', path2: 'd33/2',
            description: 'should correctly use tolerance in date comparison',
            options: { compareSize: true, compareDate: true, dateTolerance: 9000 },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awD --date-tolerance 9000',
            exitCode: 0,
        },
        {
            name: 'test010_6', path1: 'd33/1', path2: 'd33/2',
            description: 'should default to 1000 ms for date tolerance',
            options: { compareSize: true, compareDate: true },
            displayOptions: { showAll: true, wholeReport: true, nocolors: true },
            commandLineOptions: '-awD',
            exitCode: 1,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
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
            displayOptions: { nocolors: true },
            onlyLibrary: true,
        },
        ////////////////////////////////////////////////////
        // Relative paths                                 //
        ////////////////////////////////////////////////////
        {
            name: 'test012_0', path1: 'd1', path2: 'd2',
            description: 'should report relative paths',
            options: {},
            onlyLibrary: true,
            withRelativePath: true,
            print(cmpres, writer, program) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
        {
            name: 'test012_1', path1: 'd1/A6/../../d1', path2: 'd2',
            description: 'should report absolute paths',
            options: {},
            onlyLibrary: true,
            withRelativePath: false,
            print(cmpres, writer, program) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
        {
            name: 'test012_2', path1: testDirPath + '/d1', path2: 'd2',
            description: 'should report absolute and relative paths',
            options: {},
            onlyLibrary: true,
            withRelativePath: true,
            print(cmpres, writer, program) { printRelativePathResult(cmpres, testDirPath, writer) }
        },
    ]
    return res
}


function printRelativePathResult(res, testDirPath, writer) {
    let result = res.diffSet.map(function (diff) {
        return util.format('path1: %s, path2: %s',
            diff.path1, diff.path2)
    })
    result = JSON.stringify(result)
    result = result.replace(/\\\\/g, "/")
    result = result.replace(new RegExp(testDirPath.replace(/\\/g, "/"), 'g'), 'absolute_path')
    writer.write(result)
}


function validateSymlinks(expected: SymlinkStatistics | undefined, actual: SymlinkStatistics) {
    return JSON.stringify(expected) === JSON.stringify(actual)
}
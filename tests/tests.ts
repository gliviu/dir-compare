import { Options } from "..";
import { compare as compareAsync, fileCompareHandlers} from "..";
import util = require('util');

export interface DisplayOptions {
    showAll: boolean,
    wholeReport: boolean,
    nocolors: boolean,
    csv: boolean,
    noDiffIndicator: boolean
}

export interface Test {
    // Test name. This represents also the name of the file holding expected result unless overriden by 'expected' param.
    name: string,
    path1: string,
    path2: string,
    // Short test description.
    description: string,
    // Expected result.
    expected: string,
    // Left/right dirs will be relative to current process.
    withRelativePath: boolean,
    // Options sent to library test. Should match 'commandLineOptions.
    options: Partial<Options>,
    // Options sent to command line test. Should match 'options'.
    commandLineOptions: string
    // Command line expected exit code.
    exitCode: number,
    // Display parameters for print method.
    displayOptions: Partial<DisplayOptions>,
    // Prints test result. If missing 'defaultPrint()' is used.
    print: any,
    // Test is run only on API methods.
    onlyLibrary: boolean,
    // Test is run only on command line.
    onlyCommandLine: boolean,
    // Do not call checkStatistics() after each library test.
    skipStatisticsCheck: boolean,
    // only apply for synchronous compare
    onlySync: boolean,
    // only apply for synchronous compare
    onlyAsync: boolean,
    // limit test to specific node versions; ie. '>=2.5.0'
    nodeVersionSupport: boolean,
    // Execute hand-written async test
    runAsync: () => Promise<string>
}

export function getTests(testDirPath){
    const res : Array<Partial<Test>> = [
             {
                 name: 'test001_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_2', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, csv: true, nocolors: true},
                 commandLineOptions: '-aw --csv',
                 exitCode: 1,
             },
             {
                 name: 'test001_3', path1: 'd3', path2: 'd4',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_4', path1: 'd4', path2: 'd4',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test001_5', path1: 'd8', path2: 'd9',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a',
                 exitCode: 1,
             },
             {
                 name: 'test001_6', path1: 'd8', path2: 'd9',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_8', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {nocolors: true},
                 commandLineOptions: '',
                 exitCode: 1,
             },
             {
                 name: 'test001_9', path1: 'd1/a1.txt', path2: 'd2/a1.txt',
                 description: 'should compare two files',
                 options: {compareSize: true,},
                 displayOptions: {nocolors: true},
                 commandLineOptions: '',
                 exitCode: 0,
             },
             {
                 name: 'test001_10',
                 description: 'should propagate async exception',
                 onlyAsync: true,
                 onlyLibrary: true,
                 runAsync: () => {
                     return compareAsync(testDirPath+'/d1', testDirPath+'/none', {})
                     .then(function(cmpres){return 'res: ' + JSON.stringify(cmpres)})
                     .catch(function(error){return 'error occurred'})
                 }
             },


             ////////////////////////////////////////////////////
             // Filters                                        //
             ////////////////////////////////////////////////////
             {
                 description: 'include files by name',
                 name: 'test002_0', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -f "*.e1"',
                 exitCode: 1,
             },
             {
                description: 'include files by name; show directories in report',
                name: 'test002_1', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '*.e1'},
                displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                commandLineOptions: '-aw -f "*.e1"',
                exitCode: 1,
            },
            {
                 description: 'exclude directories by name; show directories in report',
                 name: 'test002_2', path1: 'd1', path2: 'd10',
                 options: {compareSize: true, excludeFilter: '.x'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x .x',
                 exitCode: 1,
             },
             {
                 description: 'exclude files by name',
                 name: 'test002_3', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x "*.txt"',
                 exitCode: 1,
             },
             {
                 description: 'exclude files by name; show directories in report',
                 name: 'test002_4', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x "*.txt"',
                 exitCode: 1,
             },
             {
                 description: 'exclude files and directories by name with multiple patterns; match names beginning with dot',
                 name: 'test002_5', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x "*.e1,*.e2"',
                 exitCode: 1,
             },
             {
                 description: 'exclude files by name with multiple patterns;  match names beginning with dot; show directories in report',
                 name: 'test002_6', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x "*.e1,*.e2"',
                 exitCode: 1,
             },
             {
                description: 'include files by path',
                name: 'test002_7', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '**/A2/**/*.e*'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -f "**/A2/**/*.e*"',
                exitCode: 1,
            },
            {
                description: 'exclude directories by path',
                name: 'test002_8', path1: 'd6', path2: 'd7',
                options: {compareSize: true, excludeFilter: '**/A4/**'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -x "**/A4/**"',
                exitCode: 1,
            },
            {
                description: 'exclude files by path',
                name: 'test002_9', path1: 'd6', path2: 'd7',
                options: {compareSize: true, excludeFilter: '**/A2/**/*.e*'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -x "**/A2/**/*.e*"',
                exitCode: 1,
            },
            {
                description: 'simultaneous use of include/exclude patterns',
                name: 'test002_10', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '*.txt' , excludeFilter: 'A2'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -f "*.txt" -x A2',
                exitCode: 1,
            },
            {
                description: 'include directories by relative path ("/...")',
                name: 'test002_11', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '/A2/**'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -f "/A2/**"',
                exitCode: 1,
            },
            {
                description: 'include files by relative path ("/...")',
                name: 'test002_12', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '/A2/**/*.txt'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -f "/A2/**/*.txt"',
                exitCode: 1,
            },
            {
                description: 'exclude files and directories by relative path ("/...")',
                name: 'test002_13', path1: 'd6', path2: 'd7',
                options: {compareSize: true, excludeFilter: '/A2/**/*.txt,/.A3/**,/A1.e1'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -x "/A2/**/*.txt,/.A3/**,/A1.e1"',
                exitCode: 1,
            },
            {
                description: 'include all files in root directory',
                name: 'test002_14', path1: 'd6', path2: 'd7',
                options: {compareSize: true, includeFilter: '/*'},
                displayOptions: {showAll: true, nocolors: true},
                commandLineOptions: '-a -f "/*"',
                exitCode: 1,
            },

             ////////////////////////////////////////////////////
             // Compare by content                             //
             ////////////////////////////////////////////////////
             // TODO: add test with compareSize: false, compareContent: true
             {
                 name: 'test003_0', path1: 'd11', path2: 'd12',
                 options: {compareSize: true, compareContent: true},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-ac',
                 exitCode: 1,
             },
             {
                 name: 'test003_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, compareContent: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awc',
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
                  options: {compareSize: true, skipSymlinks: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-awL',
                  exitCode: 1,
              },
              {
                  name: 'test005_1', path1: 'd17', path2: 'd17',
                  options: {compareSize: true, ignoreCase: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-aw',
                  exitCode: 0,
              },
              {
                  name: 'test005_1_1', path1: 'd17', path2: 'd17', withRelativePath: true,
                  options: {compareSize: true, ignoreCase: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-aw',
                  exitCode: 0,
              },
              {
                  name: 'test005_2', path1: 'd17', path2: 'd17',
                  options: {compareSize: true, ignoreCase: true, skipSymlinks: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-awL',
                  exitCode: 0,
              },
              {
                  name: 'test005_3', path1: 'd17', path2: 'd18',
                  options: {compareSize: true, ignoreCase: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-aw',
                  exitCode: 1,
              },
              {
                  name: 'test005_4', path1: 'd22', path2: 'd22',
                  options: {compareSize: true, ignoreCase: true},
                  displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                  commandLineOptions: '-aw',
                  exitCode: 0,
              },
             {
                 name: 'test005_5', path1: 'd19', path2: 'd19',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_5_1', path1: 'd19', path2: 'd19', withRelativePath: true,
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_6', path1: 'd19', path2: 'd19',
                 options: {compareSize: true, ignoreCase: true, skipSymlinks: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awL',
                 exitCode: 0,
             },
             {
                 name: 'test005_7', path1: 'd20', path2: 'd20',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_8', path1: 'd21', path2: 'd21',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_9', path1: 'd20', path2: 'd21',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test005_10', path1: 'd21', path2: 'd20',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test005_11', path1: 'd20', path2: 'd22',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test005_12', path1: 'd22', path2: 'd20',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test005_13', path1: 'd23', path2: 'd23',
                 description: 'be able to compare symlinks to files',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_14', path1: 'd24', path2: 'd24',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_15', path1: 'd25', path2: 'd25',
                 description: 'do not fail when missing symlinks are encountered',
                 options: {compareSize: true, ignoreCase: true, skipSymlinks: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw --skip-symlinks',
                 exitCode: 0,
             },
             {
                 name: 'test005_16', path1: 'd26', path2: 'd27',
                 description: 'detect symbolic link loops; loops span between left/right directories',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test005_17', path1: 'd28', path2: 'd28',
                 description: 'detect symbolic link loops; loop back to root directory',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_18', path1: 'd29', path2: 'd30',
                 description: 'compare two symlinks',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test005_19', path1: 'd34_symlink/d', path2: 'd34_symlink/d',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },

             ////////////////////////////////////////////////////
             // Skip subdirs                                   //
             ////////////////////////////////////////////////////
             {
                 name: 'test006_0', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, skipSubdirs: true},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-aS',
                 exitCode: 1,
             },
             {
                 name: 'test006_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, skipSubdirs: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awS',
                 exitCode: 1,
             },
             ////////////////////////////////////////////////////
             // Ignore case                                    //
             ////////////////////////////////////////////////////
             {
                 name: 'test007_0', path1: 'd15', path2: 'd16',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awi',
                 exitCode: 0,
             },
             {
                 name: 'test007_1', path1: 'd15', path2: 'd16',
                 options: {compareSize: true, ignoreCase: false},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
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
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             {
                 name: 'test008_2', path1: 'd1', path2: 'd2',
                 expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
                 options: undefined,
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             {
                 name: 'test008_3', path1: 'd1', path2: 'd2',
                 expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
                 options: {},
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             ////////////////////////////////////////////////////
             // Result Builder Callback                        //
             ////////////////////////////////////////////////////
             {
                 name: 'test009_1', path1: 'd1', path2: 'd2',
                 expected: 'test: 17',
                 options: {resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet){
                     if(!statistics.test){
                         statistics.test = 0;
                     }
                     statistics.test++;
                 }},
                 displayOptions: {},
                 onlyLibrary: true,
                 skipStatisticsCheck: true,
                 print(cmpres, writer, program){writer.write('test: '+cmpres.test);}
             },
             {
                 name: 'test009_2', path1: 'd1', path2: 'd2',
                 expected: 'diffset: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]',
                 options: {resultBuilder(entry1, entry2, state, level, relativePath, options, statistics, diffSet){
                     if(!statistics.test){
                         statistics.test = 0;
                     }
                     statistics.test++;
                     if(diffSet) {
                        diffSet.push(statistics.test);
                     }
                 }},
                 displayOptions: {},
                 onlyLibrary: true,
                 skipStatisticsCheck: true,
                 print(cmpres, writer, program){writer.write(' diffset: '+JSON.stringify(cmpres.diffSet.sort(function(a, b){return a-b;}), null, 0));}
             },
             ////////////////////////////////////////////////////
             // Compare date                                   //
             ////////////////////////////////////////////////////
             {
                 name: 'test010_0', path1: 'd31', path2: 'd32',
                 options: {compareSize: true, compareDate: false},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test010_1', path1: 'd31', path2: 'd32',
                 options: {compareSize: true, compareDate: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awD',
                 exitCode: 1,
             },
             {
                 name: 'test010_2', path1: 'd31', path2: 'd32',
                 options: {compareSize: true, compareDate: false, compareContent: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awc',
                 exitCode: 1,
             },
             {
                 name: 'test010_3', path1: 'd31', path2: 'd32',
                 options: {compareSize: true, compareDate: true, compareContent: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awcD',
                 exitCode: 1,
             },
             {
                 name: 'test010_4', path1: 'd33/1', path2: 'd33/2',
                 description: 'should correctly use tolerance in date comparison',
                 options: {compareSize: true, compareDate: true, dateTolerance: 5000},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awD --date-tolerance 5000',
                 exitCode: 1,
             },
             {
                 name: 'test010_5', path1: 'd33/1', path2: 'd33/2',
                 description: 'should correctly use tolerance in date comparison',
                 options: {compareSize: true, compareDate: true, dateTolerance: 9000},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awD --date-tolerance 9000',
                 exitCode: 0,
             },
             {
                 name: 'test010_6', path1: 'd33/1', path2: 'd33/2',
                 description: 'should default to 1000 ms for date tolerance',
                 options: {compareSize: true, compareDate: true},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-awD',
                 exitCode: 1,
             },
             ////////////////////////////////////////////////////
             // Line by line compare                           //
             ////////////////////////////////////////////////////
             {
                 name: 'test011_1', path1: 'd35/crlf-spaces', path2: 'd35/lf-spaces',
                 description: 'should ignore line endings',
                 options: {
                     compareContent: true,
                     compareFileSync: fileCompareHandlers.lineBasedFileCompare.compareSync,
                     compareFileAsync: fileCompareHandlers.lineBasedFileCompare.compareAsync,
                     ignoreLineEnding: true,
                 },
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 displayOptions: {nocolors: true},
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
                 print(cmpres, writer, program){printRelativePathResult(cmpres, testDirPath, writer)}
             },
             {
                 name: 'test012_1', path1: 'd1/A6/../../d1', path2: 'd2',
                 description: 'should report absolute paths',
                 options: {},
                 onlyLibrary: true,
                 withRelativePath: false,
                 print(cmpres, writer, program){printRelativePathResult(cmpres, testDirPath, writer)}
             },
             {
                 name: 'test012_2', path1: testDirPath+'/d1', path2: 'd2',
                 description: 'should report absolute and relative paths',
                 options: {},
                 onlyLibrary: true,
                 withRelativePath: true,
                 print(cmpres, writer, program){printRelativePathResult(cmpres, testDirPath, writer)}
             },
         ];
         return res;
}


function printRelativePathResult(res, testDirPath, writer) {
    let result = res.diffSet.map(function(diff){
        return util.format('path1: %s, path2: %s',
        diff.path1, diff.path2)});
    result = JSON.stringify(result)
    result = result.replace(/\\\\/g, "/")
    result = result.replace(new RegExp(testDirPath.replace(/\\/g, "/"), 'g'), 'absolute_path')
    writer.write(result);
}

// Usage: node runTests [unpacked] [test000_0] [show-result]
// * without any parameters it runs all tests using testdir.tar as test data
// * 'unpacked' will use ./testdir as test data; initialize this directory from testdir.tar with 'node extract.js' (note that regular untar will not work as it contains symlink loops)
// * 'test000_0' specify a single test to run
// * 'show-result' shows actual/expected for each test


"use strict";

import { Options } from "..";

var colors = require('colors/safe');
var pathUtils = require('path');
var shelljs = require('shelljs');
var util = require('util');
var fs = require('fs');
var temp = require('temp');
var defaultPrint = require('../print');
var Promise = require('bluebird');
var Streams = require('memory-streams');
var compareSync = require('../index').compareSync;
var compareAsync = require('../index').compare;
var untar = require('./untar');
var semver = require('semver')

var lineAsyncCompare = require('../index').fileCompareHandlers.lineBasedFileCompare.compareAsync
var lineSyncCompare =  require('../index').fileCompareHandlers.lineBasedFileCompare.compareSync

var count = 0, failed = 0, successful = 0;
var syncCount = 0, syncFailed = 0, syncSuccessful = 0;
var asyncCount = 0, asyncFailed = 0, asyncSuccessful = 0;
var cmdLineCount = 0, cmdLineFailed = 0, cmdLineSuccessful = 0;

interface DisplayOptions {
    showAll: boolean,
    wholeReport: boolean,
    nocolors: boolean,
    csv: boolean,
    noDiffIndicator: boolean
}

interface Test {
    name: string,
    path1: string,
    path2: string,
    description: string,
    expected: string,
    withRelativePath: boolean,
    options: Partial<Options>,
    commandLineOptions: string
    exitCode: number,
    displayOptions: Partial<DisplayOptions>,
    print: any,
    onlyLibrary: boolean,
    onlyCommandLine: boolean,
    skipStatisticsCheck: boolean,
    onlySync: boolean,
    onlyAsync: boolean,
    nodeVersionSupport: boolean,
    runAsync: () => Promise<string>
}


//Automatically track and cleanup files at exit
temp.track();


function passed (value, type) {
    count++;
    if (value) {
        successful++;
    } else {
        failed++;
    }

    if(type==='sync'){
        syncCount++;
        if (value) {
            syncSuccessful++;
        } else {
            syncFailed++;
        }
    }

    if(type==='async'){
        asyncCount++;
        if (value) {
            asyncSuccessful++;
        } else {
            asyncFailed++;
        }
    }

    if(type==='cmdLine'){
        cmdLineCount++;
        if (value) {
            cmdLineSuccessful++;
        } else {
            cmdLineFailed++;
        }
    }

    return value ? colors.green('Passed') : colors.yellow('!!!!FAILED!!!!');
}

/**
 * Parameters:
 * * name - Test name. This represents also the name of the file holding expected result unless overriden by 'expected' param.
 * * description - describes what test does
 * * expected - Expected result.
 * * withRelativePath - Left/right dirs will be relative to current process.
 * * options - Options sent to library test. Should match 'commandLineOptions.
 * * commandLineOptions - Options sent to command line test. Should match 'options'.
 * * exitCode - Command line expected exit code.
 * * displayOptions - Display parameters for print method.
 * * print - Prints test result. If missing 'defaultPrint()' is used.
 * * onlyLibrary - Test is run only on API methods.
 * * onlyCommandLine - Test is run only on command line.
 * * skipStatisticsCheck - Do not call checkStatistics() after each library test.
 * * onlySync - only apply for synchronous compare
 * * onlyAsync - only apply for synchronous compare
 * * nodeVersionSupport - limit test to specific node versions; ie. '>=2.5.0'
 * * runAsync - execute hand-written async test
 */
var getTests = function(testDirPath){
    var res : Partial<Test>[] = [
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
                 runAsync: function(){
                     return compareAsync(testDirPath+'/d1', testDirPath+'/none', {})
                     .then(function(res){return 'res: ' + JSON.stringify(res)})
                     .catch(function(error){return 'error occurred'})
                 }
             },


             ////////////////////////////////////////////////////
             // Filters                                        //
             ////////////////////////////////////////////////////
             {
                 name: 'test002_0', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -f "*.e1"',
                 exitCode: 1,
             },
             {
                 name: 'test002_1', path1: 'd1', path2: 'd10',
                 options: {compareSize: true, excludeFilter: '.x'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x .x',
                 exitCode: 1,
             },
             {
                 name: 'test002_2', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -f "*.e1"',
                 exitCode: 1,
             },
             {
                 name: 'test002_3', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x "*.txt"',
                 exitCode: 1,
             },
             {
                 name: 'test002_4', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x "*.txt"',
                 exitCode: 1,
             },
             {
                 name: 'test002_5', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x "*.e1,*.e2"',
                 exitCode: 1,
             },
             {
                 name: 'test002_6', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x "*.e1,*.e2"',
                 exitCode: 1,
             },
             // TODO: test both --exclude and --filter in the same run

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
                 options: {resultBuilder: function (entry1, entry2, state, level, relativePath, options, statistics, diffSet){
                     if(!statistics.test){
                         statistics.test = 0;
                     }
                     statistics.test++;
                 }},
                 displayOptions: {},
                 onlyLibrary: true,
                 skipStatisticsCheck: true,
                 print: function(res, writer, program){writer.write('test: '+res.test);}
             },
             {
                 name: 'test009_2', path1: 'd1', path2: 'd2',
                 expected: 'diffset: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]',
                 options: {resultBuilder: function (entry1, entry2, state, level, relativePath, options, statistics, diffSet){
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
                 print: function(res, writer, program){writer.write(' diffset: '+JSON.stringify(res.diffSet.sort(function(a, b){return a-b;}), null, 0));}
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                     compareFileSync: lineSyncCompare,
                     compareFileAsync: lineAsyncCompare,
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
                 print: function(res, writer, program){printRelativePathResult(res, testDirPath, writer)}
             },
             {
                 name: 'test012_1', path1: 'd1/A6/../../d1', path2: 'd2',
                 description: 'should report absolute paths',
                 options: {},
                 onlyLibrary: true,
                 withRelativePath: false,
                 print: function(res, writer, program){printRelativePathResult(res, testDirPath, writer)}
             },
             {
                 name: 'test012_2', path1: testDirPath+'/d1', path2: 'd2',
                 description: 'should report absolute and relative paths',
                 options: {},
                 onlyLibrary: true,
                 withRelativePath: true,
                 print: function(res, writer, program){printRelativePathResult(res, testDirPath, writer)}
             },
         ];
         return res;
}

var printRelativePathResult = function(res, testDirPath, writer) {
    var result = res.diffSet.map(function(diff){
        return util.format('path1: %s, path2: %s',
        diff.path1, diff.path2)});
    result = JSON.stringify(result)
    result = result.replace(/\\\\/g, "/")
    result = result.replace(new RegExp(testDirPath.replace(/\\/g, "/"), 'g'), 'absolute_path')
    writer.write(result);
}

//Matches date (ie 2014-11-18T21:32:39.000Z)
var normalizeDateRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gm;

function normalize (str) {
  str = str.replace(normalizeDateRegexp, 'x');
  str = str.replace(/\r\n/g, '\n');
  str = str.replace(/\\/g, '/')
  return str;
}

var checkStatistics = function(statistics, test){
    if(test.skipStatisticsCheck){
        return true;
    }
    if (statistics.differences != statistics.left + statistics.right + statistics.distinct) {
        return false;
    }
    if (statistics.differencesFiles != statistics.leftFiles + statistics.rightFiles + statistics.distinctFiles) {
        return false;
    }
    if (statistics.differencesDirs != statistics.leftDirs + statistics.rightDirs + statistics.distinctDirs) {
        return false;
    }
    if (statistics.total != statistics.equal + statistics.differences) {
        return false;
    }
    if (statistics.totalFiles != statistics.equalFiles + statistics.differencesFiles) {
        return false;
    }
    if (statistics.totalDirs != statistics.equalDirs +  + statistics.differencesDirs) {
        return false;
    }

    if (statistics.total != statistics.totalDirs +  + statistics.totalFiles) {
        return false;
    }
    if (statistics.equal != statistics.equalDirs +  + statistics.equalFiles) {
        return false;
    }
    if (statistics.left != statistics.leftDirs +  + statistics.leftFiles) {
        return false;
    }
    if (statistics.right != statistics.rightDirs +  + statistics.rightFiles) {
        return false;
    }
    if (statistics.distinct != statistics.distinctDirs +  + statistics.distinctFiles) {
        return false;
    }
    return true;
}

var getExpected = function(test){
	if(test.expected){
        return test.expected.trim();
    } else{
    	return normalize(fs.readFileSync(__dirname + '/expected/' + test.name + '.txt', 'utf8')).trim();
    }
}

var testSync = function(test, testDirPath, saveReport, showResult){
    process.chdir(testDirPath);
    var path1, path2;
    if(test.withRelativePath){
        path1 = test.path1;
        path2 = test.path2;
    } else{
        path1 = test.path1?testDirPath + '/' + test.path1:'';
        path2 = test.path2?testDirPath + '/' + test.path2:'';
    }
    return new Promise(function(resolve, reject) {
        resolve(compareSync(path1, path2, test.options));
    }).then(
            function(result){
                // PRINT DETAILS
                var writer = new Streams.WritableStream();
                var print = test.print?test.print:defaultPrint;
                print(result, writer, test.displayOptions);
                var output = normalize(writer.toString()).trim();
                var expected = getExpected(test);
                if (showResult) {
                    printResult(output, expected)
                }
                var statisticsCheck = checkStatistics(result, test);
                var res = expected===output && statisticsCheck;
                report(test.name, 'sync', output, null, res, saveReport);
                console.log(test.name + ' sync: ' + passed(res, 'sync'));
            }, function(error){
                report(test.name, 'sync', error instanceof Error? error.stack: error, null, false, saveReport);
                console.log(test.name + ' sync: ' + passed(false, 'sync') + '. Error: ' + printError(error));
            });
}

var testAsync = function(test, testDirPath, saveReport, showResult){
    process.chdir(testDirPath);
    var path1, path2;
    if(test.withRelativePath){
        path1 = test.path1;
        path2 = test.path2;
    } else{
        path1 = test.path1?testDirPath + '/' + test.path1:'';
        path2 = test.path2?testDirPath + '/' + test.path2:'';
    }
    var promise;
    if(test.runAsync){
        promise = test.runAsync()
        .then(function(result){
                return {output: result, statisticsCheck: true}
        })
    } else {
        promise = compareAsync(path1, path2, test.options)
        .then(function(result){
                var writer = new Streams.WritableStream();
                var print = test.print?test.print:defaultPrint;
                print(result, writer, test.displayOptions);
                var statisticsCheck = checkStatistics(result, test);
                var output = normalize(writer.toString()).trim();
                return {output: output, statisticsCheck: statisticsCheck}
        })
    }
    return promise.then(
            function(result){
                var output = result.output;
                var statisticsCheck = result.statisticsCheck;

                var expected = getExpected(test);

                if (showResult) {
                    printResult(output, expected)
                }
                var res = expected===output && statisticsCheck;
                report(test.name, 'async', output, null, res, saveReport);
                console.log(test.name + ' async: ' + passed(res, 'async'));
            }, function(error){
                report(test.name, 'async', error instanceof Error? error.stack: error, null, false, saveReport);
                console.log(test.name + ' async: ' + passed(false, 'async') + '. Error: ' + printError(error));
            });
}

function testCommandLineInternal(test, testDirPath, async, saveReport, showResult) {
    return new Promise(function(resolve, reject) {
        var dircompareJs = pathUtils.normalize(__dirname + '/../dircompare.js');
        process.chdir(testDirPath);
        var path1, path2;
        if(test.withRelativePath){
            path1 = test.path1;
            path2 = test.path2;
        } else{
            path1 = test.path1?testDirPath + '/' + test.path1:'';
            path2 = test.path2?testDirPath + '/' + test.path2:'';
        }
        var command = util.format("node %s %s %s %s %s",
                dircompareJs, test.commandLineOptions, async ? '--async' : '', path1, path2);
        var shelljsResult = shelljs.exec(command, {
            silent : true
        });
        var output = normalize(shelljsResult.output).trim();
        var exitCode = shelljsResult.code;

        var expectedExitCode = test.exitCode;
        var res;
        if(expectedExitCode===2){
            // output not relevant for error codes
            res = (exitCode === expectedExitCode);
        } else{
            var expectedOutput = getExpected(test);
            res = expectedOutput===output && (exitCode === expectedExitCode);
        }
        if (showResult) {
            printResult(output, expectedOutput)
        }
        var testDescription = 'command line ' + (async?'async':'sync');
        report(test.name, testDescription, output, exitCode, res, saveReport);
        console.log(test.name + ' ' + testDescription + ': ' + passed(res, 'cmdLine'));
        resolve();
    })
}

var testCommandLine = function(test, testDirPath, saveReport, showResult){
    return Promise.all([
                        testCommandLineInternal(test, testDirPath, false, saveReport, showResult),
                        testCommandLineInternal(test, testDirPath, true, saveReport, showResult)
                        ]);
}

function printError(error){
	return error instanceof Error ? error.stack : error;
}

function initReport(saveReport){
	if(saveReport){
		if(fs.existsSync(REPORT_FILE)){
			fs.unlinkSync(REPORT_FILE);
		}
		var os = require('os');
		var pjson = require('../package.json');
		fs.appendFileSync(REPORT_FILE, util.format('Date: %s, Node version: %s. OS platform: %s, OS release: %s, dir-compare version: %s\n',
				new Date(), process.version, os.platform(), os.release(), pjson.version));
	}
}

var REPORT_FILE = __dirname + "/report.txt";
function report(testName, testDescription, output, exitCode, result, saveReport){
    if(saveReport && !result){
		    	fs.appendFileSync(REPORT_FILE, util.format(
				"\n%s %s failed - result: %s, exitCode: %s, output: %s\n", testName, testDescription, result,
				exitCode?exitCode:'n/a', output?output:'n/a'));
    }

}

function endReport(saveReport){
	if(saveReport){
		fs.appendFileSync(REPORT_FILE, 'Tests: ' + count + ', failed: ' + failed + ', succeeded: ' + successful);
	}
}

var printResult = function(output, expected) {
    console.log('Actual:');
    console.log(output);
    console.log('Expected:');
    console.log(expected);
    //                    expected.forEach(function(exp){console.log(exp)});
    console.log('Result: '+(output === expected));
}

// testDirPath: path to test data
// singleTestName: if defined, represents the test name to be executed in format
//                 otherwise all tests are executed
function executeTests (testDirPath, singleTestName, showResult) {
    console.log('Test dir: '+testDirPath);
	var saveReport = true;
	initReport(saveReport);
    Promise.resolve(getTests(testDirPath)).then(function(tests){
        // Run sync tests
        var syncTestsPromises: Promise<any>[] = [];
        tests.filter(function(test){return !test.onlyCommandLine;})
        .filter(function(test){return !test.onlyAsync})
        .filter(function(test){return singleTestName?test.name===singleTestName:true;})
        .filter(function(test){return test.nodeVersionSupport===undefined || semver.satisfies(process.version, test.nodeVersionSupport) })
        .forEach(function(test){
            syncTestsPromises.push(testSync(test, testDirPath, saveReport, showResult));
        });
        return Promise.all(syncTestsPromises);
    }).then(function(){
        console.log();
        console.log('Sync tests: ' + syncCount + ', failed: ' + colors.yellow(syncFailed.toString()) + ', succeeded: ' + colors.green(syncSuccessful.toString()));
        console.log();
    }).then(function(){
        // Run async tests
        var asyncTestsPromises: Promise<any>[] = [];
        getTests(testDirPath).filter(function(test){return !test.onlyCommandLine;})
        .filter(function(test){return !test.onlySync})
        .filter(function(test){return test.nodeVersionSupport===undefined || semver.satisfies(process.version, test.nodeVersionSupport) })
        .filter(function(test){return singleTestName?test.name===singleTestName:true;})
        .forEach(function(test){
            asyncTestsPromises.push(testAsync(test, testDirPath, saveReport, showResult));
        });
        return Promise.all(asyncTestsPromises);
    }).then(function(){
        console.log();
        console.log('Async tests: ' + asyncCount + ', failed: ' + colors.yellow(asyncFailed.toString()) + ', succeeded: ' + colors.green(asyncSuccessful.toString()));
        console.log();
    }).then(function(){
        // Run command line tests
        var commandLinePromises: Promise<any>[] = [];
        getTests(testDirPath).filter(function(test){return !test.onlyLibrary;})
        .filter(function(test){return test.nodeVersionSupport===undefined || semver.satisfies(process.version, test.nodeVersionSupport) })
        .filter(function(test){return singleTestName?test.name===singleTestName:true;})
        .forEach(function(test){
            commandLinePromises.push(testCommandLine(test, testDirPath, saveReport, showResult));
        });
        return Promise.all(commandLinePromises);
    }).then(function(){
        console.log();
        console.log('Command line tests: ' + cmdLineCount + ', failed: ' + colors.yellow(cmdLineFailed.toString()) + ', succeeded: ' + colors.green(cmdLineSuccessful.toString()));
    }).then(function(){
        console.log();
        console.log('All tests: ' + count + ', failed: ' + colors.yellow(failed.toString()) + ', succeeded: ' + colors.green(successful.toString()));
        endReport(saveReport);
        process.exitCode = failed>0?1:0
        process.chdir(__dirname);  // allow temp dir to be removed
    });
}


var main = function () {
	var args = process.argv;
    var singleTestName, unpacked = false, showResult = false;
    args.forEach(function(arg){
        if(arg.match('unpacked')) {
            unpacked = true
        }
        if(arg.match('show-result')) {
            showResult = true
        }
        if(arg.match(/test\d\d\d_\d/)) {
            singleTestName = arg
        }
    })

    if(unpacked){
        executeTests(__dirname+'/testdir', singleTestName, showResult)
    }
    else {
    	temp.mkdir('dircompare-test', function (err, testDirPath) {
            if (err) {
                throw err;
            }

            function onError (err) {
                console.error('Error occurred:', err);
            }
            untar(__dirname + "/testdir.tar", testDirPath, function(){executeTests(testDirPath, singleTestName, showResult)}, onError);
        });
    }
}

main();

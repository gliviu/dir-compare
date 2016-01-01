"use strict";
var colors = require('colors');
var path = require('path');
var shelljs = require('shelljs');
var util = require('util');
var fs = require('fs');
var temp = require('temp');
var tar = require('tar');
var defaultPrint = require('../print');
var Promise = require('bluebird');
var Streams = require('memory-streams');
var compareSync = require('../index').compareSync;
var compareAsync = require('../index').compare;

var count = 0, failed = 0, successful = 0;
var syncCount = 0, syncFailed = 0, syncSuccessful = 0;
var asyncCount = 0, asyncFailed = 0, asyncSuccessful = 0;
var cmdLineCount = 0, cmdLineFailed = 0, cmdLineSuccessful = 0;

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
    
    return value ? 'Passed'.green : '!!!!FAILED!!!!'.yellow;
}

/**
 * Parameters:
 * * name - Test name. This represents also the name of the file holding expected result unless overriden by 'expected' param.
 * * expected - Expected result.
 * * options - Options sent to library test. Should match 'commandLineOptions.
 * * commandLineOptions - Options sent to command line test. Should match 'options'.
 * * exitCode - Command line expected exit code.
 * * displayOptions - Display parameters for print method.
 * * print - Prints test result. If missing 'defaultPrint()' is used.
 * * onlyLibrary - Test is run only on API methods.
 * * onlyCommandLine - Test is run only on command line. 
 * * skipStatisticsCheck - Do not call checkStatistics() after each library test.
 */
var tests = [
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
             
             ////////////////////////////////////////////////////
             // Filters                                        //
             ////////////////////////////////////////////////////
             {
                 name: 'test002_0', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -f *.e1',
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
                 commandLineOptions: '-aw -f *.e1',
                 exitCode: 1,
             },
             {
                 name: 'test002_3', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x *.txt',
                 exitCode: 1,
             },
             {
                 name: 'test002_4', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x *.txt',
                 exitCode: 1,
             },
             {
                 name: 'test002_5', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, nocolors: true},
                 commandLineOptions: '-a -x *.e1,*.e2',
                 exitCode: 1,
             },
             {
                 name: 'test002_6', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, wholeReport: true, nocolors: true},
                 commandLineOptions: '-aw -x *.e1,*.e2',
                 exitCode: 1,
             },
             // TODO: test both --exclude and --filter in the same run
             
             ////////////////////////////////////////////////////
             // Compare by content                             //
             ////////////////////////////////////////////////////
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
             // Exit code                                      //
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
                 options: null,
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             {
                 name: 'test008_4', path1: 'd1', path2: 'd2',
                 expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
                 options: {callbacks: {}},
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             {
                 name: 'test008_5', path1: 'd1', path2: 'd2',
                 expected: 'total: 17, equal: 3, distinct: 0, only left: 7, only right: 7',
                 options: {callbacks: null},
                 displayOptions: {wholeReport: true, nocolors: true, noDiffIndicator: true},
                 onlyLibrary: true,
             },
             ////////////////////////////////////////////////////
             // Result Builder Callback                        //
             ////////////////////////////////////////////////////
             {
                 name: 'test009_1', path1: 'd1', path2: 'd2',
                 expected: 'test: 17',
                 options: {callbacks: {resultBuilder: function (entry1, entry2, state, level, relativePath, options, statistics, diffSet){
                     if(!statistics.test){
                         statistics.test = 0;
                     }
                     statistics.test++;
                 }}},
                 displayOptions: {},
                 onlyLibrary: true,
                 skipStatisticsCheck: true,
                 print: function(res, writer, program){writer.write('test: '+res.test);}
             },
             {
                 name: 'test009_2', path1: 'd1', path2: 'd2',
                 expected: 'diffset: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]',
                 options: {callbacks: {resultBuilder: function (entry1, entry2, state, level, relativePath, options, statistics, diffSet){
                     if(!statistics.test){
                         statistics.test = 0;
                     }
                     statistics.test++;
                     diffSet.push(statistics.test);
                 }}},
                 displayOptions: {},
                 onlyLibrary: true,
                 skipStatisticsCheck: true,
                 print: function(res, writer, program){writer.write(' diffset: '+JSON.stringify(res.diffSet.sort(function(a, b){return a-b;}), null, 0));}
             },
             ];

//Matches date (ie 2014-11-18T21:32:39.000Z)
var normalizeDateRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gm;
function normalize (str) {
    // replace date
    return str.replace(normalizeDateRegexp, 'x');
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

var testSync = function(test, testDirPath){
    var path1 = test.path1?testDirPath + '/' + test.path1:'';
    var path2 = test.path2?testDirPath + '/' + test.path2:'';
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

                if (test.name == 'test009_2x') {
                    console.log(output);
                    console.log(expected);
                    console.log(output === expected);

                }
                var statisticsCheck = checkStatistics(result, test);
                var res = (output === expected) && statisticsCheck;

                console.log(test.name + ' sync: ' + passed(res, 'sync'));
            }, function(error){
                if (test.name == 'test1') {
                    // console.log(error);
                }
                console.log(test.name + ' sync: ' + passed(false, 'sync'));
            });
}

var testAsync = function(test, testDirPath){
    var path1 = test.path1?testDirPath + '/' + test.path1:'';
    var path2 = test.path2?testDirPath + '/' + test.path2:'';
    return compareAsync(path1, path2, test.options).then(
            function(result){
                // PRINT DETAILS
                var writer = new Streams.WritableStream();
                var print = test.print?test.print:defaultPrint;
                print(result, writer, test.displayOptions);
                var output = normalize(writer.toString()).trim();
                var expected = getExpected(test);

                if (test.name == 'test009_2x') {
                    console.log(output);
                    console.log(expected);
                }
                var statisticsCheck = checkStatistics(result, test);
                var res = (output === expected) && statisticsCheck;

                console.log(test.name + ' async: ' + passed(res, 'async'));
            }, function(error){
                if (test.name == 'test1') {
                    // console.log(error);
                }
                console.log(test.name + ' async: ' + passed(false, 'async'));
            });
}

function testCommandLineInternal(test, testDirPath, async) {
    return new Promise(function(resolve, reject) {
        var dircompareJs = path.normalize(__dirname + '/../dircompare.js');
        var path1 = test.path1?testDirPath + '/' + test.path1:'';
        var path2 = test.path2?testDirPath + '/' + test.path2:'';
        var command = util.format("node %s %s %s %s %s", 
                dircompareJs, test.commandLineOptions, async ? '--async' : '', path1, path2);
        var shelljsResult = shelljs.exec(command, {
            silent : true
        });
        var output = normalize(shelljsResult.output).trim();
        var exitCode = shelljsResult.code;
        
        var expectedExitCode = test.exitCode;
        var res;
        if (test.name == 'test303') {
             debugger
        }
        if(expectedExitCode===2){
            // output not relevant for error codes
            res = (exitCode === expectedExitCode);
        } else{
            var expectedOutput = getExpected(test);
            res = (output === expectedOutput) && (exitCode === expectedExitCode);
        }

        console.log(test.name + ' command line ' + (async?'async':'sync') + ': ' + passed(res, 'cmdLine'));
        resolve();
    })
}

var testCommandLine = function(test, testDirPath){
    return Promise.all([
                        testCommandLineInternal(test, testDirPath, false),
                        testCommandLineInternal(test, testDirPath, true)
                        ]);
}

var runTests = function () {
    temp.mkdir('dircompare-test', function (err, testDirPath) {
        if (err) {
            throw err;
        }

        function onError (err) {
            console.error('Error occurred:', err)
        }

        function onExtracted () {
            Promise.resolve(tests).then(function(tests){
                // Run sync tests
                var syncTestsPromises = [];
                tests.filter(function(test){return !test.onlyCommandLine;})
                //                tests.filter(function(test){return test.name==='test009_2';})
                .forEach(function(test){
                    syncTestsPromises.push(testSync(test, testDirPath));
                });
                return Promise.all(syncTestsPromises);
            }).then(function(){
                console.log();
                console.log('Sync tests: ' + syncCount + ', failed: ' + syncFailed.toString().yellow + ', succeeded: ' + syncSuccessful.toString().green);
                console.log();
            }).then(function(){
                // Run async tests
                var asyncTestsPromises = [];
                tests.filter(function(test){return !test.onlyCommandLine;})
                //                tests.filter(function(test){return test.name==='test009_2';})
                .forEach(function(test){
                    asyncTestsPromises.push(testAsync(test, testDirPath));
                });
                return Promise.all(asyncTestsPromises);
            }).then(function(){
                console.log();
                console.log('Async tests: ' + asyncCount + ', failed: ' + asyncFailed.toString().yellow + ', succeeded: ' + asyncSuccessful.toString().green);
                console.log();
            }).then(function(){
                // Run command line tests
                var commandLinePromises = [];
                tests.filter(function(test){return !test.onlyLibrary;})
                // tests.filter(function(test){return test.name=='test303';})
                .forEach(function(test){
                    commandLinePromises.push(testCommandLine(test, testDirPath));
                });
                return Promise.all(commandLinePromises);
            }).then(function(){
                console.log();
                console.log('Command line tests: ' + cmdLineCount + ', failed: ' + cmdLineFailed.toString().yellow + ', succeeded: ' + cmdLineSuccessful.toString().green);
            }).then(function(){
                console.log();
                console.log('All tests: ' + count + ', failed: ' + failed.toString().yellow + ', succeeded: ' + successful.toString().green);
            });
        }
        var extractor = tar.Extract({
            path : testDirPath
        }).on('error', onError).on('end', onExtracted);

        fs.createReadStream(__dirname + "/testdir.tar").on('error', onError).pipe(extractor);

    });
}

runTests();

"use strict";
var colors = require('colors');
var path = require('path');
var shelljs = require('shelljs');
var util = require('util');
var fs = require('fs');
var temp = require('temp');
var tar = require('tar');
var print = require('../print');
var Promise = require('bluebird');
var Streams = require('memory-streams');
var compareSync = require('../index').compareSync;
var compareAsync = require('../index').compare;

var count = 0, failed = 0, successful = 0;

//Automatically track and cleanup files at exit
temp.track();

function passed (value) {
    count++;
    if (value) {
        successful++;
    } else {
        failed++;
    }
    return value ? 'Passed'.green : '!!!!FAILED!!!!'.yellow;
}


var tests = [
             {
                 name: 'test001_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_2', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true, csv: true},
                 commandLineOptions: '-aw --csv',
                 exitCode: 1,
             },
             {
                 name: 'test001_3', path1: 'd3', path2: 'd4',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_4', path1: 'd4', path2: 'd4',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw',
                 exitCode: 0,
             },
             {
                 name: 'test001_5', path1: 'd8', path2: 'd9',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true},
                 commandLineOptions: '-a',
                 exitCode: 1,
             },
             {
                 name: 'test001_6', path1: 'd8', path2: 'd9',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             {
                 name: 'test001_8', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {},
                 commandLineOptions: '',
                 exitCode: 1,
             },
             
             ////////////////////////////////////////////////////
             // Filters                                        //
             ////////////////////////////////////////////////////
             {
                 name: 'test002_0', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true},
                 commandLineOptions: '-a -f *.e1',
                 exitCode: 1,
             },
             {
                 name: 'test002_1', path1: 'd1', path2: 'd10',
                 options: {compareSize: true, excludeFilter: '.x'},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw -x .x',
                 exitCode: 1,
             },
             {
                 name: 'test002_2', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, includeFilter: '*.e1'},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw -f *.e1',
                 exitCode: 1,
             },
             {
                 name: 'test002_3', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true},
                 commandLineOptions: '-a -x *.txt',
                 exitCode: 1,
             },
             {
                 name: 'test002_4', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, excludeFilter: '*.txt'},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw -x *.txt',
                 exitCode: 1,
             },
             {
                 name: 'test002_5', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true},
                 commandLineOptions: '-a -x *.e1,*.e2',
                 exitCode: 1,
             },
             {
                 name: 'test002_6', path1: 'd6', path2: 'd7',
                 options: {compareSize: true, excludeFilter: '*.e1,*.e2'},
                 displayOptions: {showAll: true, wholeReport: true},
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
                 displayOptions: {showAll: true},
                 commandLineOptions: '-ac',
                 exitCode: 1,
             },
             {
                 name: 'test003_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, compareContent: true},
                 displayOptions: {showAll: true, wholeReport: true},
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
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-awL',
                 exitCode: 1,
             },

             ////////////////////////////////////////////////////
             // Skip subdirs                                   //
             ////////////////////////////////////////////////////
             {
                 name: 'test006_0', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, skipSubdirs: true},
                 displayOptions: {showAll: true},
                 commandLineOptions: '-aS',
                 exitCode: 1,
             },
             {
                 name: 'test006_1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true, skipSubdirs: true},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-awS',
                 exitCode: 1,
             },
             ////////////////////////////////////////////////////
             // Ignore case                                    //
             ////////////////////////////////////////////////////
             {
                 name: 'test007_0', path1: 'd15', path2: 'd16',
                 options: {compareSize: true, ignoreCase: true},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-awi',
                 exitCode: 0,
             },
             {
                 name: 'test007_1', path1: 'd15', path2: 'd16',
                 options: {compareSize: true, ignoreCase: false},
                 displayOptions: {showAll: true, wholeReport: true},
                 commandLineOptions: '-aw',
                 exitCode: 1,
             },
             ];

//Matches date (ie 2014-11-18T21:32:39.000Z)
var normalizeDateRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gm;
function normalize (str) {
    // replace date
    return str.replace(normalizeDateRegexp, 'x');
}

var testSync = function(test, testDirPath){
    var path1 = test.path1?testDirPath + '/' + test.path1:'';
    var path2 = test.path2?testDirPath + '/' + test.path2:'';
    return new Promise(function(resolve, reject) {
        resolve(compareSync(path1, path2, test.options));
    }).then(
            function(res){
                // PRINT DETAILS
                var writer = new Streams.WritableStream();
                print(res, writer, test.displayOptions);
                var output = normalize(writer.toString());
                var expected = normalize(fs.readFileSync(__dirname + '/expected/' + test.name + '.txt', 'utf8'));

                if (test.name == 'test1') {
                    // console.log(output);
                }
                var res = output === expected;

                console.log(test.name + ' sync: ' + passed(res));
            }, function(error){
                // Ignore error
                if (test.name == 'test1') {
                    // console.log(error);
                }
            });
}

var testAsync = function(test, testDirPath){
    var path1 = test.path1?testDirPath + '/' + test.path1:'';
    var path2 = test.path2?testDirPath + '/' + test.path2:'';
    return compareAsync(path1, path2, test.options).then(
            function(res){
                // PRINT DETAILS
                var writer = new Streams.WritableStream();
                print(res, writer, test.displayOptions);
                var output = normalize(writer.toString());
                var expected = normalize(fs.readFileSync(__dirname + '/expected/' + test.name + '.txt', 'utf8'));

                if (test.name == 'test1') {
                    // console.log(output);
                }
                var res = output === expected;

                console.log(test.name + ' async: ' + passed(res));
            }, function(error){
                // Ignore error
                if (test.name == 'test1') {
                    // console.log(error);
                }
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
        var output = normalize(shelljsResult.output);
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
            var expectedOutput = normalize(fs.readFileSync(__dirname + '/expected/' + test.name + '.txt', 'utf8'));
            res = (output === expectedOutput) && (exitCode === expectedExitCode);
        }

        console.log(test.name + ' command line ' + (async?'async':'sync') + ': ' + passed(res));
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
            // Run tests sync
            var syncTestsPromises = [];
            tests.filter(function(test){return !test.onlyCommandLine;})
            .forEach(function(test){
                syncTestsPromises.push(testSync(test, testDirPath));
            });

            // Run tests async
            Promise.all(syncTestsPromises).then(function(){
                var asyncTestsPromises = [];
                tests.filter(function(test){return !test.onlyCommandLine;})
                .forEach(function(test){
                    asyncTestsPromises.push(testAsync(test, testDirPath));
                });
                return Promise.all(asyncTestsPromises);
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
                console.log('Tests: ' + count + ', failed: ' + failed.toString().yellow + ', succeeded: ' + successful.toString().green);
            });
        }
        var extractor = tar.Extract({
            path : testDirPath
        }).on('error', onError).on('end', onExtracted);

        fs.createReadStream(__dirname + "/testdir.tar").on('error', onError).pipe(extractor);

    });
}

runTests();

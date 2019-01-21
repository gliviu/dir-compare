// Usage: node runTests [unpacked] [test000_0] [showresult] [skipcli] [noReport]
interface RunOptions {
    // Use ./testdir instead of testdir.tar as test data.
    // Run 'node extract.js' to initialize ./testdir.
    // (note that regular untar will not work as it contains symlink loops)
    unpacked: boolean,

    // Specify a single test to run ie. 'test000_0'
    singleTestName: string,

    // Shows actual/expected for each test
    showResult: boolean,

    // Do not run cli tests
    skipCli: boolean,

    // Do not create report.txt
    noReport: boolean
}


import { getTests } from "./tests";

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

    return value ? colors.green('Passed') : colors.yellow('!!!!FAILED!!!!');
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

var testSync = function(test, testDirPath, saveReport, runOptions: Partial<RunOptions>){
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
                if (runOptions.showResult) {
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

var testAsync = function(test, testDirPath, saveReport, runOptions: Partial<RunOptions>){
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

                if (runOptions.showResult) {
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

function testCommandLineInternal(test, testDirPath, async, saveReport, runOptions: Partial<RunOptions>) {
    if(runOptions.skipCli) {
        return Promise.resolve();
    }
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
        if (runOptions.showResult) {
            printResult(output, expectedOutput)
        }
        var testDescription = 'command line ' + (async?'async':'sync');
        report(test.name, testDescription, output, exitCode, res, saveReport);
        console.log(test.name + ' ' + testDescription + ': ' + passed(res, 'cmdLine'));
        resolve();
    })
}

var testCommandLine = function(test, testDirPath, saveReport, runOptions: Partial<RunOptions>){
    return Promise.all([
                        testCommandLineInternal(test, testDirPath, false, saveReport, runOptions),
                        testCommandLineInternal(test, testDirPath, true, saveReport, runOptions)
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
function executeTests (testDirPath, runOptions: Partial<RunOptions>) {
    console.log('Test dir: '+testDirPath);
	var saveReport = !runOptions.noReport;
    initReport(saveReport);
    Promise.resolve(getTests(testDirPath)).then(function(tests){
        // Run sync tests
        var syncTestsPromises: Promise<any>[] = [];
        tests.filter(function(test){return !test.onlyCommandLine;})
        .filter(function(test){return !test.onlyAsync})
        .filter(function(test){return runOptions.singleTestName?test.name===runOptions.singleTestName:true;})
        .filter(function(test){return test.nodeVersionSupport===undefined || semver.satisfies(process.version, test.nodeVersionSupport) })
        .forEach(function(test){
            syncTestsPromises.push(testSync(test, testDirPath, saveReport, runOptions));
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
        .filter(function(test){return runOptions.singleTestName?test.name===runOptions.singleTestName:true;})
        .forEach(function(test){
            asyncTestsPromises.push(testAsync(test, testDirPath, saveReport, runOptions));
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
        .filter(function(test){return runOptions.singleTestName?test.name===runOptions.singleTestName:true;})
        .forEach(function(test){
            commandLinePromises.push(testCommandLine(test, testDirPath, saveReport, runOptions));
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
    let runOptions: Partial<RunOptions> = {
        unpacked: false,
        showResult: false,
        skipCli: false,
        noReport: false,
        singleTestName: undefined
    }
    args.forEach(function(arg){
        if(arg.match('unpacked')) {
            runOptions.unpacked = true
        }
        if(arg.match('showresult')) {
            runOptions.showResult = true
        }
        if(arg.match('skipcli')) {
            runOptions.skipCli = true
        }
        if(arg.match('noreport')) {
            runOptions.noReport = true
        }
        if(arg.match(/test\d\d\d_\d/)) {
            runOptions.singleTestName = arg
        }
    })

    if(runOptions.unpacked){
        executeTests(__dirname+'/testdir', runOptions)
    }
    else {
    	temp.mkdir('dircompare-test', function (err, testDirPath) {
            if (err) {
                throw err;
            }

            function onError (err) {
                console.error('Error occurred:', err);
            }
            untar(__dirname + "/testdir.tar", testDirPath, function(){executeTests(testDirPath, runOptions)}, onError);
        });
    }
}

main();

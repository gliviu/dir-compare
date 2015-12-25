"use strict";
var colors = require('colors');
var path = require('path');
var shelljs = require('shelljs');
var util = require('util');
var fs = require('fs');
var temp = require('temp');
var tar = require('tar');
var print = require('./print');

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

// Matches date (ie 2014-11-18T21:32:39.000Z)
var normalizeDateRegexp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/gm;
function normalize (str) {
    // replace date
    return str.replace(normalizeDateRegexp, 'x');
}

function testInternal (testDirPath, testName, path1, path2, options, async) {
    var dircompareJs = path.normalize(__dirname + '/../dircompare.js');
    var command = util.format("node %s %s %s %s %s", dircompareJs, options, async?'--async':'', testDirPath + '/' + path1, testDirPath + '/' + path2);
    var output = normalize(shelljs.exec(command, {
        silent : true
    }).output);
    var expected = normalize(fs.readFileSync(__dirname + '/expected/' + testName + '.txt', 'utf8'));
    if (testName == 'test1') {
//        console.log(output);
    }
    var res = output === expected;

    console.log(testName + ' ' + (async?'async':'sync') + ': ' + passed(res));
}

function test (testDirPath, testName, path1, path2, options) {
	testInternal(testDirPath, testName, path1, path2, options, false);
	testInternal(testDirPath, testName, path1, path2, options, true);
}

function testExitCodeInternal (testDirPath, testName, path1, path2, options, expectedExitCode, async) {
    var dircompareJs = path.normalize(__dirname + '/../dircompare.js');
    var command = util.format("node %s %s %s %s %s", dircompareJs, options, async?'--async':'', path1 ? testDirPath + '/' + path1 : '', path2 ? testDirPath + '/' + path2 : '');
    var exitCode = shelljs.exec(command, {
        silent : true
    }).code;
    var res = exitCode === expectedExitCode;
    //    console.log(exitCode);
    console.log(testName + ' ' + (async?'async':'sync') + ': ' + passed(res));
}
function testExitCode (testDirPath, testName, path1, path2, options, expectedExitCode) {
	testExitCodeInternal (testDirPath, testName, path1, path2, options, expectedExitCode, false);
	testExitCodeInternal (testDirPath, testName, path1, path2, options, expectedExitCode, true);
}

var tests = [
             {
                 testName: 'test1', path1: 'd1', path2: 'd2',
                 options: {compareSize: true,},
                 displayOptions: {showAll: true, wholeReport: true}
             }
             
             
             ];



function runTests () {
    temp.mkdir('dircompare-test', function (err, testDirPath) {
        if (err) {
            throw err;
        }

        function onError (err) {
            console.error('An error occurred:', err)
        }

        function onExtracted () {
            test(testDirPath, 'test1', {});

            writer.write('\n');
            writer.write('Tests: ' + count + ', failed: ' + failed.toString().yellow + ', succeeded: ' + successful.toString().green + '\n');
        }

        var extractor = tar.Extract({
            path : testDirPath
        }).on('error', onError).on('end', onExtracted);

        fs.createReadStream(__dirname + "/testdir.tar").on('error', onError).pipe(extractor);

    });
}

runTests();

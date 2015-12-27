"use strict";
var colors = require('colors');
var path = require('path');
var shelljs = require('shelljs');
var util = require('util');
var fs = require('fs');
var temp = require('temp');
var tar = require("tar");

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

function runTests () {
    temp.mkdir('dircompare-test', function (err, testDirPath) {
        if (err) {
            throw err;
        }

        function onError (err) {
            console.error('Error occurred:', err)
        }

        function onExtracted () {
            test(testDirPath, 'test1', 'd1', 'd2', '-aw');
            test(testDirPath, 'test2', 'd1', 'd2', '-aw --csv');
            test(testDirPath, 'test3', 'd3', 'd4', '-aw');
            test(testDirPath, 'test4', 'd4', 'd4', '-aw');
            test(testDirPath, 'test5', 'd8', 'd9', '-a');
            test(testDirPath, 'test6', 'd8', 'd9', '-aw');
            test(testDirPath, 'test8', 'd1', 'd2', '');

            // Filters
            test(testDirPath, 'test100', 'd6', 'd7', '-a -f *.e1');
            test(testDirPath, 'test101', 'd1', 'd10', '-aw -x .x');
            test(testDirPath, 'test102', 'd6', 'd7', '-aw -f *.e1');
            test(testDirPath, 'test103', 'd1', 'd2', '-a -x *.txt');
            test(testDirPath, 'test104', 'd1', 'd2', '-aw -x *.txt');
            test(testDirPath, 'test105', 'd6', 'd7', '-a -x *.e1,*.e2');
            test(testDirPath, 'test106', 'd6', 'd7', '-aw -x *.e1,*.e2');

            // Compare by content
            test(testDirPath, 'test200', 'd11', 'd12', '-ac');
            test(testDirPath, 'test201', 'd1', 'd2', '-awc');

            // Exit code
            testExitCode(testDirPath, 'test300', 'd11', 'd11', '', 0);
            testExitCode(testDirPath, 'test301', 'd11', 'd12', '-c', 1);
            testExitCode(testDirPath, 'test302', 'd11', 'd11', '--WRONGCMD ', 2);
            testExitCode(testDirPath, 'test303', 'd11', '', '', 2);
            testExitCode(testDirPath, 'test304', 'd11', 'miss', '', 2);

            // Symlinks
            test(testDirPath, 'test400', 'd13', 'd14', '-awL');

            // Skip subdirs
            test(testDirPath, 'test500', 'd1', 'd2', '-aS');
            test(testDirPath, 'test501', 'd1', 'd2', '-awS');

            // Ignore case
            test(testDirPath, 'test600', 'd15', 'd16', '-awi');
            test(testDirPath, 'test601', 'd15', 'd16', '-aw');

            console.log();
            console.log('Tests: ' + count + ', failed: ' + failed.toString().yellow + ', succeeded: ' + successful.toString().green);
        }

        var extractor = tar.Extract({
            path : testDirPath
        }).on('error', onError).on('end', onExtracted);

        fs.createReadStream(__dirname + "/testdir.tar").on('error', onError).pipe(extractor);

    });
}

runTests();

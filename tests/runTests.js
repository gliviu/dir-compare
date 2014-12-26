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

function test (testDirPath, testName, path1, path2, options) {
    var dircompareJs = path.normalize(__dirname + '/../dircompare.js');
    var command = util.format("node %s %s %s %s", dircompareJs, options, testDirPath + '/' + path1, testDirPath + '/' + path2);
    var output = normalize(shelljs.exec(command, {
        silent : true
    }).output);
    var expected = normalize(fs.readFileSync(__dirname + '/expected/' + testName + '.txt', 'utf8'));
    if (testName == 'test1') {
//        console.log(output);
    }
    var res = output === expected;
    return res;
}

function testExitCode (testDirPath, testName, path1, path2, options, expectedExitCode) {
    var dircompareJs = path.normalize(__dirname + '/../dircompare.js');
    var command = util.format("node %s %s %s %s", dircompareJs, options, path1 ? testDirPath + '/' + path1 : '', path2 ? testDirPath + '/' + path2 : '');
    var exitCode = shelljs.exec(command, {
        silent : true
    }).code;
    var res = exitCode === expectedExitCode;
    //    console.log(exitCode);
    return res;
}

function runTests () {
    temp.mkdir('dircompare-test', function (err, testDirPath) {
        if (err) {
            throw err;
        }

        function onError (err) {
            console.error('An error occurred:', err)
        }

        function onExtracted () {
            var res = null;
            res = test(testDirPath, 'test1', 'd1', 'd2', '-aw');
            console.log('test1: ' + passed(res));
            res = test(testDirPath, 'test2', 'd1', 'd2', '-aw --csv');
            console.log('test2: ' + passed(res));
            res = test(testDirPath, 'test3', 'd3', 'd4', '-aw');
            console.log('test3: ' + passed(res));
            res = test(testDirPath, 'test4', 'd4', 'd4', '-aw');
            console.log('test4: ' + passed(res));
            res = test(testDirPath, 'test5', 'd8', 'd9', '-a');
            console.log('test5: ' + passed(res));
            res = test(testDirPath, 'test6', 'd8', 'd9', '-aw');
            console.log('test6: ' + passed(res));
            res = test(testDirPath, 'test7', 'd8', 'd9', '-a');
            console.log('test7: ' + passed(res));
            res = test(testDirPath, 'test8', 'd1', 'd2', '');
            console.log('test8: ' + passed(res));

            // Filters
            res = test(testDirPath, 'test100', 'd6', 'd7', '-a -f *.e1');
            console.log('test100: ' + passed(res));
            res = test(testDirPath, 'test101', 'd1', 'd10', '-aw -x .x');
            console.log('test101: ' + passed(res));
            res = test(testDirPath, 'test102', 'd6', 'd7', '-aw -f *.e1');
            console.log('test102: ' + passed(res));
            res = test(testDirPath, 'test103', 'd1', 'd2', '-a -x *.txt');
            console.log('test103: ' + passed(res));
            res = test(testDirPath, 'test104', 'd1', 'd2', '-aw -x *.txt');
            console.log('test104: ' + passed(res));
            res = test(testDirPath, 'test105', 'd6', 'd7', '-a -x *.e1,*.e2');
            console.log('test105: ' + passed(res));
            res = test(testDirPath, 'test106', 'd6', 'd7', '-aw -x *.e1,*.e2');
            console.log('test106: ' + passed(res));

            // Compare by content
            res = test(testDirPath, 'test200', 'd11', 'd12', '-ac');
            console.log('test200: ' + passed(res));
            res = test(testDirPath, 'test201', 'd1', 'd2', '-awc');
            console.log('test201: ' + passed(res));

            // Exit code
            res = testExitCode(testDirPath, 'test300', 'd11', 'd11', '', 0);
            console.log('test300: ' + passed(res));
            res = testExitCode(testDirPath, 'test301', 'd11', 'd12', '-c', 1);
            console.log('test301: ' + passed(res));
            res = testExitCode(testDirPath, 'test302', 'd11', 'd11', '--WRONGCMD ', 2);
            console.log('test302: ' + passed(res));
            res = testExitCode(testDirPath, 'test303', 'd11', '', '', 2);
            console.log('test303: ' + passed(res));
            res = testExitCode(testDirPath, 'test304', 'd11', 'miss', '', 2);
            console.log('test304: ' + passed(res));

            // Symlinks
            res = test(testDirPath, 'test400', 'd13', 'd14', '-awL');
            console.log('test400: ' + passed(res));

            // Ski subdirs
            res = test(testDirPath, 'test500', 'd1', 'd2', '-aS');
            console.log('test500: ' + passed(res));
            res = test(testDirPath, 'test501', 'd1', 'd2', '-awS');
            console.log('test501: ' + passed(res));

            // Ignore case
            res = test(testDirPath, 'test600', 'd15', 'd16', '-awi');
            console.log('test600: ' + passed(res));
            res = test(testDirPath, 'test601', 'd15', 'd16', '-aw');
            console.log('test601: ' + passed(res));

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

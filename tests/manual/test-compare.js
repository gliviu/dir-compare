var dircompare = require('../../index.js');

function run() {
    // process.chdir('/home/liviu/tmp/00/')
    var path1 = '/tmp/linux-4.3';
    var path2 = '/tmp/linux-4.4';

    let expected1 = '{"distinct":8349,"equal":46887,"left":792,"right":1755,"distinctFiles":8349,"equalFiles":43361,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"same":false,"differences":10896,"differencesFiles":10738,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'
    let expected2 = '{"distinct":8543,"equal":46693,"left":792,"right":1755,"distinctFiles":8543,"equalFiles":43167,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"same":false,"differences":11090,"differencesFiles":10932,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'
    let expected3 = '{"distinct":5299,"equal":20010,"left":251,"right":571,"distinctFiles":5299,"equalFiles":16484,"leftFiles":209,"rightFiles":455,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"same":false,"differences":6121,"differencesFiles":5963,"differencesDirs":158,"total":26131,"totalFiles":22447,"totalDirs":3684}'
    let expected4 = '{"distinct":5292,"equal":20017,"left":251,"right":571,"distinctFiles":5292,"equalFiles":16491,"leftFiles":209,"rightFiles":455,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"same":false,"differences":6114,"differencesFiles":5956,"differencesDirs":158,"total":26131,"totalFiles":22447,"totalDirs":3684}'

    var resSync
    var i = 1
    console.log('Sync');
    resSync = dircompare.compareSync(path1, path2, {noDiffSet: true, compareSize: true})
    console.log(`res${i++} ` + (JSON.stringify(resSync)===expected1?'OK':'FAIL'))
    resSync = dircompare.compareSync(path1, path2, {noDiffSet: true, compareContent: true})
    console.log(`res${i++} ` + (JSON.stringify(resSync)===expected2?'OK':'FAIL'))
    resSync = dircompare.compareSync(path1, path2, {noDiffSet: true, includeFilter: '*.c', compareContent: true})
    console.log(`res${i++} ` + (JSON.stringify(resSync)===expected3?'OK':'FAIL'))
    resSync = dircompare.compareSync(path1, path2, {noDiffSet: true, includeFilter: '*.c', compareContent: true,
        compareFileSync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
        ignoreLineEnding: true, ignoreWhiteSpaces: true})
    console.log(`res${i++} ` + (JSON.stringify(resSync)===expected4?'OK':'FAIL'))

    console.log('Async');
    i = 1
    Promise.resolve()
    .then(() => dircompare.compare(path1, path2, {noDiffSet: true, compareSize: true}))
    .then(res => console.log(`res${i++} ` + (JSON.stringify(res)===expected1?'OK':'FAIL')))
    .then(() => dircompare.compare(path1, path2, {noDiffSet: true, compareContent: true}))
    .then(res => console.log(`res${i++} ` + (JSON.stringify(res)===expected2?'OK':'FAIL')))
    .then(() => dircompare.compare(path1, path2, {noDiffSet: true, includeFilter: '*.c', compareContent: true}))
    .then(res => console.log(`res${i++} ` + (JSON.stringify(res)===expected3?'OK':'FAIL')))
    .then(() => dircompare.compare(path1, path2, {noDiffSet: true, includeFilter: '*.c', compareContent: true,
        compareFileAsync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
        ignoreLineEnding: true, ignoreWhiteSpaces: true}))
    .then(res => console.log(`res${i++} ` + (JSON.stringify(res)===expected4?'OK':'FAIL')))
    .catch(error => console.log(`error occurred: ${error}`))
}
run()

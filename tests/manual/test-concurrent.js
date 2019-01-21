var dircompare = require('../../index.js');
var os = require('os')

var options = {
    compareContent: true,
    noDiffSet: true
};

var path1 = `/${os.tmpdir()}/linux-4.3`;
var path2 = `/${os.tmpdir()}/linux-4.4`;

let expected = '{"distinct":8543,"equal":46693,"left":792,"right":1755,"distinctFiles":8543,"equalFiles":43167,"leftFiles":750,"rightFiles":1639,"distinctDirs":0,"equalDirs":3526,"leftDirs":42,"rightDirs":116,"same":false,"differences":11090,"differencesFiles":10932,"differencesDirs":158,"total":57783,"totalFiles":54099,"totalDirs":3684}'

var noTests = 5
var promises = []
for(let i=0;i<noTests;i++){
    var promise = dircompare.compare(path1, path2, options)
        .then(res => {
            console.log(`finished ${i} - ${new Date()}`)
            return {i, res}
        })
        .catch(error => console.log(`error occurred: ${error}`))
    promises.push(promise)
}
Promise.all(promises)
    .then(results => {
        for(let result of results) {
            console.log(`${result.i} ` + (JSON.stringify(result.res)===expected?'OK':'FAIL'))
        }
    })

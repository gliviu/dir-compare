var dircompare = require('../../index.js');
var os = require('os')
var options = {
    compareContent: 'true',
};

var path1 = `/${os.tmpdir()}/linux-4.3`;
var path2 = `/${os.tmpdir()}/linux-4.4`;
var noTests = 10000
var promise = Promise.resolve()
var results = {res1: undefined}
var t1
for(let i=0;i<noTests;i++){
    promise = promise
        .then(res1 => {
            results.res1 = res1
            t1 = new Date().getTime()
            return dircompare.compare(path1, path2, options)
                .catch(error => console.log(`error occurred: ${error}`))
        })
        .then((res2) => {
            res1 = results.res1
            if(res1) {
                var t2 = new Date().getTime()
                console.log(`${i} ${(t2-t1)/1000}s`);
                var res1s = JSON.stringify(res1)
                var res2s = JSON.stringify(res2)
                if(res1s!==res2s){
                    console.log('failed');
                }
            }
            return res2
        })
}
promise.then(result => {
    console.log(`ok`);
})

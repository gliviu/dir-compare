const untar = require('./untar')

const output = __dirname + '/testdir'
untar(__dirname + "/testdir.tar", output,
    () => {
        console.log('Extracted test data into ' + output)
    },
    err => {
        console.log('Error occurred: ' + err)
    }
)


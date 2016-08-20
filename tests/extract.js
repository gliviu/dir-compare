var untar = require('./untar');

var output = __dirname + '/testdir';
untar(__dirname + "/testdir.tar", output, function(){
    console.log('Extracted test data into '+output);
}, function(err){
    console.log('Error occurred: '+err);
});

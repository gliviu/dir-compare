var untar = require('./untar');

var output = __dirname + '/testdir'
untar(output, function(){
    console.log('Extracted test data into '+output);
}, function(err){
    console.log('Error occurred: '+err);
});

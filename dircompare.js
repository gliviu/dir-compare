#!/usr/bin/env node

var program = require('commander');
var dircompare = require('./index');
var pth = require('path');
var fs = require('fs');
var util = require('util');
var colors = require('colors');


program
.version('0.0.1')
.usage('[options] leftdir rightdir')
.option('-c, --compare-content', 'compare files by content')
.option('-f, --filter [type]', 'file name filter', undefined)
.option('-x, --exclude [type]', 'file/directory name exclude filter', undefined)
.option('-S, --skip-subdirs', 'do not recurse into subdirectories')
.option('-L, --skip-symlinks', 'do not follow symlinks')
.option('-i, --ignore-case', 'ignores case when comparing file names')
.option('-l, --show-left', 'report - show entries occurring in leftdir')
.option('-r, --show-right', 'report - show entries occurring in rightdir')
.option('-e, --show-equal', 'report - show identic entries occuring in both dirs')
.option('-d, --show-distinct', 'report - show distinct entries occuring in both dirs')
.option('-a, --show-all', 'report - show all entries')
.option('-w, --whole-report', 'report - include directories in detailed report')
.option('--csv', 'report - print details as csv')
.option('--nocolors', 'don\'t use console colors')
;

program.on('--help', function(){
    console.log('  By default files are compared by size.');
    console.log('');
    console.log('  Exit codes:');
    console.log('    0 - entries are identical');
    console.log('    1 - entries are different');
    console.log('    2 - error occurred');
    console.log('');
    console.log('  Examples:');
    console.log('    compare by content - dircompare -c dir1 dir2');
    console.log('    exclude filter - dircompare -x .git dir1 dir2');
    console.log('    include filter - dircompare -f *.js,*.yml dir1 dir2');
    console.log('    show only different files - dircompare -d dir1 dir2');
});

program.parse(process.argv);

var run = function(){
    try{
        if(program.args.length!==2){
            program.outputHelp()
            process.exit(2);
        } else{
            var options = {};


            options.compareContent = program.compareContent;
            options.compareSize = true;
            options.skipSubdirs = program.skipSubdirs;
            options.skipSymlinks = program.skipSymlinks;
            options.ignoreCase = program.ignoreCase;
            options.includeFilter = program.filter;
            options.excludeFilter = program.exclude;

            var nocolor = function(str){return str};
            var cequal = program.nocolors?nocolor:colors.green;
            var cdistinct = program.nocolors?nocolor:colors.red;
            var cleft = program.nocolors?nocolor:colors.cyan;
            var cright = program.nocolors?nocolor:colors.magenta;
            var cdir = program.nocolors?nocolor:colors.gray;

            var path1 = program.args[0];
            var path2 = program.args[1];
            var abort = false;
            if(!fs.existsSync(path1)){
                console.error(util.format("Path '%s' missing"), path1);
                abort = true;
            }
            if(!fs.existsSync(path2)){
                console.error(util.format("path '%s' missing"), path2);
                abort = true;
            }
            if(!abort){
                // compare
                var res = dircompare.compareSync(path1, path2, options);

                // PRINT DETAILS
                // calculate relative path length for pretty print
                var relativePathMaxLength = 0, fileNameMaxLength=0;
                if(!program.csv){
                    res.diffSet.forEach(function (detail) {
                        if(detail.relativePath.length>relativePathMaxLength){
                            relativePathMaxLength = detail.relativePath.length;
                        }
                        var len = getCompareFile(detail, '??').length;
                        if(len>fileNameMaxLength){
                            fileNameMaxLength = len;
                        }
                    });
                }

                // csv header
                if(program.csv){
                    console.log('path,name,state,type,size1,size2,date1,date2');
                }
                var statTotal=0, statEqual=0, statLeft=0, statRight=0, statDistinct=0;

                for(var i = 0; i<res.diffSet.length; i++){
                    var detail = res.diffSet[i];
                    var color, show = true;

                    if(!program.wholeReport){
                        // show only files
                        var type = detail.type1!=='missing'?detail.type1:detail.type2;
                        if(type!=='file'){
                            show = false;
                        }
                    }
                    if(show){
                        switch (detail.state) {
                        case 'equal':
                            color = cequal;
                            show = program.showAll || program.showEqual?true:false;
                            statTotal++;
                            statEqual++;
                            break;
                        case 'left':
                            color = cleft;
                            show = program.showAll || program.showLeft?true:false; 
                            statTotal++;
                            statLeft++;
                            break;
                        case 'right':
                            color = cright;
                            show = program.showAll || program.showRight?true:false; 
                            statTotal++;
                            statRight++;
                            break;
                        case 'distinct':
                            color = cdistinct;
                            show = program.showAll || program.showDistinct?true:false; 
                            statTotal++;
                            statDistinct++;
                            break;
                        default:
                            show = true;
                        color = colors.gray;
                        }
                        if(show){
                            if(program.csv){
                                printCsv(detail, color);
                            } else {
                                printPretty(detail, color, cdir, relativePathMaxLength, fileNameMaxLength);
                            }
                        }
                    }
                }

                // PRINT STATISTICS
                console.log(res.same?cequal('Entries are identical'):cdistinct('Entries are different'));
                console.log(util.format('total: %s, equal: %s, distinct: %s, only left: %s, only right: %s',
                        statTotal,
                        cequal(statEqual),
                        cdistinct(statDistinct),
                        cleft(statLeft),
                        cright(statRight)
                ));
                if(res.same){
                    process.exit(0);
                } else{
                    process.exit(1);
                }
            } else{
                process.exit(2);
            }
        }
    }catch(e){
        console.log(e.stack);
        process.exit(2);
    }
}

var tab = function (tabs) {
    var res = '';
    while (tabs>=0) {
        res += ' ';
        tabs--;
    }
    return res;
};

/**
 * Print details for default view mode
 */
var printPretty = function(detail, color, dircolor, relativePathMaxLength, fileNameMaxLength){
    var path = detail.relativePath===''?'/':detail.relativePath;

    var state;
    switch (detail.state) {
    case 'equal':
        state = '==';
        break;
    case 'left':
        state = '->';
        break;
    case 'right':
        state = '<-';
        break;
    case 'distinct':
        state = '<>';
        break;
    default:
        state = '?';
    }
    var spacePad = relativePathMaxLength - path.length;
    var type ='';
    type = detail.type1!=='missing' ? detail.type1 : detail.type2;
    if(type==='directory'){
        type = dircolor(type);
    }
    var cmpentrylen = getCompareFile(detail, "??").length;
    var cmpentry = getCompareFile(detail, color(state));
    if(program.wholeReport){
        console.log(util.format('[%s] %s(%s)', path, cmpentry, type));
    } else{
        console.log(util.format('[%s] %s', path, cmpentry));
    }
}

var getCompareFile = function(detail, state){
    p1 = detail.name1 ? detail.name1 : '';
    p2 = detail.name2 ? detail.name2 : '';
    var missing1 = detail.type1==='missing' ? 'missing' : '';
    var missing2 = detail.type2==='missing' ? 'missing' : '';
    return util.format('%s%s%s%s%s', missing1, p1, state, missing2, p2);
}

/**
 * Print csv details.
 */
var printCsv = function(detail, color){
    var size1='', size2='';
    if(detail.type1==='file'){
        size1 = detail.size1!=undefined ? detail.size1 : '';
    }
    if(detail.type2==='file'){
        size2 = detail.size2!=undefined ? detail.size2 : '';
    }

    var date1='', date2='';
    date1 = detail.date1!=undefined ? detail.date1.toISOString() : '';
    date2 = detail.date2!=undefined ? detail.date2.toISOString() : '';

    var type ='';
    type = detail.type1!=='missing' ? detail.type1 : detail.type2;

    var path = detail.relativePath?detail.relativePath:'/';
    var name = (detail.name1?detail.name1:detail.name2);

    console.log(util.format('%s,%s,%s,%s,%s,%s,%s,%s', path, name, color(detail.state), type, size1, size2, date1, date2));
};


run();
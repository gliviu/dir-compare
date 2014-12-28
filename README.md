dir-compare
==========
Node JS directory compare

## Installation
```shell
$ npm install dir-compare -g
```

## Usage
```javascript
var utils = require('util');
var dircompare = require('dir-compare');
var res = dircompare.compareSync(path1, path2, {compareSize: true});
console.log('equal: ' + res.equal);
console.log('distinct: ' + res.distinct);
console.log('left: ' + res.left);
console.log('right: ' + res.right);
console.log('differences: ' + res.differences);
console.log('same: ' + res.same);
res.diffSet.forEach(function (entry) {
    var state = {
        'equal' : '==',
        'left' : '->',
        'right' : '<-',
        'distinct' : '<>'
    }[entry.state];
    var name1 = entry.name1 ? entry.name1 : '';
    var name2 = entry.name2 ? entry.name2 : '';
    console.log(utils.format('%s(%s)%s%s(%s)', name1, entry.type1, state, name2, entry.type2));
});
```
Options:

* compareSize: true/false - compares files by size
* compareContent: true/false - compares files by content
* skipSubdirs: true/false - skips sub directories
* skipSymlinks: true/false - skips symbolic links
* ignoreCase: true/false - ignores case when comparing names.
* includeFilter: file name filter
* excludeFilter: file/directory name exclude filter

Result:

*  distinct: number of distinct entries
*  equal: number of equal entries
*  left: number of entries only in path1
*  right: number of entries only in path2
*  differences: total number of differences (distinct+left+right)
*  same: true if directories are identical
*  diffSet - List of changes
 *      path1: absolute path not including file/directory name,
 *      path2: absolute path not including file/directory name,
 *      relativePath: common path relative to root,
 *      name1: file/directory name
 *      name2: file/directory name
 *      state: one of equal, left, right, distinct,
 *      type1: one of missing, file, directory
 *      type2: one of missing, file, directory
 *      size1: file size
 *      size2: file size
 *      date1: modification date (stat.mdate)
 *      date2: modification date (stat.mdate)
 *      level: depth


## Command line
```
  Usage: dircompare [options] leftdir rightdir

  Options:

    -h, --help             output usage information
    -V, --version          output the version number
    -c, --compare-content  compare files by content
    -f, --filter [type]    file name filter
    -x, --exclude [type]   file/directory name exclude filter
    -S, --skip-subdirs     do not recurse into subdirectories
    -L, --skip-symlinks    do not follow symlinks
    -i, --ignore-case      ignores case when comparing file names
    -l, --show-left        report - show entries occurring in leftdir
    -r, --show-right       report - show entries occurring in rightdir
    -e, --show-equal       report - show identic entries occuring in both dirs
    -d, --show-distinct    report - show distinct entries occuring in both dirs
    -a, --show-all         report - show all entries
    -w, --whole-report     report - include directories in detailed report
    --csv                  report - print details as csv
    --nocolors             don't use console colors

  By default files are compared by size.

  Exit codes:
    0 - entries are identical
    1 - entries are different
    2 - error occurred

  Examples:
    compare by content - dircompare -c dir1 dir2
    exclude filter - dircompare -x .git dir1 dir2
    include filter - dircompare -f *.js,*.yml dir1 dir2
    show only different files - dircompare -d dir1 dir2

```
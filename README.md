dir-compare
==========
Node JS directory compare

[![Build Status](https://api.travis-ci.org/gliviu/dir-compare.svg?branch=master)](https://travis-ci.org/gliviu/dir-compare)
[![Build status](https://ci.appveyor.com/api/projects/status/fpnqkr2gfg7pwkxk/branch/master?svg=true)](https://ci.appveyor.com/project/gliviu/dir-compare)
[![codecov.io](http://codecov.io/github/gliviu/dir-compare/coverage.svg?branch=master)](http://codecov.io/github/gliviu/dir-compare?branch=master)

- [Installation](#installation)
- [Library](#library)
  * [Use](#use)
  * [Glob patterns](#glob-patterns)
  * [Compare files by content](#compare-files-by-content)
- [Command line](#command-line)
- [Changelog](#changelog)

# Installation
```shell
$ npm install dir-compare
```
or
```shell
$ npm install dir-compare -g
```
for command line utility.

# Library

## Use
```javascript
var dircompare = require('dir-compare');
var format = require('util').format;

var options = {compareSize: true};
var path1 = '...';
var path2 = '...';

var states = {'equal' : '==', 'left' : '->', 'right' : '<-', 'distinct' : '<>'};

// Synchronous
var res = dircompare.compareSync(path1, path2, options);
console.log(format('equal: %s, distinct: %s, left: %s, right: %s, differences: %s, same: %s',
            res.equal, res.distinct, res.left, res.right, res.differences, res.same));
res.diffSet.forEach(function (entry) {
    var state = states[entry.state];
    var name1 = entry.name1 ? entry.name1 : '';
    var name2 = entry.name2 ? entry.name2 : '';
    console.log(format('%s(%s)%s%s(%s)', name1, entry.type1, state, name2, entry.type2));
});

// Asynchronous
dircompare.compare(path1, path2, options)
  .then(res => {
      console.log(format('equal: %s, distinct: %s, left: %s, right: %s, differences: %s, same: %s',
                  res.equal, res.distinct, res.left, res.right, res.differences, res.same));
      res.diffSet.forEach(entry => {
          var state = states[entry.state];
          var name1 = entry.name1 ? entry.name1 : '';
          var name2 = entry.name2 ? entry.name2 : '';

          console.log(format('%s(%s)%s%s(%s)', name1, entry.type1, state, name2, entry.type2));
      });
  })
  .catch(error => console.error(error));
```

Typescript
```typescript
import { compare, compareSync, Options } from "dir-compare";
var path1 = '...';
var path2 = '...';
var options: Partial<Options> = {compareSize: true};

var res = compareSync(path1, path2, options);
console.log(res)

compare(path1, path2, options)
  .then(res => console.log(res))
  .catch(error => console.error(error));
```

Options:

* compareSize: true/false - Compares files by size. Defaults to 'false'.
* compareDate: true/false - Compares files by date of modification (stat.mtime). Defaults to 'false'.
* dateTolerance: milliseconds - Two files are considered to have the same date if the difference between their modification dates fits within date tolerance. Defaults to 1000 ms.
* compareContent: true/false - Compares files by content. Defaults to 'false'.
* skipSubdirs: true/false - Skips sub directories. Defaults to 'false'.
* skipSymlinks: true/false - Ignore symbolic links. Defaults to 'false'.
* ignoreCase: true/false - Ignores case when comparing names. Defaults to 'false'.
* noDiffSet: true/false - Toggles presence of diffSet in output. If true, only statistics are provided. Use this when comparing large number of files to avoid out of memory situations. Defaults to 'false'.
* includeFilter: File name filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns. See [Glob patterns](#glob-patterns) below.
* excludeFilter: File/directory name exclude filter. Comma separated [minimatch](https://www.npmjs.com/package/minimatch) patterns.  See [Glob patterns](#glob-patterns) below.
* resultBuilder: Callback for constructing result -  function (entry1, entry2, state, level, relativePath, options, statistics, diffSet). Called for each compared entry pair. Updates 'statistics' and 'diffSet'. Example [here](https://raw.githubusercontent.com/gliviu/dir-compare/master/defaultResultBuilderCallback.js).
* compareFileSync, compareFileAsync: Callbacks for file comparison. See [Compare files by content](#compare-files-by-content).

Result:

* distinct: number of distinct entries
* equal: number of equal entries
* left: number of entries only in path1
* right: number of entries only in path2
* differences: total number of differences (distinct+left+right)
* total: total number of entries (differences+equal)
* distinctFiles: number of distinct files
* equalFiles: number of equal files
* leftFiles: number of files only in path1
* rightFiles: number of files only in path2
* differencesFiles: total number of different files (distinctFiles+leftFiles+rightFiles)
* totalFiles: total number of files (differencesFiles+equalFiles)
* distinctDirs: number of distinct directories
* equalDirs: number of equal directories
* leftDirs: number of directories only in path1
* rightDirs: number of directories only in path2
* differencesDirs: total number of different directories (distinctDirs+leftDirs+rightDirs)
* totalDirs: total number of directories (differencesDirs+equalDirs)
* same: true if directories are identical
* diffSet - List of changes (present if Options.noDiffSet is false)
    * path1: path not including file/directory name; can be relative or absolute depending on call to compare(),
    * path2: path not including file/directory name; can be relative or absolute depending on call to compare(),
    * relativePath: path relative to root,
    * name1: file/directory name
    * name2: file/directory name
    * state: one of equal, left, right, distinct,
    * type1: one of missing, file, directory
    * type2: one of missing, file, directory
    * size1: file size
    * size2: file size
    * date1: modification date (stat.mtime)
    * date2: modification date (stat.mtime)
    * level: depth

##  Glob patterns
[Minimatch](https://www.npmjs.com/package/minimatch) patterns are used to include/exclude files to be compared.

The pattern is matched against the relative path of the entry being compared.

Following examples assume we are comparing two [dir-compare](https://github.com/gliviu/dir-compare) code bases.


```
dircompare -x ".git,node_modules" dir1 dir2')    exclude git and node modules directories
dircompare -x "expected" dir1 dir2')             exclude '/tests/expected' directory
dircompare -x "/tests/expected" dir1 dir2')      exclude '/tests/expected' directory
dircompare -x "**/expected" dir1 dir2')          exclude '/tests/expected' directory
dircompare -x "**/tests/**/*.js" dir1 dir2')     exclude all js files in '/tests' directory and subdirectories
dircompare -f "*.js,*.yml" dir1 dir2')           include js and yaml files
dircompare -f "/tests/**/*.js" dir1 dir2')       include all js files in '/tests' directory and subdirectories
dircompare -f "**/tests/**/*.ts" dir1 dir2')     include all js files in '/tests' directory and subdirectories
```


## Compare files by content
As of version 1.5.0, custom file comparison handlers may be specified.
Included handlers are:
* `dircompare.fileCompareHandlers.defaultFileCompare.compareSync`
* `dircompare.fileCompareHandlers.defaultFileCompare.compareAsync`
* `dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync`
* `dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync`

The line based comparator can be used to ignore line ending and white space differences. This comparator is not available in [CLI](#command-line) version.
```javascript
var dircompare = require('dir-compare');

var options = {
  compareContent: true,
  compareFileSync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
  compareFileAsync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
  ignoreLineEnding: true,
  ignoreWhiteSpaces: true
};

var path1 = '...';
var path2 = '...';
var res = dircompare.compareSync(path1, path2, options);
console.log(res)

dircompare.compare(path1, path2, options)
.then(res => console.log(res))
```

# Command line
```
  Usage: dircompare [options] leftdir rightdir

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -c, --compare-content    compare files by content
    -D, --compare-date       compare files by date
    --date-tolerance [type]  tolerance to be used in date comparison (milliseconds)
    -f, --filter [type]      file name filter
    -x, --exclude [type]     file/directory name exclude filter
    -S, --skip-subdirs       do not recurse into subdirectories
    -L, --skip-symlinks      ignore symlinks
    -i, --ignore-case        ignores case when comparing file names
    -l, --show-left          report - show entries occurring in leftdir
    -r, --show-right         report - show entries occurring in rightdir
    -e, --show-equal         report - show identic entries occuring in both dirs
    -d, --show-distinct      report - show distinct entries occuring in both dirs
    -a, --show-all           report - show all entries
    -w, --whole-report       report - include directories in detailed report
    --csv                    report - print details as csv
    --nocolors               don't use console colors
    --async                  Make use of multiple cores

  By default files are compared by size.
  --date-tolerance defaults to 1000 ms. Two files are considered to have
  the same date if the difference between their modification dates fits
  within date tolerance.

  Exit codes:
    0 - entries are identical
    1 - entries are different
    2 - error occurred

  Examples:
  compare by content         dircompare -c dir1 dir2
  show only different files  dircompare -d dir1 dir2

  exclude filter             dircompare -x ".git,node_modules" dir1 dir2
                             dircompare -x "/tests/expected" dir1 dir2
                             dircompare -x "**/expected" dir1 dir2
                             dircompare -x "**/tests/**/*.ts" dir1 dir2
  
  include filter             dircompare -f "*.js,*.yml" dir1 dir2
                             dircompare -f "/tests/**/*.js" dir1 dir2
                             dircompare -f "**/tests/**/*.ts" dir1 dir2
```

# Changelog
* v1.8.0 
    * globstar patterns
    * typescript corrections
    * removed support for node 0.11, 0.12, iojs
* v1.7.0 performance improvements
* v1.6.0 typescript support
* v1.5.0 added option to ignore line endings and white space differences
* v1.3.0 added date tolerance option
* v1.2.0 added compare by date option
* v1.1.0
    * detect symlink loops
    * improved color scheme for command line utility
* v1.0.0
    * asynchronous processing
    * new library options: noDiffSet, resultBuilder
    * new statistics: distinctFiles, equalFiles, leftFiles, rightFiles, distinctDirs, equalDirs, leftDirs, rightDirs
    * new --async command line option
    * Fix for https://github.com/tj/commander.js/issues/125
* v0.0.3 Fix fille ordering issue for newer node versions

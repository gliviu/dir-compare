dir-compare
==========
Node JS directory compare

**Starting with v3.0.0 the CLI utility moved to [dir-compare-cli](https://www.npmjs.com/package/dir-compare-cli).**

[![Build status](https://ci.appveyor.com/api/projects/status/fpnqkr2gfg7pwkxk/branch/master?svg=true)](https://ci.appveyor.com/project/gliviu/dir-compare)
[![codecov.io](http://codecov.io/github/gliviu/dir-compare/coverage.svg?branch=master)](http://codecov.io/github/gliviu/dir-compare?branch=master)

- [Installation](#installation)
- [Library](#library)
  * [Use](#use)
  * [Api](#api)
  * [Glob patterns](#glob-patterns)
  * [Symbolic links](#symbolic-links)
  * [Handling permission denied errors](#handling-permission-denied-errors)
- [Extension points](#extension-points)
  * [File content comparators](#file-content-comparators)
    + [Ignore line endings and white spaces](#ignore-line-endings-and-white-spaces)
  * [Glob filter](#glob-filter)
    + [Implement .gitignore filter](#implement-gitignore-filter)
  * [Name comparators](#name-comparators)
  * [Result builder](#result-builder)
- [UI tools](#ui-tools)
- [Changelog](#changelog)

# Installation
```bash
npm install dir-compare
```

# Library

## Use
```javascript
const dircompare = require('dir-compare');

const options = { compareSize: true };
// Multiple compare strategy can be used simultaneously - compareSize, compareContent, compareDate, compareSymlink.
// If one comparison fails for a pair of files, they are considered distinct.
const path1 = '...';
const path2 = '...';

// Synchronous
const res = dircompare.compareSync(path1, path2, options)
print(res)

// Asynchronous
dircompare.compare(path1, path2, options)
  .then(res => print(res))
  .catch(error => console.error(error));

function print(result) {
  console.log('Directories are %s', result.same ? 'identical' : 'different')

  console.log('Statistics - equal entries: %s, distinct entries: %s, left only entries: %s, right only entries: %s, differences: %s',
    result.equal, result.distinct, result.left, result.right, result.differences)

  result.diffSet.forEach(dif => console.log('Difference - path: %s, name1: %s, type1: %s, name2: %s, type2: %s, state: %s',
    dif.relativePath, dif.name1, dif.type1, dif.name2, dif.type2, dif.state))
}
```

Typescript
```typescript
import { compare, compareSync, Options, Result } from "dir-compare";
const path1 = '...';
const path2 = '...';
const options: Options = { compareSize: true };

const res: Result = compareSync(path1, path2, options);
console.log(res)

compare(path1, path2, options)
  .then(res => console.log(res))
  .catch(error => console.error(error));
```

## Api

```typescript
compare(path1: string, path2: string, options?: Options): Promise<Result>
compareSync(path1: string, path2: string, options?: Options): Result
```
More details can be found in the reference documentation:
* [compare](https://gliviu.github.io/dc-api/functions/compare.html)
* [compareSync](https://gliviu.github.io/dc-api/functions/compareSync.html)
* [Options](https://gliviu.github.io/dc-api/interfaces/Options.html) 
* [Result](https://gliviu.github.io/dc-api/interfaces/Result.html)

Common options:
* [compareSize](https://gliviu.github.io/dc-api/interfaces/Options.html#compareSize)
* [compareContent](https://gliviu.github.io/dc-api/interfaces/Options.html#compareContent)
* [compareDate](https://gliviu.github.io/dc-api/interfaces/Options.html#compareDate) 
* [excludeFilter](https://gliviu.github.io/dc-api/interfaces/Options.html#excludeFilter)
* [includeFilter](https://gliviu.github.io/dc-api/interfaces/Options.html#includeFilter) 
* [ignoreCase](https://gliviu.github.io/dc-api/interfaces/Options.html#ignoreCase) 
* [skipSubdirs](https://gliviu.github.io/dc-api/interfaces/Options.html#skipSubdirs)
* [skipEmptyDirs](https://gliviu.github.io/dc-api/interfaces/Options.html#skipEmptyDirs)

##  Glob patterns
[Minimatch](https://www.npmjs.com/package/minimatch) patterns are used to include/exclude files to be compared.

The pattern is matched against the relative path of the entry being compared.

Following examples assume we are comparing two [dir-compare](https://github.com/gliviu/dir-compare) code bases.

```javascript
const options = { 
  excludeFilter: ".git,node_modules",   //  exclude git and node modules directories  
  excludeFilter: "expected"         ,   //  exclude '/tests/expected' directory  
  excludeFilter: "/tests/expected"  ,   //  exclude '/tests/expected' directory  
  excludeFilter: "**/expected"      ,   //  exclude '/tests/expected' directory  
  excludeFilter: "**/tests/**/*.js" ,   //  exclude all js files in '/tests' directory and subdirectories  

  includeFilter: "*.js,*.yml"       ,   //  include js and yaml files  
  includeFilter: "/tests/**/*.js"   ,   //  include all js files in '/tests' directory and subdirectories  
  includeFilter: "**/tests/**/*.ts"     //  include all js files in '/tests' directory and subdirectories  
}
```
This behavior can be changed with [Glob filter extensions](#glob-filter).


## Symbolic links
Unless `compareSymlink` option is used, symbolic links are resolved and any comparison is applied to the file/directory they point to.

Circular loops are handled by breaking the loop as soon as it is detected.

Version `1.x` treats broken links as `ENOENT: no such file or directory`.  
Since `2.0` they are treated as a special type of entry - `broken-link` - and are available as stats (`totalBrokenLinks`, `distinctBrokenLinks`, ...).

Using `compareSymlink` option causes `dircompare` to check symlink values for equality.
In this mode two entries with identical names are considered different if
* one is symlink, the other is not
* both are symlinks but point to different locations

These rules are applied in addition to the other comparison modes; ie. by content, by size...

If entries are different because of symlinks, `reason` will be `different-symlink`. Also statistics summarize differences caused by symbolic links.

## Handling permission denied errors
Unreadable files or directories are normally reported as errors. The comparison will be interrupted with an `EACCES` exception.
This behavior can be altered with [Options.handlePermissionDenied](https://gliviu.github.io/dc-api/interfaces/Options.html#handlePermissionDenied).

# Extension points

## File content comparators
By default file content is binary compared. As of version 1.5.0 custom file comparison handlers may be specified.

Custom handlers are specified by `compareFileSync` and `compareFileAsync` options which correspond to `dircompare.compareSync()` or `dircompare.compare()` methods.

A couple of handlers are included in the library:
* binary sync compare - `dircompare.fileCompareHandlers.defaultFileCompare.compareSync`
* binary async compare - `dircompare.fileCompareHandlers.defaultFileCompare.compareAsync`
* text sync compare - `dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync`
* text async compare - `dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync`

Use [defaultFileCompare](https://github.com/gliviu/dir-compare/blob/master/src/FileCompareHandler/default/defaultFileCompare.ts) as an example to create your own.

### Ignore line endings and white spaces
Line based comparator can be used to ignore line ending and white space differences.
```javascript
const dircompare = require('dir-compare');

const options = {
  compareContent: true,
  compareFileSync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareSync,
  compareFileAsync: dircompare.fileCompareHandlers.lineBasedFileCompare.compareAsync,
  ignoreLineEnding: true,      // Ignore crlf/lf line ending differences
  ignoreWhiteSpaces: true,     // Ignore white spaces at the beginning and end of a line (similar to 'diff -b')
  ignoreAllWhiteSpaces: true,  // Ignore all white space differences (similar to 'diff -w')
  ignoreEmptyLines: true       // Ignores differences caused by empty lines (similar to 'diff -B')
};

const path1 = '...';
const path2 = '...';
const res = dircompare.compareSync(path1, path2, options);
console.log(res)

dircompare.compare(path1, path2, options)
.then(res => console.log(res))
```

## Glob filter
The current implementation of the glob filter uses minimatch and is based on [includeFilter and excludeFilter options](#glob-patterns). While it is meant to fit most use cases, [some scenarios](https://github.com/gliviu/dir-compare/issues/67) are not addressed.

Use [filterHandler option](https://gliviu.github.io/dc-api/interfaces/Options.html#filterHandler) to alter this behavior.

The following example demonstrates how to include only files with a specific extension in our comparison.
```typescript
import { Options, compareSync, Result, FilterHandler, Entry, filterHandlers } from 'dir-compare'
import { extname } from 'path'

var d1 = '...';
var d2 = '...';

const filterByfileExtension: FilterHandler = (entry: Entry, relativePath: string, options: Options): boolean => {
  if (!options.fileExtension) {
    // Fallback on the default 'minimatch' implementation
    return filterHandlers.defaultFilterHandler(entry, relativePath, options)
  }

  return options.fileExtension === extname(entry.name)
}

const options: Options = {
  compareSize: true,
  fileExtension: '.txt',
  filterHandler: filterByfileExtension
}

const res: Result = compareSync(d1, d2, options)
```

For reference, the default minimatch filter can be found in [defaultFilterHandler](https://github.com/gliviu/dir-compare/blob/master/src/FilterHandler/defaultFilterHandler.ts) which is exposed by [filterHandlers property](https://gliviu.github.io/dc-api/variables/filterHandlers.html).

### Implement .gitignore filter
[Globby](https://www.npmjs.com/package/globby) library provides the functionality to parse and apply `.gitignore` rules.
This is a [sample implementation](https://github.com/gliviu/dir-compare/blob/master/test/extended/gitignoreSupport/gitignoreFilter.ts) that uses globby and dir-compare filter extension.

Usage:
```typescript
import { Options, compareSync, Result} from 'dir-compare'
import { getGitignoreFilter } from './gitignoreFilter.js'

var d1 = '...';
var d2 = '...';

const options: Options = {
  compareSize: true,
  filterHandler: getGitignoreFilter(d1, d2),
  includeFilter: '*.js'  // if present, regular filters are applied after .gitignore rules.
}

const res: Result = compareSync(d1, d2, options)

```

## Name comparators
If [default](https://github.com/gliviu/dir-compare/blob/master/src/NameCompare/defaultNameCompare.ts) name comparison is not enough, custom behavior can be specified with [compareNameHandler](https://gliviu.github.io/dc-api/interfaces/Options.html#compareNameHandler) option.
Following example adds the possibility to ignore file extensions.
```typescript
import { Options, compare } from 'dir-compare'
import path from 'path'

const options: Options = {
    compareSize: false,                    // compare only name by disabling size and content criteria
    compareContent: false,
    compareNameHandler: customNameCompare, // new name comparator used to ignore extensions
    ignoreExtension: true,                 // supported by the custom name compare below
};

function customNameCompare(name1: string, name2: string, options: Options) {
    if (options.ignoreCase) {
        name1 = name1.toLowerCase()
        name2 = name2.toLowerCase()
    }
    if (options.ignoreExtension) {
        name1 = path.basename(name1, path.extname(name1))
        name2 = path.basename(name2, path.extname(name2))
    }
    return ((name1 === name2) ? 0 : ((name1 > name2) ? 1 : -1))
}

const path1 = '/tmp/a';
const path2 = '/tmp/b';

const res = compare(path1, path2, options).then(res => {
    console.log(`Same: ${res.same}`)
    if (!res.diffSet) {
        return
    }
    res.diffSet.forEach(dif => console.log(`${dif.name1} ${dif.name2} ${dif.state}`))
})

// Outputs
// icon.svg icon.png equal
// logo.svg logo.jpg equal
```
For reference, the default name comparator can be found in [defaultNameCompare](https://github.com/gliviu/dir-compare/blob/master/src/NameCompare/defaultNameCompare.ts) which is exposed by [compareNameHandlers property](https://gliviu.github.io/dc-api/variables/compareNameHandlers.html).


## Result builder
[Result builder](https://gliviu.github.io/dc-api/interfaces/Options.html#resultBuilder) is called for each pair of entries encountered during comparison. Its purpose is to append entries in `diffSet` and eventually update `statistics` object with new stats.

If needed it can be replaced with custom implementation.

```javascript
const dircompare = require("dircompare")

const customResultBuilder = function (entry1, entry2, state, level, relativePath, options, statistics, diffSet, reason) {
    ...
}

const options = {
    compareSize: true,
    resultBuilder: customResultBuilder
}
const res = dircompare.compareSync('...', '...', options)

```

The [default](https://github.com/gliviu/dir-compare/blob/master/src/ResultBuilder/defaultResultBuilderCallback.ts) builder can be used as an example.

# UI tools
* [dir-compare-cli](https://github.com/gliviu/dir-compare-cli)
* [Visual Studio Code - Compare Folders](https://marketplace.visualstudio.com/items?itemName=moshfeu.compare-folders)

# Changelog
* v4.2.0
  * Updated dependencies
  * Increased test coverage
* v4.1.0
  * Possibility to alter the default [Glob filter](#glob-filter) behavior
  * [Ignore files and directories according to .gitignore rules](#implement-gitignore-filter).
  * New [origin](https://gliviu.github.io/dc-api/interfaces/Entry.html#origin) field in Entry to distinguish between the left or right directory
  * Improved api documentation
* v4.0.0
    * Switched project to typescript
    * [Async comparator](https://gliviu.github.io/dc-api/functions/compare.html) improvements when comparing large directory structures
      * Heap usage has decreased 3x compared to previous version
      * Works 2x faster when comparing by content
      * Better concurrency. UI apps will be more responsive while comparison is ongoing

  Breaking changes:
    * Using this library to compare two files will ignore the name of the files. More details in [#48](https://github.com/gliviu/dir-compare/issues/48)
    * Removed support for node 8, 9
* v3.3.0 Added `skipEmptyDirs` option
* v3.2.0 [Handle permission denied errors](#handling-permission-denied-errors)
* v3.1.0 Added `ignoreAllWhiteSpaces` and `ignoreEmptyLines` options
* v3.0.0 Moved CLI component into separate project [dir-compare-cli](https://github.com/gliviu/dir-compare-cli)
* v2.4.0 [New option](https://gliviu.github.io/dc-api/interfaces/Options.html#compareNameHandler) to customize file/folder name comparison
* v2.3.0 Fixes
* v2.1.0 Removed [bluebird](https://github.com/petkaantonov/bluebird/#%EF%B8%8Fnote%EF%B8%8F) dependency
* v2.0.0
  * New option to compare symlinks.
  * New field indicating reason for two entries being distinct.
  * Improved command line output format.
  * Tests are no longer part of published package.
  * Generated [Api](https://gliviu.github.io/dc-api) documentation.
  
  Breaking changes:
  * Broken links are no longer treated as errors. As a result there are new statistics (leftBrokenLinks, rightBrokenLinks, distinctBrokenLinks, totalBrokenLinks) and new entry type - broken-link.
    Details in [Symbolic links](#symbolic-links).
  * Typescript correction: new interface `Result` replaced `Statistics`.
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
    * asynchronous comparison
    * new library options: noDiffSet, resultBuilder
    * new statistics: distinctFiles, equalFiles, leftFiles, rightFiles, distinctDirs, equalDirs, leftDirs, rightDirs
    * new --async command line option
    * Fix for https://github.com/tj/commander.js/issues/125
* v0.0.3 Fix file ordering issue for newer node versions


#!/bin/bash

set -euo pipefail

build_rootdir=$(dirname "$0")/../../build/test/extended
working_directory=$(dirname "$0")

for file in compare.js permissionDeniedTests.js lineBasedFileCompareTest.js async.js concurrent.js heap.js
do
  node $build_rootdir/$file
  if [[ $? -ne 0 ]]; then
      echo Tests failed
      exit 1
  fi
done

$working_directory/gitignoreSupport/runtest.sh
if [[ $? -ne 0 ]]; then
    echo Tests failed
    exit 1
fi

echo Tests OK

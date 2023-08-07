#!/bin/bash

set -euo pipefail

ROOTDIR=$(dirname "$0")/../../build/test/extended

for file in compare.js permissionDeniedTests.js lineBasedFileCompareTest.js async.js concurrent.js heap.js
do
  node $ROOTDIR/$file
  if [[ $? -ne 0 ]]; then
      echo Tests failed
      exit 1
  fi
done

./gitignoreSupport/runtest.sh
if [[ $? -ne 0 ]]; then
    echo Tests failed
    exit 1
fi

echo Tests OK

#!/bin/bash

ROOTDIR=$(dirname "$0")/../../build/test/extended

for file in compare.js async.js concurrent.js leaks-sync.js leaks-async.js
do
  node $ROOTDIR/$file
  if [[ $? -ne 0 ]]; then
      echo Tests failed
      exit 1
  fi
done
echo Tests OK

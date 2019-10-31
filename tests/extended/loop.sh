#!/bin/bash

testdir=$(dirname "$0")
mkdir -p loopresults
for (( n=0; ; n++ ))
do
  echo $n
  res=$(node $testdir/../../build/tests/runTests.js skipcli unpacked noreport)
  if [[ $? -ne 0 ]]; then
      echo Tests FAILED
      echo Check $testdir/failed.txt
      echo $res > $testdir/failed.txt
      exit 1
  fi
done
echo Tests OK

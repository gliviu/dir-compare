#!/bin/bash

l1=linux-4.3
l2=linux-4.4

ROOTDIR=$(dirname "$0")/../..
TESTDIR=$ROOTDIR/build/tests/testdir
if [ ! -d "$TESTDIR" ]; then
    echo "Testdir does not exist. Extracting into $TESTDIR"
    node $ROOTDIR/build/tests/extract.js
fi

if [ ! -f /tmp/$l1.tar.gz ]; then
  echo Downloading /tmp/$l1.tar.gz
  curl https://mirrors.edge.kernel.org/pub/linux/kernel/v4.x/$l1.tar.gz --output /tmp/$l1.tar.gz
fi
if [ ! -f /tmp/$l2.tar.gz ]; then
  echo Downloading /tmp/$l2.tar.gz
  curl https://mirrors.edge.kernel.org/pub/linux/kernel/v4.x/$l2.tar.gz --output /tmp/$l2.tar.gz
fi

if [ ! -d /tmp/$l1 ]; then
  echo Extracting into /tmp/$l1
  tar -xzf /tmp/$l1.tar.gz -C /tmp
  if [[ $? -ne 0 ]]; then
      echo Extracting $l1 failed
      exit 1
  fi
fi
if [ ! -d /tmp/$l2 ]; then
  echo Extracting into /tmp/$l2
  tar -xzf /tmp/$l2.tar.gz -C /tmp
  if [[ $? -ne 0 ]]; then
      echo Extracting $l2 failed
      exit 1
  fi
fi

echo Init done
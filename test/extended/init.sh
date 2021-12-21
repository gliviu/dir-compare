#!/bin/bash

CURRENT_DIR=$(dirname "$0")
if [[ ! 'root' == $(whoami) ]]; then echo 'Run as root.'; exit 1; fi;

#  todo: needed?
# ROOTDIR=$(dirname "$0")/../..
# TESTDIR=$ROOTDIR/build/test/testdir
# if [ ! -d "$TESTDIR" ]; then
#     echo "Testdir does not exist. Extracting into $TESTDIR"
#     node $ROOTDIR/build/test/extract.js
# fi

# Download and extract linux kernels
l1=linux-4.3
l2=linux-4.4
mkdir -p /tmp/dircompare
if [ ! -f /tmp/dircompare/$l1.tar.gz ]; then
  echo Downloading /tmp/dircompare/$l1.tar.gz
  curl https://mirrors.edge.kernel.org/pub/linux/kernel/v4.x/$l1.tar.gz --output /tmp/dircompare/$l1.tar.gz
fi
if [ ! -f /tmp/dircompare/$l2.tar.gz ]; then
  echo Downloading /tmp/dircompare/$l2.tar.gz
  curl https://mirrors.edge.kernel.org/pub/linux/kernel/v4.x/$l2.tar.gz --output /tmp/dircompare/$l2.tar.gz
fi

if [ ! -d /tmp/$l1 ]; then
  echo Extracting into /tmp/$l1
  tar -xzf /tmp/dircompare/$l1.tar.gz -C /tmp
  if [[ $? -ne 0 ]]; then
      echo Extracting $l1 failed
      exit 1
  fi
fi
if [ ! -d /tmp/$l2 ]; then
  echo Extracting into /tmp/$l2
  tar -xzf /tmp/dircompare/$l2.tar.gz -C /tmp
  if [[ $? -ne 0 ]]; then
      echo Extracting $l2 failed
      exit 1
  fi
fi

# Extract dir for permission denied tests
PERMISSION_DENIED_TEST_FILE=37-perms-test
PERMISSION_DENIED_TEST_DIR=/tmp/$PERMISSION_DENIED_TEST_FILE
mkdir -p $PERMISSION_DENIED_TEST_DIR
tar -xf $CURRENT_DIR/res/$PERMISSION_DENIED_TEST_FILE.tar -C $PERMISSION_DENIED_TEST_DIR

# Generate large file
fallocate -l 5G /tmp/dircompare/big_file

echo Init done
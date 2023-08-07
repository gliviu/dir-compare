#!/bin/bash

set -euo pipefail

CURRENT_DIR=$(dirname "$0")

echo Extract dir for permission denied tests
mkdir -p /tmp/37-perms-test
sudo tar -xf $CURRENT_DIR/res/37-perms-test.tar -C /tmp/37-perms-test

echo Generate large file
mkdir -p /tmp/dircompare
sudo fallocate -l 5G /tmp/dircompare/big_file

echo Initialize gitignore tests
./gitignoreSupport/init.sh

echo Download and extract linux kernels
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

echo Init done
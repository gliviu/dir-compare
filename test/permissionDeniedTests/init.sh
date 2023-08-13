#!/bin/bash

set -euo pipefail

workdir=$(dirname "$0")
testdir=/tmp/37-perms-test

echo Sudo required for permission-denied tests
sudo rm -fr $testdir
mkdir -p $testdir
sudo tar -xf $workdir/perms-test.tar -C /tmp/37-perms-test

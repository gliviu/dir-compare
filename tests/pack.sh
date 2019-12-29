#!/bin/bash
TESTS=$(dirname "$0")
cd ${TESTS}/testdir
tar -cf ../testdir.tar *
cd ..

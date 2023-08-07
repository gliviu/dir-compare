#!/bin/bash

working_directory=$(dirname "$0")
cd $working_directory

if [ ! -d "node_modules" ]; then
  echo Run npm install
  npm install
  ln -s ../../../../../dir-compare ./node_modules/dir-compare
fi

if [ ! -d "fixture" ]; then
  echo Unpacking fixtures
  tar -xf fixture.tar
fi
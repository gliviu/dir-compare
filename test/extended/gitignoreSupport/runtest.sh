#!/bin/bash

echo Start gitignore tests

working_directory=$(dirname "$0")
cd $working_directory

npm test

echo Done
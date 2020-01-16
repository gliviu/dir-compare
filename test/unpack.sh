#!/bin/bash
TESTS=$(dirname "$0")
cd ${TESTS}
node extract.js

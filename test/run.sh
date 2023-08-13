#!/bin/bash

# Runs regular tests and permission-denied tests.

working_directory=$(dirname "$0")

print_message() {
    local message="$1"
    local color="$2"

    case $color in
        green)
            echo -e "\e[32m$message\e[0m"
            ;;
        orange)
            echo -e "\e[33m$message\e[0m"
            ;;
        *)
            echo "$message"
            ;;
    esac
}


echo -e "==== Initialize ==== "
$working_directory/permissionDeniedTests/init.sh
if [ $? -ne 0 ]; then
    print_message "Permission-denied tests initialization failed" orange
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    print_message "Npm install failed" orange
    exit 1
fi

npm run build
if [ $? -ne 0 ]; then
    print_message "Build failed" orange
    exit 1
fi

echo -e "\n\n==== Run tests ==== "
node build/test/runTests.js
if [ $? -ne 0 ]; then
    print_message "\n\nTests failed" orange
    exit 1
fi

echo -e "\n\n==== Run permission-denied tests ==== "
node build/test/permissionDeniedTests/permissionDeniedTests.js
if [ $? -ne 0 ]; then
    print_message "\n\nPermission denied tests failed" orange
    exit 1
fi

# If both tests succeed
print_message "\n\nAll tests ok" green

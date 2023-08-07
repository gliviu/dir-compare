@echo off

SET working_directory=%~dp0
cd %working_directory%

if not exist "node_modules" (
    echo Run npm install
    npm install

    REM link dir-compare globally
    cd ..\..\..
    npm link
    cd %working_directory%

    REM add dir-compare dependency
    npm link dir-compare
)

if not exist "fixture" (
    echo Unpacking fixtures
    tar -xf fixture.tar
)

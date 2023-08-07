@echo off

echo Start gitignore tests

SET working_directory=%~dp0
cd %working_directory%

npm test

echo Done

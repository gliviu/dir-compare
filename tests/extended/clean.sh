#!/bin/bash

l1=linux-4.3
l2=linux-4.4
if [ -f /tmp/$l1.tar.gz ]; then
  echo Removing $l1.tar.gz
  rm /tmp/$l1.tar.gz
fi
if [ -f /tmp/$l2.tar.gz ]; then
  echo Removing $l2.tar.gz
  rm /tmp/$l2.tar.gz
fi
if [ -d /tmp/$l1 ]; then
  echo Removing $l1
  rm -r /tmp/$l1
fi
if [ -d /tmp/$l2 ]; then
  echo Removing $l2
  rm -r /tmp/$l2
fi

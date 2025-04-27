#!/bin/bash

if [ "$1" == "--build-deps" ]; then
    sudo apt update -y
    sudo apt isntall -y binutils
fi

clear
npm run build-linux
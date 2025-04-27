#!/bin/bash

[ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

if [ "$1" == "--build-deps" ]; then
    sudo apt update -y
    sudo apt install -y binutils
fi

clear
npm run build-linux
#!/bin/bash

trap 'echo -e "\033[0;31mError: Failed to initialize OpenStockTracker\033[0m"; exit 1' ERR

set -e

if [ "$1" == "--install-node" ]; then
    sudo apt update -y
    sudo apt install curl -y

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    source "$HOME/.nvm/nvm.sh"
    nvm install --lts
fi

[ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

npm install --save-dev electron
npm install --save-dev electron-builder

clear
echo -e "\033[0;32mOpenStockTracker initialized\033[0m"
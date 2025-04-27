#!/bin/bash

trap 'echo -e "\033[0;31mError: Failed to initialize OpenStockTracker\033[0m"; exit 1' ERR

set -e

if [ "$1" == "--install-node" ]; then
    sudo apt update -y
    sudo apt install curl -y

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    \. "$HOME/.nvm/nvm.sh"
    nvm install --lts
fi

npm install --save-dev electron
npm install --save-dev electron-builder

clear
echo -e "\033[0;32mOpenStockTracker initialized\033[0m"
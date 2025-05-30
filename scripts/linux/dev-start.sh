#!/bin/bash

[ -f "$HOME/.nvm/nvm.sh" ] && source "$HOME/.nvm/nvm.sh"

if [ "$1" == "--wsl-packages" ]; then
    sudo apt update -y
    sudo apt install -y libgtk-3-0 libxss1 libnss3 libgconf-2-4 libasound2 libx11-xcb1 libxtst6 libcanberra-gtk3-0 libnss3 libxrandr2 libgbm1 libglib2.0-0
fi

clear
npm start
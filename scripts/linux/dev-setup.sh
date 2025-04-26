#!/bin/bash

{
    npm install --save-dev electron
    npm install --save-dev electron-builder

    clear
    echo -e "\033[0;32mOpenStockTracker initialized\033[0m"
} || {
    echo -e "\033[0;31mError: Failed to initialize OpenStockTracker\033[0m"
}
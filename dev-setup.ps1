$ErrorActionPreference = "Stop"

try{
    npm install --save-dev electron
    npm install --save-dev electron-builder

    Clear-Host
    write-host "OpenStockTracker initialized" -ForegroundColor Green  
}catch{
    write-host "Error: Failed to initialize OpenStockTracker" -ForegroundColor Red
}
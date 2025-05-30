$ErrorActionPreference = "Stop"

try{
    if ($args[0] -eq "--install-node") {
        winget install -e --id OpenJS.NodeJS.LTS
    }

    npm install --save-dev electron
    npm install --save-dev electron-builder

    Clear-Host
    write-host "OpenStockTracker initialized" -ForegroundColor Green  
}catch{
    write-host "Error: Failed to initialize OpenStockTracker" -ForegroundColor Red
}
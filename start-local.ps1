# PowerShell launcher for local deployment
# Runs from repo root, verifies python, starts the server, prints URL and stop instructions

Write-Host "[Chess Pieces] Local Deployment Launcher`n" -ForegroundColor Cyan

# Check Python availability
$pythonVersion = & python --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python is not available on PATH. Please install Python 3 and ensure it is accessible from the command line." -ForegroundColor Red
    exit 1
}
Write-Host "Python found: $pythonVersion`n" -ForegroundColor Green

# Show help if requested
if ($args -contains "--help" -or $args -contains "-h") {
    Write-Host "Usage: .\start-local.ps1`nStarts the local server on http://127.0.0.1:8000/ (or 8001 if 8000 is occupied)." -ForegroundColor Yellow
    exit 0
}

# Try port 8000, fallback to 8001 if needed
$ports = @(8000, 8001)
$serverStarted = $false
foreach ($port in $ports) {
    Write-Host "Attempting to start server on port $port..." -ForegroundColor Yellow
    $proc = Start-Process -NoNewWindow -PassThru -FilePath python -ArgumentList "local_server.py --host 127.0.0.1 --port $port --dir ."
    Start-Sleep -Seconds 2
    # Check if server is running by attempting to connect
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $serverStarted = $true
            Write-Host "`nServer running at http://127.0.0.1:$port/" -ForegroundColor Green
            Write-Host "Press Ctrl+C in this window to stop the server." -ForegroundColor Yellow
            Wait-Process -Id $proc.Id
            break
        }
    } catch {
        # Server not running on this port
        Stop-Process -Id $proc.Id -Force
    }
}
if (-not $serverStarted) {
    Write-Host "ERROR: Failed to start the server on ports 8000 or 8001. Is Python installed and not blocked by security software?" -ForegroundColor Red
    exit 1
}

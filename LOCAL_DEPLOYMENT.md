# Local Windows Deployment Guide

## Prerequisites
- Python 3 must be installed and available on your PATH
- A modern desktop browser (Chrome, Edge, Firefox, etc.)

## How to Run
1. Open PowerShell in the repo root (where `start-local.ps1` is located)
2. Run:
   ```
   .\start-local.ps1
   ```
   This will start the server on [http://127.0.0.1:8000/](http://127.0.0.1:8000/) (or 8001 if 8000 is occupied)

   - The script will print the local URL and how to stop the server (Ctrl+C)
   - The server must be started from the repo root

## Canonical Startup Path
```
python local_server.py --host 127.0.0.1 --port 8000 --dir .
```

## Important Notes
- **Do not open `index.html` directly with `file://`** — always use the local server
- If port 8000 is in use, rerun the script to use port 8001
- All browser drafts and local data are stored per browser profile and are not portable
- To move lessons or games, use the `Save lesson` or `Save PGN` features and transfer the files manually

## Test Plan
- `python --version` and `python local_server.py --help` should both succeed
- Visit [http://127.0.0.1:8000/](http://127.0.0.1:8000/) in your browser
- The chessboard and pieces should render
- Analysis should work (Stockfish loads, no missing-header errors)
- Saving and opening lessons should work
- Refreshing the page restores your draft in the same browser profile
- If port 8000 is busy, rerun on 8001 and confirm identical behavior

## Troubleshooting
- If the server fails to start, ensure Python is installed and not blocked by security software
- No firewall, TLS, or LAN access is required or supported
- The app is for local use only; do not expose to the internet

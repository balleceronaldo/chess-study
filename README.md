# Desktop Setup + Analysis Chessboard

Static desktop-first chess setup and analysis web app inspired by the Endgame Trainer Android app.

## Run locally

Serve the folder over HTTP from this directory:

```powershell
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

Do not open `index.html` directly over `file://`. The Stockfish worker and asset loading are intended to run from a local server.

## Included assets

- MPChess SVG piece set in `assets/pieces/mpchess/`
- `chess.js` in `vendor/chess.js`
- Stockfish browser worker bundle in `vendor/stockfish/`

## Draft persistence

The app stores one browser-local draft under `setup-analysis-draft-v1`, including:

- title
- setup FEN
- board orientation
- active tab
- advanced-controls open state
- current lesson-tree position
- the full lesson move tree, including variations and sub-variations

You can also save and reopen lesson files as `*.lesson.json` for exact restoration outside local browser storage.

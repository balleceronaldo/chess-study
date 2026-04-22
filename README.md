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

## Update GitHub

After making changes, review what will be committed and push to GitHub:

```powershell
git status
git add README.md
git commit -m "Update README"
git push origin main
```

If you changed more than one file, replace `git add README.md` with the specific files you want to upload.

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
- board annotations, including painted squares, circles, and arrows
- lesson note text and whether the note panel is expanded

You can also save and reopen lesson files as `*.lesson.json` for exact restoration outside local browser storage.

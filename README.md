# Chess Lesson Study Board

---
**Local Windows deployment:** See [LOCAL_DEPLOYMENT.md](LOCAL_DEPLOYMENT.md) for running locally with Python and PowerShell.
---

Browser-based chess setup, study, and analysis app for building positions, recording lesson lines, adding annotations, and running Stockfish in the browser.

## Live App

Use the deployed GitHub Pages version here:

```text
https://coachdinosaur.github.io/chess-study/
```

For normal use, you do not need to install anything or run a local server.

## What It Does

- build any legal chess position
- play moves from that position
- create main lines and side variations
- run Stockfish analysis in the browser
- probe the Lichess tablebase for up-to-3x3 endgames
- show the top 3 engine lines for the current position
- practice either the selected lesson line or any recorded branch
- draw arrows, circles, and highlighted squares
- import and export PGN with variations and comments
- write a lesson note
- save and reopen lessons as files

## Recent Improvements

- added Lichess tablebase analysis for legal up-to-3x3 endgames, including pawns, with no backend or API key required
- tablebase results now replace Stockfish automatically for eligible positions and fall back to Stockfish if the lookup is unavailable, rate-limited, offline, or out of scope
- tablebase move output now shows numbered SAN continuation lines, such as `1. Kb4 Kc6 2. ...`, instead of only result, DTM, and DTZ fields
- tablebase and engine PV lines stay visible after a move is played when the move belongs to one of the displayed lines, matching the smoother Lichess-style analysis flow
- analysis display now maps tablebase results into the existing eval badge, eval bar, status grid, and move-line panel
- lesson title, notation, and analysis move text are larger, while move-list text uses a lighter semibold weight
- light theme background is darker and easier on the eyes
- right-click annotation green is darker in both light and dark themes

## Main Workspace

The app is organized around:

- a chessboard on the left
- a lesson title, `Analyze` / `Stop` button, move tree, and navigation area on the right
- optional tools with `Setup`, `Analysis`, and `Line` tabs
- a three-dot menu with note, tools, PV-line visibility, and a mobile fullscreen toggle on supported browsers

## Practice Mode

The app includes two student practice styles:

- `Selected line`: follows the displayed lesson line from the root position
- `Branch drill`: starts from the current position and accepts any recorded child move
- start either mode from the `Analysis` or `Line` tool panel
- future moves are hidden while practice is active
- Stockfish output is hidden until practice stops
- wrong guesses do not change the saved lesson tree

## Lesson Files and PGN

`Save lesson` downloads a JSON file named like:

```text
my-lesson.lesson.json
```

Saved lesson files include:

- lesson title
- setup FEN
- board orientation
- active tab
- lesson tree and current node
- whether PV lines are shown
- annotations
- lesson note

`Open lesson` accepts `.json` and `.lesson.json` files.

`Export PGN` downloads a `.pgn` file that includes:

- lesson title as the PGN event name
- starting FEN when the lesson does not begin from the normal chess start
- the selected main line plus all recorded side variations
- PGN comments attached to positions in the move tree

`Import PGN` accepts `.pgn` files and rebuilds the lesson tree from the PGN move text, variations, and comments.

Use JSON when you need the full app state. JSON keeps the lesson note, annotations, board orientation, active tab, and other app-specific settings that PGN does not carry.

## Browser Draft Persistence

The app also keeps one browser-local working draft under `setup-analysis-draft-v1`, including:

- title
- setup FEN
- board orientation
- active tab
- advanced-controls open state
- current lesson-tree position
- full lesson move tree, including variations
- whether PV lines are shown
- practice mode preference
- board annotations
- lesson note text and note panel state

This draft is local to one browser profile. If the lesson matters, save a lesson file.

## Mobile Fullscreen

On supported mobile browsers, the three-dot menu shows `Enter fullscreen` / `Exit fullscreen` in mobile view.

Important limit:

- this is best-effort browser fullscreen, not PWA standalone mode
- iPhone Safari in a normal browser tab does not support hiding the browser bar for this app, so the fullscreen item stays hidden there

## Sharing and Multiple Users

Different people can use the GitHub Pages app at the same time on different devices or browser profiles.

Important limits:

- the app is not real-time collaborative
- one person's browser draft does not automatically sync to another person's browser
- lesson sharing happens by sending a saved `.lesson.json`, `.json`, or `.pgn` file
- multiple tabs in the same browser profile can overwrite the same local draft

## Included Assets

- MPChess SVG piece set in `assets/pieces/mpchess/`
- `chess.js` in `vendor/chess.js`
- Stockfish browser worker bundle in `vendor/stockfish/`

## Stockfish Upgrades

This app uses browser-compatible Stockfish bundles, not native desktop `stockfish.exe` downloads.

Put browser bundle files in `vendor/stockfish/`. The app will automatically use the strongest installed bundle it can run in this order:

- `stockfish-18.js` + `stockfish-18.wasm`
- `stockfish-18-single.js` + `stockfish-18-single.wasm`
- `stockfish-18-lite.js` + `stockfish-18-lite.wasm`
- `stockfish-18-lite-single.js` + `stockfish-18-lite-single.wasm`

Recommended setups:

- easiest stronger upgrade: add `stockfish-18-single.js` and `stockfish-18-single.wasm`
- strongest local setup: add `stockfish-18.js` and `stockfish-18.wasm`, then run `python local_server.py`

If you only install a multi-threaded bundle, the app needs the local server above or another server that sends `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`.

## Tablebase Analysis

For legal endgames with one king per side, no castling rights, up to 3 pieces per side, and up to 6 pieces total, `Analyze` uses the public Lichess tablebase before Stockfish.

This works from GitHub Pages or any static deployment because the request goes directly from the browser to:

```text
https://tablebase.lichess.org/standard
```

Important limits:

- tablebase lookup needs internet access
- results are cached per full FEN in the browser session
- solved move lines use bounded follow-up probes to build SAN continuations
- if the lookup is unavailable, rate-limited, or returns an unexpected response, the app falls back to Stockfish

## Local Development

If you want to run the app from this repository locally, serve the folder over HTTP:

```powershell
python -m http.server 8000
```

For the strongest multi-threaded Stockfish builds, use the included server instead:

```powershell
python local_server.py
```

Then open:

```text
http://127.0.0.1:8000/
```

Do not open `index.html` directly over `file://`. The Stockfish worker and asset loading are intended to run from an HTTP server.

## Update GitHub

After making changes, review what will be committed and push to GitHub:

```powershell
git status
git add README.md
git commit -m "Update README"
git push origin main
```

If you changed more than one file, replace `git add README.md` with the specific files you want to upload.

## Documentation

- Beginner-friendly guide: [USER_GUIDE.md](./USER_GUIDE.md)

# Chess Lesson Study Board

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
- show the top 3 engine lines for the current position
- draw arrows, circles, and highlighted squares
- write a lesson note
- save and reopen lessons as files

## Main Workspace

The app is organized around:

- a chessboard on the left
- a lesson title, `Analyze` / `Stop` button, move tree, and navigation area on the right
- optional tools with `Setup`, `Analysis`, and `Line` tabs
- a three-dot menu with note, tools, and PV-line visibility controls

## Lesson Files

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
- board annotations
- lesson note text and note panel state

This draft is local to one browser profile. If the lesson matters, save a lesson file.

## Sharing and Multiple Users

Different people can use the GitHub Pages app at the same time on different devices or browser profiles.

Important limits:

- the app is not real-time collaborative
- one person's browser draft does not automatically sync to another person's browser
- lesson sharing happens by sending a saved `.lesson.json` or `.json` file
- multiple tabs in the same browser profile can overwrite the same local draft

## Included Assets

- MPChess SVG piece set in `assets/pieces/mpchess/`
- `chess.js` in `vendor/chess.js`
- Stockfish browser worker bundle in `vendor/stockfish/`

## Local Development

If you want to run the app from this repository locally, serve the folder over HTTP:

```powershell
python -m http.server 8000
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

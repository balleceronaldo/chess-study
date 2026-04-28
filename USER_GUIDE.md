# Chess Lesson Study Board User Guide

## What This App Is

Chess Lesson Study Board is a chess study notebook that runs in your web browser.

You can use it to:

- set up any chess position
- play moves from that position
- build main lines and side lines
- ask Stockfish for analysis
- practice a recorded line or branch without seeing future moves
- draw arrows, circles, and highlights on the board
- write a lesson note
- save the lesson as a file and open it again later

The app is best on a desktop or laptop computer with a mouse or trackpad.

## Open the App

Open this website in your browser:

```text
https://coachdinosaur.github.io/chess-study/
```

You do not need to install anything or run a local server to use the deployed app.

## Quick Start

If you want the fastest way to begin, do this:

1. Open `https://coachdinosaur.github.io/chess-study/`.
2. Click the lesson title box on the right and type a name.
3. Click the three-dot menu.
4. Click `Show tools`.
5. Use the `Setup` tab if you want to build a custom starting position.
6. Click the `Analysis` tab.
7. Click pieces to make moves.
8. Click the `Analyze` button beside the three-dot menu if you want Stockfish to evaluate the current position.
9. Read the 3 engine lines that appear below the move list.
10. Click the same button again when it changes to `Stop` if you want to stop the search.
11. Click the three-dot menu again and choose `Save lesson` when you want a file copy.

## The Big Idea

The app has three main work areas:

- the board on the left
- the lesson title, move list, and navigation on the right
- the tools panel, which can show `Setup`, `Analysis`, and `Line`

If you ever feel lost, click the three-dot menu and choose `Show tools`.

## What You See on the Screen

### Left side: the board area

The left side shows:

- the chessboard
- the lesson title above the board
- the current mode, such as `Setup` or `Analysis`
- whether the position is ready or has a warning
- whose turn it is
- castling rights
- en passant information
- the current board FEN
- the source setup FEN
- the evaluation badge and evaluation bar when engine analysis is running

### Right side: the lesson area

The right side shows:

- the lesson title box
- the `Analyze` / `Stop` button
- the three-dot menu
- the notation tree, which is the move list
- the engine lines area under the move list when PV lines are shown
- move navigation buttons
- the optional lesson note
- the optional tools panel

The notation tree stays visible even when the tools panel is hidden.

## The Three-Dot Menu

Click the three-dot button near the title to open the lesson actions menu.

From this menu you can:

- `Open lesson`
- `Save lesson`
- `Import PGN`
- `Export PGN`
- `Show note` or `Hide note`
- `Show tools` or `Hide tools`
- `Show PV lines` or `Hide PV lines`
- `Enter fullscreen` or `Exit fullscreen` on supported mobile browsers
- switch between `Light` and `Dark` theme

Your theme choice is remembered in the same browser.

Important limit:

- iPhone Safari in a normal browser tab does not support this fullscreen mode, so the menu item stays hidden there

## Your First Lesson

Here is a simple example you can follow from start to finish.

1. Open the website.
2. Type a title such as `My first checkmate lesson`.
3. Open the three-dot menu.
4. Click `Show tools`.
5. Stay on `Setup` if you want to build a special starting position.
6. If you want the normal chess starting position, you can leave it as it is.
7. Click `Analysis`.
8. Make a move on the board.
9. Make another move.
10. Watch the move list on the right grow as you play.
11. Click the header `Analyze` button to ask Stockfish what it thinks.
12. Read the 3 PV lines that appear below the move list.
13. Add a note if you want to explain the lesson.
14. Click `Save lesson` when you want a file copy to keep or share.

## The Three Tabs

The tools panel has three tabs:

- `Setup`: build or change the starting position
- `Analysis`: play legal moves and run Stockfish
- `Line`: review the move tree without focusing on the engine panel

## Setup Tab

Use `Setup` to decide what the starting chess position should be.

### Setup buttons

The `Setup` tab includes:

- `Reset setup`: go back to the normal chess starting position
- `Clear board`: remove every piece from the board
- `Flip board`: turn the board around so the other side is at the bottom

### Adding and moving pieces

The piece palette lets you put pieces on the board.

You can:

- choose `White` or `Black` in the palette
- click a palette piece to arm it
- click a board square to place the armed piece there
- click the same palette piece again to unarm it
- drag a palette piece onto the board to copy it onto a square
- drag a piece that is already on the board to move it to another square
- right-click a square in `Setup` to remove the piece on that square

Helpful behavior:

- if no piece is armed and you click a board piece, that piece type becomes armed so you can place more of that kind
- dragging a board piece moves the actual piece that is already there

### FEN editor

FEN is a text way to describe a chess position.

The `Position source` area lets you paste a full 6-part FEN and load it.

You can:

- paste a legal FEN into the text area
- click `Apply FEN` to replace the current setup with that position
- click `Reset draft` to throw away unsaved text in the FEN box and return to the current real setup

Important behavior:

- the board and the FEN stay in sync
- board edits update the FEN field automatically
- changing the setup resets the current analysis tree because the starting position changed
- invalid FEN is rejected and a warning message appears

### Advanced position details

Open `Advanced position details` when you need to control:

- side to move
- White castling rights
- Black castling rights
- en passant target square

Rules enforced by the app:

- the normal starting position always locks side to move to White
- castling checkboxes only work when the needed king and rook are on their home squares
- the en passant menu only shows legal target squares for the current position

### Legal position check

You can only analyze legal positions.

If the setup is invalid, the app shows a warning and disables legal move analysis until the setup is fixed.

## Analysis Tab

Use `Analysis` to play moves from the setup position and ask Stockfish for help.

### How to make moves

In `Analysis`:

- click a piece belonging to the side to move
- legal destination squares light up
- click a legal destination square to play the move
- click the selected square again if you want to cancel the selection

The app automatically:

- records the move in the lesson tree
- stores the new board position for that move
- highlights the last move on the board
- creates or follows variations when you branch from an earlier position

If the move already exists from the current node, the app reuses that branch instead of making a duplicate.

### Practice mode

You can also use the recorded lesson tree as a simple training drill.

- open `Analysis` or `Line`
- choose `Selected line` or `Branch drill`
- click `Start practice`
- `Selected line` uses the currently displayed lesson line from the start position
- `Branch drill` starts from the current position and accepts any recorded child move
- future moves are hidden until you solve them
- Stockfish output is hidden during practice

While practice is active:

- play a recorded move on the board
- use `Hint` if you want a lighter clue
- use `Reveal move` if you want to give up on the current move
- use `Restart` to begin the same drill again
- use `Stop practice` to return to normal analysis

Important behavior:

- wrong guesses do not create new lesson moves
- branch drills do not change the coach's saved preferred variation
- changing the setup or resetting analysis ends the practice session

### Promotions

If a pawn can promote in more than one way, the app opens a promotion dialog.

Choose the piece you want:

- queen
- rook
- bishop
- knight

### Engine analysis

The app has one main engine button beside the three-dot menu:

- `Analyze`: start live Stockfish analysis
- `Stop`: stop the current search

The `Analysis` tab also includes:

- the same `Analyze` / `Stop` action
- `Reset to setup`: clear the move tree and return to the original setup position
- `Annotate`: turn on annotation-focused mode
- `Flip board`

The engine area shows:

- evaluation
- search depth
- searched nodes
- engine status text
- the top 3 principal variation lines, which are the engine's candidate best lines

The board can also show:

- an evaluation badge
- an evaluation bar

These only appear outside `Setup` and only after the engine has produced a score.

### PV lines under the move list

When analysis is running, the app can show 3 engine lines below the move list.

Each line shows:

- `PV 1`, `PV 2`, or `PV 3`
- that line's evaluation
- the sequence of moves for that candidate line

This is useful because you can see more than one engine idea, not just the single best move.

If you do not want to see these lines, open the three-dot menu and choose `Hide PV lines`.

## Line Tab

Use `Line` when you want to review your lesson tree without focusing on Stockfish controls.

The `Line` tab shows:

- how many half-moves are recorded
- how many branch points exist
- a current board message
- shortcuts to jump to the start or reset to setup
- the same `Annotate` and `Flip board` controls

The notation tree above the tabs still works, so you can click moves and variations directly.

## The Move List and Navigation

The move list on the right is the notation tree.

It shows:

- the main line
- side lines and variations
- inline PGN comment previews when a move has a comment
- the currently selected move
- the optional engine lines below it when PV lines are visible

You can click any move in the notation tree to jump straight to that position.

The navigation buttons let you:

- go to the start
- go back one move
- go forward one move in the current branch
- go to the end of the current branch

Keyboard shortcuts:

- `Left Arrow`: previous move
- `Right Arrow`: next move
- `Escape`: close the lesson actions menu

Arrow-key navigation works only when:

- there is already at least one move in the lesson
- you are not typing in an input field
- the promotion dialog is not open

## Annotations

Annotations let you draw on the board to explain ideas.

You can use annotations in:

- `Analysis`
- `Line`

You cannot use annotations in:

- `Setup`

Supported annotation types:

- circles on squares
- painted highlighted squares
- arrows between squares

Mouse actions:

- right-click a square: add or remove a circle
- right-drag across squares: paint highlighted squares
- `Alt` + right-drag from one square to another: draw an arrow
- left-click the board while annotations exist: clear all annotations

The `Annotate` button is useful when you want to mark up the board without accidentally making moves.

Annotations are saved in:

- the browser draft
- lesson files

## Lesson Note

The lesson note is one text note for the current lesson.

Use the three-dot menu to:

- `Show note`
- `Hide note`

When the note is visible, you can type any text you want below the move list.

The note text and its visibility are saved with the lesson.

## PGN Comments

PGN comments are different from the lesson note.

- the lesson note is one free-form note for the whole lesson
- the PGN comment box is tied to the currently selected position in the move tree
- when you click a move, the PGN comment editor switches to that position
- PGN comments are included in `Export PGN`
- imported PGN comments appear inline in the move list and in the PGN comment box

If the selected position is the start position, the PGN comment is saved before the first move in the exported PGN.

## Saving, Opening, and Sharing Lessons

### Lesson JSON files

`Save lesson` downloads a JSON file.

The app usually names it like this:

- `lucena-position.lesson.json`
- `untitled-position.lesson.json`

This file can be kept, copied, moved, emailed, or shared like a normal file.

### What gets saved in a lesson JSON file

A saved lesson file includes:

- lesson title
- setup FEN
- board orientation
- active tab
- whether advanced setup details were open
- whether the tools panel was open
- whether PV lines were shown
- the full lesson tree and current node
- annotations
- the lesson note
- PGN comments attached to positions in the move tree

### How to save a lesson

1. Open the three-dot menu.
2. Click `Save lesson`.
3. Your browser downloads the file.
4. Keep that file somewhere safe if the lesson matters to you.

### How to open a saved lesson

1. Open the three-dot menu.
2. Click `Open lesson`.
3. Pick a `.json` or `.lesson.json` file from your device.
4. The lesson loads into the app.

The app checks the file before loading it. If the JSON is broken, the version is unsupported, or the lesson tree is invalid, the app shows an error instead of loading bad data.

### PGN files

`Export PGN` downloads a `.pgn` file.

PGN export includes:

- lesson title as the PGN event name
- starting FEN when needed
- the selected main line plus all recorded variations
- PGN comments from the move tree

PGN export does not keep app-only details such as:

- board orientation
- the lesson note
- annotations
- whether tools or PV lines were visible

### How to export PGN

1. Open the three-dot menu.
2. Click `Export PGN`.
3. Your browser downloads a `.pgn` file.

### How to import PGN

1. Open the three-dot menu.
2. Click `Import PGN`.
3. Pick a `.pgn` file from your device.
4. The app rebuilds the move tree, variations, and PGN comments from that file.

### Sharing with other people

Yes, you can share lesson files and PGN files.

For example, you can send a saved file by:

- email
- chat
- cloud storage
- USB drive

Important sharing rule:

- sharing a lesson file is not live collaboration

This means:

- one person saves a file
- another person opens that file later
- changes do not automatically sync between people

## Automatic Browser Draft Save

The app also keeps one working draft in the browser's local storage.

This draft remembers:

- title
- setup position
- board orientation
- active tab
- advanced setup panel state
- tools panel state
- whether PV lines are shown
- practice mode preference
- full lesson tree
- current node
- annotations
- note text
- note visibility

This is helpful because if you close the page and reopen it later in the same browser, your work can come back automatically.

Important limits:

- the browser draft belongs to one browser profile, not to an account
- a different computer or different browser does not automatically get that draft
- multiple tabs in the same browser profile can overwrite the same draft
- if the work matters, use `Save lesson` and keep the downloaded file

## Can Multiple People Use the Website at the Same Time?

Yes.

Different people can open the GitHub Pages website at the same time on different devices or different browser profiles.

Normally, their work will not affect each other because:

- each person's browser keeps its own draft
- lesson files are only shared when someone manually sends a file

The main exception is this:

- if several people use the same browser profile on the same machine, they share the same browser draft

## Typical Workflows

### Workflow 1: Start from the normal chess opening

1. Open the website.
2. Type a lesson title.
3. Click the three-dot menu.
4. Click `Show tools`.
5. Leave the board in the normal starting position.
6. Click `Analysis`.
7. Play the moves you want.
8. Click the header `Analyze` button if you want engine help.
9. Read the 3 PV lines below the move list if they are visible.
10. Save the lesson file.

### Workflow 2: Build a custom puzzle or study position

1. Open the website.
2. Show the tools panel.
3. Go to `Setup`.
4. Use the piece palette, `Clear board`, or a FEN string to build the position.
5. Make sure the setup is legal.
6. Switch to `Analysis`.
7. Play lines, add variations, and annotate ideas.
8. Save the lesson file when you are done.

### Workflow 3: Open a lesson someone else sent you

1. Download the lesson file to your device.
2. Open the website.
3. Click the three-dot menu.
4. Click `Open lesson`.
5. Choose the file.
6. Read the note, click through the moves, and continue studying.

## Easy Troubleshooting

### I do not see the tools panel

Open the three-dot menu and click `Show tools`.

### I do not see the PV lines

Check these things:

- click `Analyze` first so the engine starts searching
- open the three-dot menu and click `Show PV lines` if they are hidden
- wait a moment for Stockfish to produce lines

### I cannot move a piece

Check these things:

- you are in `Analysis`, not `Setup`
- it is that side's turn
- the move is legal
- annotation mode is not preventing your normal click behavior

### The app says the position is invalid

Go back to `Setup` and fix the position.

Common reasons include:

- impossible king placement
- illegal side to move
- bad castling rights
- invalid en passant square

### `Analyze` is not working

Check these things:

- the setup is legal
- you are not in `Setup`
- the page finished loading

### My work is gone

Check these things:

- are you in the same browser and browser profile as before
- did another tab overwrite the draft
- did you save a lesson file that you can reopen

If the work matters, saving a lesson file is safer than relying only on the browser draft.

### A lesson file will not open

Possible reasons:

- the file is not valid JSON
- the lesson version is not supported
- the move tree inside the file is broken

Try another saved copy if you have one.

### The board looks upside down

Use `Flip board` in the current tab.

## Short Vocabulary Guide

- `Setup`: choose the starting position
- `Analysis`: play moves and use the engine
- `Line`: review the recorded move tree
- `FEN`: a text string that describes a chess position
- `variation`: a side line that branches from another move
- `annotation`: a drawing on the board, such as an arrow or circle
- `SAN`: the short chess notation used in the move list

## Important Things to Remember

- use the website at `https://coachdinosaur.github.io/chess-study/`
- click the three-dot menu if you need more controls
- the button beside the three-dot menu toggles between `Analyze` and `Stop`
- `Setup` changes the starting position
- `Analysis` is where you normally make moves
- the 3 PV lines below the move list can be shown or hidden from the three-dot menu
- `Save lesson` creates a shareable file
- the browser draft is helpful, but a saved lesson file is safer

import { Chess, DEFAULT_POSITION, validateFen } from './vendor/chess.js';
import { buildPgnFromLessonTree, parsePgnToLessonTree } from './pgn.mjs';

const STORAGE_KEY = 'setup-analysis-draft-v1';
const COLOR_THEME_STORAGE_KEY = 'color-theme-v1';
const PIECE_ORDER = ['K', 'Q', 'R', 'B', 'N', 'P'];
const FILE_LABELS = Object.freeze(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
const SQUARE_PATTERN = /^[a-h][1-8]$/;
const BOARD_VIEWBOX_SIZE = 800;
const BOARD_CELL_SIZE = BOARD_VIEWBOX_SIZE / 8;
const ANNOTATION_ARROW_HEAD_LENGTH = 30;
const ANNOTATION_ARROW_HEAD_WIDTH = 40;
const ENGINE_MULTI_PV_COUNT = 3;
const ENGINE_READY_TIMEOUT_MS = 15000;
const DEFAULT_ANALYSIS_TARGET_DEPTH = 30;
const ANALYSIS_TARGET_DEPTH_MIN = 1;
const ANALYSIS_TARGET_DEPTH_MAX = 99;
const LESSON_ACTIONS_MENU_GAP_REM = 0.4;
const LESSON_ACTIONS_MENU_VIEWPORT_PADDING_REM = 0.5;
const ENGINE_SEARCH_MODE_CHECKPOINT = 'checkpoint';
const ENGINE_SEARCH_MODE_CONTINUE = 'continue';
const ENGINE_BUNDLE_CANDIDATES = Object.freeze([
  Object.freeze({
    id: 'full-multi',
    label: 'full multi-threaded',
    workerPath: './vendor/stockfish/stockfish-18.js',
    wasmPath: './vendor/stockfish/stockfish-18.wasm',
    requiresCrossOriginIsolation: true,
  }),
  Object.freeze({
    id: 'full-single',
    label: 'full single-threaded',
    workerPath: './vendor/stockfish/stockfish-18-single.js',
    wasmPath: './vendor/stockfish/stockfish-18-single.wasm',
    requiresCrossOriginIsolation: false,
  }),
  Object.freeze({
    id: 'lite-multi',
    label: 'lite multi-threaded',
    workerPath: './vendor/stockfish/stockfish-18-lite.js',
    wasmPath: './vendor/stockfish/stockfish-18-lite.wasm',
    requiresCrossOriginIsolation: true,
  }),
  Object.freeze({
    id: 'lite-single',
    label: 'lite single-threaded',
    workerPath: './vendor/stockfish/stockfish-18-lite-single.js',
    wasmPath: './vendor/stockfish/stockfish-18-lite-single.wasm',
    requiresCrossOriginIsolation: false,
  }),
]);
const TAB_SETUP = 'setup';
const TAB_ANALYSIS = 'analysis';
const TAB_PGN = 'pgn';
const PRACTICE_KIND_LINE = 'line';
const PRACTICE_KIND_BRANCH = 'branch';
const DEFAULT_TITLE = '';
const LESSON_FILE_VERSION = 1;
const ROOT_NODE_ID = 'root';
const STANDARD_INITIAL_PLACEMENT = DEFAULT_POSITION.split(/\s+/)[0];
const DEFAULT_META = Object.freeze({
  activeColor: 'w',
  castling: 'KQkq',
  enPassant: '-',
  halfmove: 0,
  fullmove: 1,
});
const PIECE_LABELS = Object.freeze({
  K: 'King',
  Q: 'Queen',
  R: 'Rook',
  B: 'Bishop',
  N: 'Knight',
  P: 'Pawn',
});
const PIECE_ASSETS = Object.freeze({
  K: './assets/pieces/mpchess/wK.svg',
  Q: './assets/pieces/mpchess/wQ.svg',
  R: './assets/pieces/mpchess/wR.svg',
  B: './assets/pieces/mpchess/wB.svg',
  N: './assets/pieces/mpchess/wN.svg',
  P: './assets/pieces/mpchess/wP.svg',
  k: './assets/pieces/mpchess/bK.svg',
  q: './assets/pieces/mpchess/bQ.svg',
  r: './assets/pieces/mpchess/bR.svg',
  b: './assets/pieces/mpchess/bB.svg',
  n: './assets/pieces/mpchess/bN.svg',
  p: './assets/pieces/mpchess/bP.svg',
});

const dom = {
  rootElement: document.documentElement,
  boardGrid: document.getElementById('boardGrid'),
  boardAnnotationOverlay: document.getElementById('boardAnnotationOverlay'),
  boardFrame: document.querySelector('.board-frame'),
  boardColumn: document.querySelector('.board-column'),
  boardTitleDisplay: document.getElementById('boardTitleDisplay'),
  boardStageSubtitle: document.getElementById('boardStageSubtitle'),
  modePill: document.getElementById('modePill'),
  validityPill: document.getElementById('validityPill'),
  evalBadgeWrap: document.getElementById('evalBadgeWrap'),
  evalBadge: document.getElementById('evalBadge'),
  evalBarWrap: document.getElementById('evalBarWrap'),
  evalBarWhite: document.getElementById('evalBarWhite'),
  boardContextLabel: document.getElementById('boardContextLabel'),
  turnToken: document.getElementById('turnToken'),
  castlingToken: document.getElementById('castlingToken'),
  enPassantToken: document.getElementById('enPassantToken'),
  currentFenCode: document.getElementById('currentFenCode'),
  setupFenCode: document.getElementById('setupFenCode'),
  engineReadyLabel: document.getElementById('engineReadyLabel'),
  titleInput: document.getElementById('titleInput'),
  headerAnalyzeButton: document.getElementById('headerAnalyzeButton'),
  lessonActionsButton: document.getElementById('lessonActionsButton'),
  lessonActionsMenu: document.getElementById('lessonActionsMenu'),
  openLessonButton: document.getElementById('openLessonButton'),
  saveLessonButton: document.getElementById('saveLessonButton'),
  importPgnButton: document.getElementById('importPgnButton'),
  exportPgnButton: document.getElementById('exportPgnButton'),
  togglePgnCommentsMenuButton: document.getElementById('togglePgnCommentsMenuButton'),
  toggleNoteMenuButton: document.getElementById('toggleNoteMenuButton'),
  toggleToolsMenuButton: document.getElementById('toggleToolsMenuButton'),
  togglePvLinesMenuButton: document.getElementById('togglePvLinesMenuButton'),
  colorThemeItems: Array.from(document.querySelectorAll('[data-action="set-color-theme"]')),
  lessonFileInput: document.getElementById('lessonFileInput'),
  pgnFileInput: document.getElementById('pgnFileInput'),
  lessonFileStatus: document.getElementById('lessonFileStatus'),
  heroBanner: document.getElementById('heroBanner'),
  controlPaneScroll: document.querySelector('.control-pane-scroll'),
  notationSummary: document.getElementById('notationSummary'),
  notationPanel: document.getElementById('notationPanel'),
  notationStartButton: document.getElementById('notationStartButton'),
  notationPrevButton: document.getElementById('notationPrevButton'),
  notationNextButton: document.getElementById('notationNextButton'),
  notationEndButton: document.getElementById('notationEndButton'),
  workspaceTools: document.getElementById('workspaceTools'),
  setupPanel: document.getElementById('setupPanel'),
  analysisPanel: document.getElementById('analysisPanel'),
  pgnPanel: document.getElementById('pgnPanel'),
  promotionModal: document.getElementById('promotionModal'),
  promotionSubtitle: document.getElementById('promotionSubtitle'),
  promotionChoices: document.getElementById('promotionChoices'),
};

const state = {
  title: DEFAULT_TITLE,
  colorTheme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  boardOrientation: 'white',
  activeTab: TAB_PGN,
  setup: {
    pieces: {},
    meta: { ...DEFAULT_META },
    fenInput: DEFAULT_POSITION,
    fenError: '',
    paletteColor: 'w',
    armedPiece: null,
    advancedOpen: false,
  },
  setupFen: DEFAULT_POSITION,
  analysis: {
    game: null,
    currentFen: DEFAULT_POSITION,
    rootId: ROOT_NODE_ID,
    currentNodeId: ROOT_NODE_ID,
    nodeCounter: 1,
    nodes: {},
    selectedSquare: null,
    legalMoves: [],
    lastMoveSquares: [],
    boardMessage: 'Open Analysis to play legal moves from this setup.',
    pendingPromotion: null,
  },
  note: {
    text: '',
    expanded: false,
  },
  practicePreferenceKind: PRACTICE_KIND_LINE,
  analysisTargetDepth: DEFAULT_ANALYSIS_TARGET_DEPTH,
  practice: createEmptyPracticeState(),
  pgnCommentsVisible: true,
  toolsExpanded: false,
  pvLinesVisible: true,
  lessonFileStatus: '',
  engine: {
    worker: null,
    ready: false,
    loading: false,
    analyzing: false,
    stopping: false,
    bundleId: '',
    bundleLabel: '',
    bundlePath: '',
    loadingPromise: null,
    readyTimer: null,
    resolveReady: null,
    rejectReady: null,
    searchFen: '',
    pendingFen: '',
    resumeFen: '',
    resumeEligible: false,
    resumeDepth: null,
    summary: 'Select Analyze to load Stockfish for this board.',
    pvLines: createEmptyEnginePvLines(),
    depth: null,
    nodes: 0,
    nps: 0,
    scoreType: '',
    scoreValue: null,
    evalLabel: '0.00',
    bestMove: '',
    searchMode: '',
    pendingSearchMode: '',
    searchTargetDepth: null,
    evalRailVisible: true,
  },
  annotations: {
    enabled: false,
    paintedSquares: new Set(),
    circledSquares: new Set(),
    arrows: [],
    gesture: createEmptyAnnotationGestureState(),
    suppressBoardClickUntil: 0,
    suppressContextMenu: false,
  },
  persistTimer: null,
  boardDragHoverSquare: null,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function remToPx(rem) {
  return rem * Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize || '16');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cloneMeta(meta) {
  return {
    activeColor: meta.activeColor,
    castling: meta.castling,
    enPassant: meta.enPassant,
    halfmove: meta.halfmove,
    fullmove: meta.fullmove,
  };
}

function createEmptyAnnotationGestureState() {
  return {
    active: false,
    button: null,
    mode: '',
    startSquare: '',
    lastSquare: '',
    dragged: false,
  };
}

function createEmptyEnginePvLine(index) {
  return {
    index,
    line: '',
    depth: null,
    scoreType: '',
    scoreValue: null,
    evalLabel: '',
  };
}

function createEmptyEnginePvLines() {
  return Array.from({ length: ENGINE_MULTI_PV_COUNT }, (_, index) => createEmptyEnginePvLine(index + 1));
}

function createEmptyPracticeState() {
  return {
    active: false,
    kind: PRACTICE_KIND_LINE,
    branchRootNodeId: ROOT_NODE_ID,
    lineNodeIds: [],
    positionIndex: 0,
    correctCount: 0,
    incorrectCount: 0,
    revealedCount: 0,
    feedback: '',
    feedbackKind: 'warning',
  };
}

function normalizePracticeKind(value) {
  return value === PRACTICE_KIND_BRANCH ? PRACTICE_KIND_BRANCH : PRACTICE_KIND_LINE;
}

function normalizeAnalysisTargetDepth(value) {
  const numeric = Number.parseInt(String(value ?? '').trim(), 10);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_ANALYSIS_TARGET_DEPTH;
  }
  return clamp(Math.trunc(numeric), ANALYSIS_TARGET_DEPTH_MIN, ANALYSIS_TARGET_DEPTH_MAX);
}

function currentAnalysisTargetDepth() {
  return normalizeAnalysisTargetDepth(state.analysisTargetDepth);
}

function clearEngineContinuationState() {
  state.engine.resumeFen = '';
  state.engine.resumeEligible = false;
  state.engine.resumeDepth = null;
}

function hasAnalysisContinuationAvailable() {
  return Boolean(
    state.engine.resumeEligible
    && state.engine.resumeFen
    && state.engine.resumeFen === state.analysis.currentFen,
  );
}

function clearEngineSearchData(options = {}) {
  const { preserveEval = false } = options;
  state.engine.pvLines = createEmptyEnginePvLines();
  state.engine.depth = null;
  state.engine.nodes = 0;
  state.engine.nps = 0;
  state.engine.searchTargetDepth = null;
  if (!preserveEval) {
    state.engine.scoreType = '';
    state.engine.scoreValue = null;
    state.engine.evalLabel = '0.00';
  }
  state.engine.bestMove = '';
}

function postEngineSearchCommands(worker, fen, options = {}) {
  const {
    freshGame = true,
    searchMode = ENGINE_SEARCH_MODE_CHECKPOINT,
    targetDepth = currentAnalysisTargetDepth(),
  } = options;
  worker.postMessage(`setoption name MultiPV value ${ENGINE_MULTI_PV_COUNT}`);
  if (freshGame) {
    worker.postMessage('ucinewgame');
  }
  worker.postMessage(`position fen ${fen}`);
  if (searchMode === ENGINE_SEARCH_MODE_CONTINUE) {
    worker.postMessage('go infinite');
    return;
  }
  worker.postMessage(`go depth ${normalizeAnalysisTargetDepth(targetDepth)}`);
}

function startEngineSearch(worker, fen, options = {}) {
  const {
    preserveDisplay = false,
    freshGame = true,
    summary = 'Analyzing current board position...',
    searchMode = ENGINE_SEARCH_MODE_CHECKPOINT,
    targetDepth = null,
  } = options;
  if (!preserveDisplay) {
    clearEngineSearchData();
  }
  state.engine.pendingFen = '';
  state.engine.pendingSearchMode = '';
  clearEngineContinuationState();
  state.engine.searchFen = fen;
  state.engine.analyzing = true;
  state.engine.stopping = false;
  state.engine.searchMode = searchMode;
  state.engine.searchTargetDepth = searchMode === ENGINE_SEARCH_MODE_CHECKPOINT
    ? normalizeAnalysisTargetDepth(targetDepth)
    : (Number.isFinite(targetDepth) ? Math.trunc(targetDepth) : null);
  state.engine.summary = summary;
  renderNotationPanel();
  renderAnalysisPanel();
  renderBoard();
  renderHeaderMeta();
  postEngineSearchCommands(worker, fen, {
    freshGame,
    searchMode,
    targetDepth: state.engine.searchTargetDepth,
  });
}

function queueEngineSearchForFen(fen) {
  if (!fen || !state.engine.worker || !state.engine.ready || !state.engine.analyzing || state.engine.stopping) {
    return;
  }
  state.engine.pendingFen = fen;
  state.engine.pendingSearchMode = state.engine.searchMode || ENGINE_SEARCH_MODE_CHECKPOINT;
  state.engine.searchFen = '';
  clearEngineContinuationState();
  clearEngineSearchData({ preserveEval: true });
  state.engine.summary = state.engine.pendingSearchMode === ENGINE_SEARCH_MODE_CONTINUE
    ? 'Continuing analysis from the current board position...'
    : `Analyzing current board position toward depth ${currentAnalysisTargetDepth()}...`;
  renderNotationPanel();
  renderAnalysisPanel();
  renderBoard();
  renderHeaderMeta();
  state.engine.worker.postMessage('stop');
}

function normalizeAnnotationSquares(value) {
  if (!Array.isArray(value)) {
    return new Set();
  }
  return new Set(
    value
      .map((square) => String(square || '').trim().toLowerCase())
      .filter((square) => SQUARE_PATTERN.test(square)),
  );
}

function normalizeAnnotationState(value) {
  return {
    paintedSquares: normalizeAnnotationSquares(value?.paintedSquares),
    circledSquares: normalizeAnnotationSquares(value?.circledSquares),
    arrows: normalizeAnnotationArrows(value?.arrows),
  };
}

function buildAnnotationPayload() {
  return {
    paintedSquares: Array.from(state.annotations.paintedSquares).sort(),
    circledSquares: Array.from(state.annotations.circledSquares).sort(),
    arrows: state.annotations.arrows.map((arrow) => ({ from: arrow.from, to: arrow.to })),
  };
}

function normalizeAnnotationArrows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const arrows = [];
  value.forEach((entry) => {
    const from = String(entry?.from || '').trim().toLowerCase();
    const to = String(entry?.to || '').trim().toLowerCase();
    if (!SQUARE_PATTERN.test(from) || !SQUARE_PATTERN.test(to) || from === to) {
      return;
    }
    const key = `${from}:${to}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    arrows.push({ from, to });
  });
  return arrows;
}

function normalizeNoteState(value) {
  return {
    text: typeof value?.text === 'string' ? value.text : '',
    expanded: Boolean(value?.expanded),
  };
}

function normalizeAnalysisComment(value) {
  return typeof value === 'string'
    ? value.replace(/\r\n?/g, '\n')
    : '';
}

function createAnalysisRootNode(fen) {
  return {
    id: ROOT_NODE_ID,
    parentId: null,
    fen,
    children: [],
    selectedChildId: null,
    comment: '',
  };
}

function createEmptyAnalysisTree(fen) {
  return {
    rootId: ROOT_NODE_ID,
    currentNodeId: ROOT_NODE_ID,
    nodeCounter: 1,
    nodes: {
      [ROOT_NODE_ID]: createAnalysisRootNode(fen),
    },
  };
}

function cloneAnalysisNodes(nodes) {
  return Object.fromEntries(
    Object.entries(nodes || {}).map(([id, node]) => [
      id,
      {
        ...node,
        children: Array.isArray(node?.children) ? [...node.children] : [],
      },
    ]),
  );
}

function slugifyLessonTitle(title) {
  const slug = String(title ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled-position';
}

function normalizePromotionValue(value) {
  const promotion = String(value || '').trim().toLowerCase();
  return promotion || undefined;
}

function getAnalysisNode(nodeId) {
  return state.analysis.nodes[nodeId] || null;
}

function getCurrentAnalysisNode() {
  return getAnalysisNode(state.analysis.currentNodeId);
}

function getAnalysisDisplayedChildId(node) {
  if (!node || !Array.isArray(node.children) || !node.children.length) {
    return '';
  }
  if (node.selectedChildId && node.children.includes(node.selectedChildId)) {
    return node.selectedChildId;
  }
  return node.children[0];
}

function getAnalysisNextNodeId(nodeId = state.analysis.currentNodeId) {
  const node = getAnalysisNode(nodeId);
  return getAnalysisDisplayedChildId(node);
}

function getAnalysisPathIds(nodeId = state.analysis.currentNodeId) {
  const path = [];
  let cursor = nodeId;
  const seen = new Set();
  while (cursor) {
    if (seen.has(cursor)) {
      break;
    }
    seen.add(cursor);
    const node = getAnalysisNode(cursor);
    if (!node) {
      break;
    }
    path.push(cursor);
    cursor = node.parentId || '';
  }
  return path.reverse();
}

function getAnalysisPathNodes(nodeId = state.analysis.currentNodeId) {
  return getAnalysisPathIds(nodeId)
    .map((id) => getAnalysisNode(id))
    .filter(Boolean);
}

function getAnalysisPly(nodeId) {
  return Math.max(0, getAnalysisPathIds(nodeId).length - 1);
}

function getCurrentAnalysisPly() {
  return getAnalysisPly(state.analysis.currentNodeId);
}

function countAnalysisMoveNodes() {
  return Math.max(0, Object.keys(state.analysis.nodes).length - 1);
}

function countAnalysisBranchPoints() {
  return Object.values(state.analysis.nodes).filter((node) => Array.isArray(node.children) && node.children.length > 1).length;
}

function getAnalysisChildNodes(nodeOrId) {
  const node = typeof nodeOrId === 'string' ? getAnalysisNode(nodeOrId) : nodeOrId;
  if (!node || !Array.isArray(node.children) || !node.children.length) {
    return [];
  }
  return node.children
    .map((childId) => getAnalysisNode(childId))
    .filter(Boolean);
}

function buildDisplayedLineNodeIds(startNodeId = state.analysis.rootId) {
  const lineNodeIds = [];
  let cursorId = startNodeId;
  const seen = new Set();
  while (cursorId && !seen.has(cursorId)) {
    const node = getAnalysisNode(cursorId);
    if (!node) {
      break;
    }
    lineNodeIds.push(cursorId);
    seen.add(cursorId);
    cursorId = getAnalysisNextNodeId(cursorId);
  }
  return lineNodeIds;
}

function practiceMoveTotal() {
  return Math.max(0, state.practice.lineNodeIds.length - 1);
}

function practiceProgressCount() {
  return state.practice.kind === PRACTICE_KIND_BRANCH
    ? Math.max(0, state.practice.positionIndex)
    : clamp(state.practice.positionIndex, 0, practiceMoveTotal());
}

function getPracticeExpectedNodeId() {
  if (state.practice.kind !== PRACTICE_KIND_LINE) {
    return '';
  }
  return state.practice.lineNodeIds[state.practice.positionIndex + 1] || '';
}

function getPracticeExpectedNode() {
  return getAnalysisNode(getPracticeExpectedNodeId());
}

function getPracticePreferredChildNode(node = getCurrentAnalysisNode()) {
  if (!node) {
    return null;
  }
  if (node.selectedChildId) {
    const selectedChild = getAnalysisNode(node.selectedChildId);
    if (selectedChild && node.children.includes(selectedChild.id)) {
      return selectedChild;
    }
  }
  return getAnalysisChildNodes(node)[0] || null;
}

function getPracticeCandidateNodes() {
  if (!state.practice.active) {
    return [];
  }
  if (state.practice.kind === PRACTICE_KIND_BRANCH) {
    return getAnalysisChildNodes(getCurrentAnalysisNode());
  }
  const expectedNode = getPracticeExpectedNode();
  return expectedNode ? [expectedNode] : [];
}

function selectedLinePracticeReady() {
  return buildDisplayedLineNodeIds(state.analysis.rootId).length > 1;
}

function branchPracticeReady(startNodeId = state.analysis.currentNodeId) {
  return getAnalysisChildNodes(startNodeId).length > 0;
}

function practiceComplete() {
  if (!state.practice.active) {
    return false;
  }
  if (state.practice.kind === PRACTICE_KIND_BRANCH) {
    return getPracticeCandidateNodes().length === 0;
  }
  return !getPracticeExpectedNodeId();
}

function practiceWillCompleteAfterAdvance(nextNode) {
  if (!nextNode) {
    return true;
  }
  if (state.practice.kind === PRACTICE_KIND_BRANCH) {
    return getAnalysisChildNodes(nextNode).length === 0;
  }
  return !state.practice.lineNodeIds[state.practice.positionIndex + 1];
}

function getPracticeSolvedNodes() {
  if (!state.practice.active) {
    return [];
  }
  const pathIds = getAnalysisPathIds(state.analysis.currentNodeId);
  const startIndex = pathIds.indexOf(state.practice.branchRootNodeId);
  if (startIndex === -1) {
    return [];
  }
  return pathIds
    .slice(startIndex + 1)
    .map((nodeId) => getAnalysisNode(nodeId))
    .filter(Boolean);
}

function practicePrimaryStatusLabel() {
  return state.practice.kind === PRACTICE_KIND_BRANCH ? 'Solved' : 'Progress';
}

function practicePrimaryStatusValue() {
  return state.practice.kind === PRACTICE_KIND_BRANCH
    ? String(practiceProgressCount())
    : `${practiceProgressCount()} / ${practiceMoveTotal()}`;
}

function currentPracticePrompt() {
  if (!state.practice.active) {
    return '';
  }
  if (practiceComplete()) {
    return `Practice complete. ${pluralize(state.practice.correctCount, 'correct move')}, ${pluralize(state.practice.incorrectCount, 'mistake')}, ${pluralize(state.practice.revealedCount, 'reveal')}.`;
  }
  const sideToMove = state.analysis.game?.turn() === 'b' ? 'Black' : 'White';
  if (state.practice.kind === PRACTICE_KIND_BRANCH) {
    return `Branch drill from the selected position. ${sideToMove} to play.`;
  }
  return `Practice move ${practiceProgressCount() + 1} of ${practiceMoveTotal()}. ${sideToMove} to play.`;
}

function currentPracticeFeedback() {
  if (!state.practice.active) {
    return '';
  }
  return state.practice.feedback || (
    state.practice.kind === PRACTICE_KIND_BRANCH
      ? 'Play any recorded continuation from this position.'
      : 'Play the next recorded move from the selected lesson line.'
  );
}

function syncPracticeBoardMessage() {
  if (!state.practice.active) {
    return;
  }
  state.analysis.boardMessage = currentPracticePrompt();
}

function isBlackMoveForPly(ply) {
  const startsBlack = state.setup.meta.activeColor === 'b';
  return startsBlack ? ply % 2 === 1 : ply % 2 === 0;
}

function moveNumberForPly(ply) {
  const startsBlack = state.setup.meta.activeColor === 'b';
  return state.setup.meta.fullmove + Math.floor((ply - (startsBlack ? 0 : 1)) / 2);
}

function applyAnalysisPathSelection(nodeId) {
  const pathIds = getAnalysisPathIds(nodeId);
  for (let index = 0; index < pathIds.length - 1; index += 1) {
    const parent = getAnalysisNode(pathIds[index]);
    const childId = pathIds[index + 1];
    if (parent && parent.children.includes(childId)) {
      parent.selectedChildId = childId;
    }
  }
}

function syncLessonFileStatus(message) {
  state.lessonFileStatus = String(message || '');
  if (dom.lessonFileStatus) {
    dom.lessonFileStatus.textContent = state.lessonFileStatus;
  }
}

async function copyCurrentFenToClipboard() {
  const fen = currentBoardFenLabel();
  closeLessonActionsMenu({ restoreFocus: true });
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(fen);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = fen;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!copied) {
        throw new Error('Clipboard copy command was rejected.');
      }
    }
    syncLessonFileStatus('Current board FEN copied.');
  } catch (error) {
    console.warn('Unable to copy current FEN.', error);
    syncLessonFileStatus('Unable to copy FEN in this browser.');
  }
}

function normalizeColorTheme(value) {
  return value === 'dark' ? 'dark' : 'light';
}

function readStoredColorTheme() {
  try {
    return normalizeColorTheme(window.localStorage.getItem(COLOR_THEME_STORAGE_KEY));
  } catch (error) {
    console.warn('Unable to read color theme preference.', error);
    return 'light';
  }
}

function persistColorTheme(theme) {
  try {
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Unable to persist color theme preference.', error);
  }
}

function syncColorThemeMenuState() {
  for (const item of dom.colorThemeItems) {
    const isSelected = item.dataset.value === state.colorTheme;
    item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
    item.classList.toggle('is-selected', isSelected);
  }
}

function syncLessonVisibilityMenuState() {
  if (dom.togglePgnCommentsMenuButton) {
    dom.togglePgnCommentsMenuButton.textContent = state.pgnCommentsVisible ? 'Hide PGN comments' : 'Show PGN comments';
  }
  if (dom.toggleNoteMenuButton) {
    dom.toggleNoteMenuButton.textContent = state.note.expanded ? 'Hide note' : 'Show note';
  }
  if (dom.toggleToolsMenuButton) {
    dom.toggleToolsMenuButton.textContent = state.toolsExpanded ? 'Hide tools' : 'Show tools';
  }
  if (dom.togglePvLinesMenuButton) {
    dom.togglePvLinesMenuButton.textContent = state.pvLinesVisible ? 'Hide PV lines' : 'Show PV lines';
  }
}

function applyColorTheme(theme, options = {}) {
  const { persist = false } = options;
  const nextTheme = normalizeColorTheme(theme);
  state.colorTheme = nextTheme;
  if (dom.rootElement) {
    dom.rootElement.dataset.theme = nextTheme;
  }
  syncColorThemeMenuState();
  if (persist) {
    persistColorTheme(nextTheme);
  }
}

function initializeColorTheme() {
  const bootTheme = dom.rootElement?.dataset.theme;
  const initialTheme = bootTheme ? normalizeColorTheme(bootTheme) : readStoredColorTheme();
  applyColorTheme(initialTheme);
}

function isLessonActionsMenuOpen() {
  return Boolean(dom.lessonActionsMenu && !dom.lessonActionsMenu.hidden);
}

function clearLessonActionsMenuLayout() {
  if (!dom.lessonActionsMenu) {
    return;
  }
  dom.lessonActionsMenu.removeAttribute('data-placement');
  dom.lessonActionsMenu.style.removeProperty('max-height');
}

function syncLessonActionsMenuLayout() {
  if (!dom.lessonActionsButton || !dom.lessonActionsMenu || dom.lessonActionsMenu.hidden) {
    return;
  }

  const menuGap = remToPx(LESSON_ACTIONS_MENU_GAP_REM);
  const viewportPadding = remToPx(LESSON_ACTIONS_MENU_VIEWPORT_PADDING_REM);
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const buttonRect = dom.lessonActionsButton.getBoundingClientRect();

  clearLessonActionsMenuLayout();
  dom.lessonActionsMenu.dataset.placement = 'down';

  const naturalHeight = Math.ceil(dom.lessonActionsMenu.getBoundingClientRect().height);
  const availableBelow = Math.max(0, viewportHeight - buttonRect.bottom - menuGap - viewportPadding);
  const availableAbove = Math.max(0, buttonRect.top - menuGap - viewportPadding);

  let placement = 'down';
  let availableSpace = availableBelow;

  if (naturalHeight <= availableBelow) {
    placement = 'down';
    availableSpace = availableBelow;
  } else if (naturalHeight <= availableAbove) {
    placement = 'up';
    availableSpace = availableAbove;
  } else if (availableAbove > availableBelow) {
    placement = 'up';
    availableSpace = availableAbove;
  }

  dom.lessonActionsMenu.dataset.placement = placement;
  if (availableSpace > 0) {
    dom.lessonActionsMenu.style.maxHeight = `${Math.floor(availableSpace)}px`;
  }
}

function syncOpenLessonActionsMenuLayout() {
  if (!isLessonActionsMenuOpen()) {
    return;
  }
  syncLessonActionsMenuLayout();
}

function setLessonActionsMenuOpen(isOpen) {
  if (!dom.lessonActionsButton || !dom.lessonActionsMenu) {
    return;
  }
  const nextOpen = Boolean(isOpen);
  dom.lessonActionsButton.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  dom.lessonActionsButton.closest('.lesson-overflow')?.classList.toggle('is-open', nextOpen);
  if (nextOpen) {
    dom.lessonActionsMenu.hidden = false;
    dom.lessonActionsMenu.scrollTop = 0;
    syncLessonActionsMenuLayout();
    return;
  }
  clearLessonActionsMenuLayout();
  dom.lessonActionsMenu.hidden = true;
}

function closeLessonActionsMenu(options = {}) {
  const { restoreFocus = false } = options;
  if (!isLessonActionsMenuOpen()) {
    return;
  }
  setLessonActionsMenuOpen(false);
  if (restoreFocus) {
    dom.lessonActionsButton?.focus();
  }
}

function toggleLessonActionsMenu() {
  setLessonActionsMenuOpen(!isLessonActionsMenuOpen());
}

function handleViewportResize() {
  renderBoard();
  syncOpenLessonActionsMenuLayout();
}

function buildLessonPayload() {
  return {
    version: LESSON_FILE_VERSION,
    title: state.title,
    setupFen: state.setupFen,
    analysisTargetDepth: currentAnalysisTargetDepth(),
    boardOrientation: state.boardOrientation,
    activeTab: state.activeTab,
    advancedOpen: state.setup.advancedOpen,
    toolsExpanded: state.toolsExpanded,
    pgnCommentsVisible: state.pgnCommentsVisible,
    pvLinesVisible: state.pvLinesVisible,
    currentNodeId: state.analysis.currentNodeId,
    rootId: state.analysis.rootId,
    nodes: cloneAnalysisNodes(state.analysis.nodes),
    annotations: buildAnnotationPayload(),
    note: normalizeNoteState(state.note),
  };
}

function buildDraftPayload() {
  return {
    ...buildLessonPayload(),
    practiceKindPreference: state.practicePreferenceKind,
  };
}

function parseFenLike(fen) {
  const normalized = String(fen ?? '').trim();
  const tokens = normalized.split(/\s+/);
  if (tokens.length !== 6) {
    return { ok: false, error: 'FEN must contain 6 space-separated fields.' };
  }
  const placement = tokens[0];
  const pieces = parsePlacement(placement);
  if (!pieces.ok) {
    return pieces;
  }
  const activeColor = tokens[1];
  if (!/^(w|b)$/.test(activeColor)) {
    return { ok: false, error: 'Side to move must be w or b.' };
  }
  const castling = tokens[2];
  if (!/^(-|[KQkq]+)$/.test(castling)) {
    return { ok: false, error: 'Castling rights are invalid.' };
  }
  const enPassant = tokens[3];
  if (!/^(-|[a-h][36])$/.test(enPassant)) {
    return { ok: false, error: 'En passant square is invalid.' };
  }
  const halfmove = Number.parseInt(tokens[4], 10);
  if (!Number.isFinite(halfmove) || halfmove < 0) {
    return { ok: false, error: 'Halfmove clock must be 0 or greater.' };
  }
  const fullmove = Number.parseInt(tokens[5], 10);
  if (!Number.isFinite(fullmove) || fullmove <= 0) {
    return { ok: false, error: 'Fullmove number must be 1 or greater.' };
  }
  return {
    ok: true,
    pieces: pieces.pieces,
    meta: {
      activeColor,
      castling,
      enPassant,
      halfmove,
      fullmove,
    },
  };
}

function parsePlacement(placement) {
  const ranks = String(placement ?? '').split('/');
  if (ranks.length !== 8) {
    return { ok: false, error: 'Board placement must contain 8 ranks.' };
  }
  const pieces = {};
  for (let rankIndex = 0; rankIndex < ranks.length; rankIndex += 1) {
    let fileIndex = 0;
    for (const symbol of ranks[rankIndex]) {
      if (/^\d$/.test(symbol)) {
        fileIndex += Number.parseInt(symbol, 10);
        continue;
      }
      if (!/^[prnbqkPRNBQK]$/.test(symbol)) {
        return { ok: false, error: `Invalid piece symbol: ${symbol}` };
      }
      if (fileIndex > 7) {
        return { ok: false, error: 'Too many files in one rank.' };
      }
      const square = `${String.fromCharCode(97 + fileIndex)}${8 - rankIndex}`;
      pieces[square] = symbol;
      fileIndex += 1;
    }
    if (fileIndex !== 8) {
      return { ok: false, error: 'Each rank must cover exactly 8 files.' };
    }
  }
  return { ok: true, pieces };
}

function buildPlacementFromPieces(pieces) {
  const rows = [];
  for (let rank = 8; rank >= 1; rank -= 1) {
    let empty = 0;
    let row = '';
    for (let file = 0; file < 8; file += 1) {
      const square = `${String.fromCharCode(97 + file)}${rank}`;
      const piece = pieces[square];
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty > 0) {
        row += String(empty);
        empty = 0;
      }
      row += piece;
    }
    if (empty > 0) {
      row += String(empty);
    }
    rows.push(row);
  }
  return rows.join('/');
}

function buildFenFromPiecesAndMeta(pieces, meta) {
  return `${buildPlacementFromPieces(pieces)} ${meta.activeColor} ${meta.castling} ${meta.enPassant} ${meta.halfmove} ${meta.fullmove}`;
}

function hasStandardInitialPlacement(pieces) {
  return buildPlacementFromPieces(pieces) === STANDARD_INITIAL_PLACEMENT;
}

function parseCastlingRights(castling) {
  const rights = new Set();
  const normalized = String(castling ?? '').trim();
  if (!normalized || normalized === '-') {
    return rights;
  }
  for (const symbol of normalized) {
    if ('KQkq'.includes(symbol)) {
      rights.add(symbol);
    }
  }
  return rights;
}

function castlingStringFromRights(rights) {
  const ordered = ['K', 'Q', 'k', 'q'].filter((flag) => rights.has(flag));
  return ordered.length ? ordered.join('') : '-';
}

function allowedCastlingRightsForPieces(pieces) {
  const allowed = new Set();
  if (pieces.e1 === 'K') {
    if (pieces.h1 === 'R') {
      allowed.add('K');
    }
    if (pieces.a1 === 'R') {
      allowed.add('Q');
    }
  }
  if (pieces.e8 === 'k') {
    if (pieces.h8 === 'r') {
      allowed.add('k');
    }
    if (pieces.a8 === 'r') {
      allowed.add('q');
    }
  }
  return allowed;
}

function sanitizeCastlingForPieces(castling, pieces) {
  const rights = parseCastlingRights(castling);
  const allowed = allowedCastlingRightsForPieces(pieces);
  const sanitized = new Set();
  rights.forEach((flag) => {
    if (allowed.has(flag)) {
      sanitized.add(flag);
    }
  });
  return castlingStringFromRights(sanitized);
}

function areKingsAdjacent(whiteSquare, blackSquare) {
  const whiteFile = whiteSquare.codePointAt(0) - 97;
  const whiteRank = Number.parseInt(whiteSquare[1], 10);
  const blackFile = blackSquare.codePointAt(0) - 97;
  const blackRank = Number.parseInt(blackSquare[1], 10);
  return Math.abs(whiteFile - blackFile) <= 1 && Math.abs(whiteRank - blackRank) <= 1;
}

function isBasicPositionLegal({ pieces, activeColor, castling, halfmove, fullmove }) {
  let whiteKingCount = 0;
  let blackKingCount = 0;
  let whitePawnCount = 0;
  let blackPawnCount = 0;
  let whiteKingSquare = '';
  let blackKingSquare = '';
  let pawnOnInvalidRank = false;

  Object.entries(pieces).forEach(([square, piece]) => {
    switch (piece) {
      case 'K':
        whiteKingCount += 1;
        whiteKingSquare ||= square;
        break;
      case 'k':
        blackKingCount += 1;
        blackKingSquare ||= square;
        break;
      case 'P':
        whitePawnCount += 1;
        if (square.endsWith('1') || square.endsWith('8')) {
          pawnOnInvalidRank = true;
        }
        break;
      case 'p':
        blackPawnCount += 1;
        if (square.endsWith('1') || square.endsWith('8')) {
          pawnOnInvalidRank = true;
        }
        break;
      default:
        break;
    }
  });

  if (whiteKingCount !== 1 || blackKingCount !== 1) {
    return false;
  }
  if (whitePawnCount > 8 || blackPawnCount > 8 || pawnOnInvalidRank) {
    return false;
  }
  if (whiteKingSquare && blackKingSquare && areKingsAdjacent(whiteKingSquare, blackKingSquare)) {
    return false;
  }
  const sanitizedCastling = sanitizeCastlingForPieces(castling, pieces);
  if (sanitizedCastling !== castling) {
    return false;
  }
  const safeHalfmove = Math.max(0, halfmove);
  const safeFullmove = Math.max(1, fullmove);
  const fen = `${buildPlacementFromPieces(pieces)} ${activeColor} ${castling} - ${safeHalfmove} ${safeFullmove}`;
  return validateFen(fen).ok;
}

function legalEnPassantSquaresForPieces({ pieces, activeColor, castling, halfmove, fullmove }) {
  const safeHalfmove = Math.max(0, halfmove);
  const safeFullmove = Math.max(1, fullmove);
  if (!isBasicPositionLegal({ pieces, activeColor, castling, halfmove: safeHalfmove, fullmove: safeFullmove })) {
    return [];
  }
  const isWhiteToMove = activeColor !== 'b';
  const moverPawn = isWhiteToMove ? 'p' : 'P';
  const capturerPawn = isWhiteToMove ? 'P' : 'p';
  const pawnRank = isWhiteToMove ? 5 : 4;
  const targetRank = isWhiteToMove ? 6 : 3;
  const legalSquares = [];

  for (let fileIndex = 0; fileIndex < 8; fileIndex += 1) {
    const file = String.fromCharCode(97 + fileIndex);
    const pawnSquare = `${file}${pawnRank}`;
    if (pieces[pawnSquare] !== moverPawn) {
      continue;
    }
    const targetSquare = `${file}${targetRank}`;
    if (pieces[targetSquare]) {
      continue;
    }

    let canCapture = false;
    if (fileIndex > 0) {
      const leftSquare = `${String.fromCharCode(97 + fileIndex - 1)}${pawnRank}`;
      if (pieces[leftSquare] === capturerPawn) {
        canCapture = true;
      }
    }
    if (fileIndex < 7) {
      const rightSquare = `${String.fromCharCode(97 + fileIndex + 1)}${pawnRank}`;
      if (pieces[rightSquare] === capturerPawn) {
        canCapture = true;
      }
    }
    if (!canCapture) {
      continue;
    }
    const candidateFen = `${buildPlacementFromPieces(pieces)} ${activeColor} ${castling} ${targetSquare} ${safeHalfmove} ${safeFullmove}`;
    if (validateFen(candidateFen).ok) {
      legalSquares.push(targetSquare);
    }
  }

  return legalSquares;
}

function sanitizeEnPassantForPieces(enPassant, pieces, activeColor, castling, halfmove, fullmove) {
  const normalized = String(enPassant ?? '-').trim().toLowerCase();
  if (!normalized || normalized === '-') {
    return '-';
  }
  const legalSquares = legalEnPassantSquaresForPieces({
    pieces,
    activeColor,
    castling,
    halfmove,
    fullmove,
  });
  return legalSquares.includes(normalized) ? normalized : '-';
}

function sanitizeSetupState(pieces, meta) {
  const clonedPieces = { ...pieces };
  const safeMeta = {
    activeColor: meta.activeColor === 'b' ? 'b' : 'w',
    castling: meta.castling || '-',
    enPassant: meta.enPassant || '-',
    halfmove: Math.max(0, Number.parseInt(meta.halfmove, 10) || 0),
    fullmove: Math.max(1, Number.parseInt(meta.fullmove, 10) || 1),
  };
  const activeColor = hasStandardInitialPlacement(clonedPieces) ? 'w' : safeMeta.activeColor;
  const castling = sanitizeCastlingForPieces(safeMeta.castling, clonedPieces);
  const enPassant = sanitizeEnPassantForPieces(
    safeMeta.enPassant,
    clonedPieces,
    activeColor,
    castling,
    safeMeta.halfmove,
    safeMeta.fullmove,
  );
  return {
    pieces: clonedPieces,
    meta: {
      activeColor,
      castling,
      enPassant,
      halfmove: safeMeta.halfmove,
      fullmove: safeMeta.fullmove,
    },
  };
}

function isIllegalSetupPosition() {
  const basicLegal = isBasicPositionLegal({
    pieces: state.setup.pieces,
    activeColor: state.setup.meta.activeColor,
    castling: state.setup.meta.castling,
    halfmove: state.setup.meta.halfmove,
    fullmove: state.setup.meta.fullmove,
  });
  if (!basicLegal) {
    return true;
  }
  const sanitizedEnPassant = sanitizeEnPassantForPieces(
    state.setup.meta.enPassant,
    state.setup.pieces,
    state.setup.meta.activeColor,
    state.setup.meta.castling,
    state.setup.meta.halfmove,
    state.setup.meta.fullmove,
  );
  return sanitizedEnPassant !== state.setup.meta.enPassant;
}

function currentSetupSummary() {
  if (state.setup.fenError) {
    return {
      kind: 'danger',
      title: 'FEN needs attention',
      message: state.setup.fenError,
    };
  }
  if (isIllegalSetupPosition()) {
    return {
      kind: 'danger',
      title: 'Position is invalid',
      message: 'Fix the board or advanced fields before running analysis.',
    };
  }
  return {
    kind: 'success',
    title: 'Setup ready',
    message: 'Board, castling rights, side to move, and en passant are synchronized.',
  };
}

function canAnalyzeCurrentSetup() {
  if (isIllegalSetupPosition()) {
    return false;
  }
  return validateFen(state.setupFen).ok;
}

function defaultAnalysisSummary() {
  if (!state.analysis.game) {
    return 'Fix the setup in the Setup tab to enable legal-move analysis.';
  }
  const targetDepth = currentAnalysisTargetDepth();
  if (state.engine.ready) {
    return state.engine.bundleLabel
      ? `Stockfish ready (${state.engine.bundleLabel}). Analyze to depth ${targetDepth} from the current board position.`
      : `Stockfish ready. Analyze to depth ${targetDepth} from the current board position.`;
  }
  return `Select Analyze to load Stockfish for this board and search to depth ${targetDepth}.`;
}

function schedulePersist() {
  window.clearTimeout(state.persistTimer);
  state.persistTimer = window.setTimeout(persistDraft, 120);
}

function withPreservedScroll(element, callback) {
  if (!element || typeof callback !== 'function') {
    callback?.();
    return;
  }
  const { scrollTop, scrollLeft } = element;
  callback();
  element.scrollTop = scrollTop;
  element.scrollLeft = scrollLeft;
}

function deriveAnalysisNodeCounter(nodes) {
  let maxIndex = 0;
  Object.keys(nodes || {}).forEach((id) => {
    const match = /^n(\d+)$/.exec(id);
    if (match) {
      maxIndex = Math.max(maxIndex, Number.parseInt(match[1], 10) || 0);
    }
  });
  return maxIndex + 1;
}

function assignAnalysisTree(tree) {
  state.analysis.rootId = tree.rootId;
  state.analysis.currentNodeId = tree.currentNodeId;
  state.analysis.nodes = cloneAnalysisNodes(tree.nodes);
  state.analysis.nodeCounter = Math.max(1, Number(tree.nodeCounter) || deriveAnalysisNodeCounter(tree.nodes));
}

function buildLegacyAnalysisTree(history, cursor, setupFen) {
  const tree = createEmptyAnalysisTree(setupFen);
  if (!validateFen(setupFen).ok || !Array.isArray(history)) {
    return tree;
  }

  let parentId = tree.rootId;
  let currentNodeId = tree.rootId;
  let appliedCount = 0;
  const targetCursor = clamp(Number.isFinite(cursor) ? Math.trunc(cursor) : history.length, 0, history.length);
  const game = new Chess(setupFen);

  for (const rawMove of history) {
    try {
      const applied = game.move({
        from: rawMove.from,
        to: rawMove.to,
        promotion: normalizePromotionValue(rawMove.promotion),
      });
      const nodeId = `n${tree.nodeCounter}`;
      tree.nodeCounter += 1;
      tree.nodes[nodeId] = {
        id: nodeId,
        parentId,
        from: applied.from,
        to: applied.to,
        promotion: applied.promotion || undefined,
        san: applied.san,
        fen: game.fen(),
        children: [],
        selectedChildId: null,
        comment: '',
      };
      const parent = tree.nodes[parentId];
      parent.children.push(nodeId);
      parent.selectedChildId = nodeId;
      parentId = nodeId;
      appliedCount += 1;
      if (appliedCount <= targetCursor) {
        currentNodeId = nodeId;
      }
    } catch {
      break;
    }
  }

  tree.currentNodeId = currentNodeId;
  return tree;
}

function normalizeSetupFenForLesson(fen) {
  const parsed = parseFenLike(fen);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  const sanitized = sanitizeSetupState(parsed.pieces, parsed.meta);
  const normalizedFen = buildFenFromPiecesAndMeta(sanitized.pieces, sanitized.meta);
  if (!validateFen(normalizedFen).ok) {
    throw new Error('Lesson setup FEN is invalid.');
  }
  return {
    setupFen: normalizedFen,
    setup: sanitized,
  };
}

function validateAndNormalizeLessonNodes(rawNodes, rootId, currentNodeId, setupFen) {
  if (!rawNodes || typeof rawNodes !== 'object' || Array.isArray(rawNodes)) {
    throw new Error('Lesson nodes must be an object.');
  }

  const nodes = {};
  Object.entries(rawNodes).forEach(([key, rawNode]) => {
    if (!rawNode || typeof rawNode !== 'object' || Array.isArray(rawNode)) {
      throw new Error(`Node ${key} is invalid.`);
    }
    const id = String(rawNode.id || key).trim();
    if (!id || id !== String(key)) {
      throw new Error(`Node ${key} has an invalid id.`);
    }
    const children = Array.isArray(rawNode.children)
      ? rawNode.children.map((childId) => String(childId || '').trim()).filter(Boolean)
      : [];
    const uniqueChildren = Array.from(new Set(children));
    if (uniqueChildren.length !== children.length) {
      throw new Error(`Node ${id} contains duplicate children.`);
    }
    const selectedChildId = rawNode.selectedChildId == null || rawNode.selectedChildId === ''
      ? null
      : String(rawNode.selectedChildId).trim();
    const baseNode = {
      id,
      parentId: rawNode.parentId == null || rawNode.parentId === '' ? null : String(rawNode.parentId).trim(),
      fen: String(rawNode.fen || '').trim(),
      children: uniqueChildren,
      selectedChildId,
      comment: normalizeAnalysisComment(rawNode.comment),
    };

    if (id === rootId) {
      if (baseNode.parentId !== null) {
        throw new Error('Root node must not have a parent.');
      }
      if (baseNode.fen !== setupFen) {
        throw new Error('Root node FEN must match the lesson setup FEN.');
      }
      nodes[id] = baseNode;
      return;
    }

    if (!/^[a-h][1-8]$/.test(String(rawNode.from || '').trim()) || !/^[a-h][1-8]$/.test(String(rawNode.to || '').trim())) {
      throw new Error(`Node ${id} has an invalid move.`);
    }
    if (!validateFen(baseNode.fen).ok) {
      throw new Error(`Node ${id} has an invalid FEN.`);
    }
    nodes[id] = {
      ...baseNode,
      from: String(rawNode.from).trim(),
      to: String(rawNode.to).trim(),
      promotion: normalizePromotionValue(rawNode.promotion),
      san: String(rawNode.san || '').trim(),
    };
  });

  if (!nodes[rootId]) {
    throw new Error('Lesson root node is missing.');
  }
  if (!nodes[currentNodeId]) {
    throw new Error('Current lesson node is missing.');
  }

  const reachable = new Set();
  const stack = [rootId];
  while (stack.length) {
    const nodeId = stack.pop();
    if (!nodeId || reachable.has(nodeId)) {
      continue;
    }
    reachable.add(nodeId);
    const node = nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} is missing.`);
    }
    if (node.selectedChildId && !node.children.includes(node.selectedChildId)) {
      throw new Error(`Node ${nodeId} points to an invalid selected variation.`);
    }
    node.children.forEach((childId) => {
      const child = nodes[childId];
      if (!child) {
        throw new Error(`Node ${nodeId} points to a missing child.`);
      }
      if (child.parentId !== nodeId) {
        throw new Error(`Node ${childId} has an invalid parent link.`);
      }
      stack.push(childId);
    });
  }

  if (reachable.size !== Object.keys(nodes).length) {
    throw new Error('Lesson nodes must form a single tree rooted at the setup position.');
  }
  if (!reachable.has(currentNodeId)) {
    throw new Error('Current lesson node is not reachable from the root.');
  }

  const normalizedNodes = cloneAnalysisNodes(nodes);
  const validationStack = [rootId];
  while (validationStack.length) {
    const nodeId = validationStack.pop();
    const parentNode = normalizedNodes[nodeId];
    for (let index = parentNode.children.length - 1; index >= 0; index -= 1) {
      const childId = parentNode.children[index];
      const childNode = normalizedNodes[childId];
      const replay = new Chess(parentNode.fen);
      let applied;
      try {
        applied = replay.move({
          from: childNode.from,
          to: childNode.to,
          promotion: childNode.promotion,
        });
      } catch {
        throw new Error(`Move ${childNode.from}${childNode.to} is illegal in node ${childId}.`);
      }
      if (replay.fen() !== childNode.fen) {
        throw new Error(`Node ${childId} has a mismatched FEN.`);
      }
      if (childNode.san && childNode.san !== applied.san) {
        throw new Error(`Node ${childId} has a mismatched SAN.`);
      }
      childNode.san = applied.san;
      childNode.promotion = applied.promotion || undefined;
      validationStack.push(childId);
    }
  }

  return {
    rootId,
    currentNodeId,
    nodeCounter: deriveAnalysisNodeCounter(normalizedNodes),
    nodes: normalizedNodes,
  };
}

function validateAndNormalizeLessonPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Lesson file must contain a JSON object.');
  }
  if (Number(payload.version) !== LESSON_FILE_VERSION) {
    throw new Error(`Unsupported lesson version: ${payload.version ?? 'unknown'}.`);
  }

  const normalizedSetup = normalizeSetupFenForLesson(String(payload.setupFen || '').trim());
  const rootId = String(payload.rootId || ROOT_NODE_ID).trim() || ROOT_NODE_ID;
  const currentNodeId = String(payload.currentNodeId || rootId).trim() || rootId;

  return {
    title: typeof payload.title === 'string' ? payload.title : DEFAULT_TITLE,
    analysisTargetDepth: normalizeAnalysisTargetDepth(payload.analysisTargetDepth),
    boardOrientation: payload.boardOrientation === 'black' ? 'black' : 'white',
    activeTab: [TAB_SETUP, TAB_ANALYSIS, TAB_PGN].includes(payload.activeTab) ? payload.activeTab : TAB_PGN,
    advancedOpen: Boolean(payload.advancedOpen),
    toolsExpanded: Boolean(payload.toolsExpanded),
    pgnCommentsVisible: payload.pgnCommentsVisible !== false,
    pvLinesVisible: payload.pvLinesVisible !== false,
    setupFen: normalizedSetup.setupFen,
    setup: normalizedSetup.setup,
    analysis: validateAndNormalizeLessonNodes(payload.nodes, rootId, currentNodeId, normalizedSetup.setupFen),
    annotations: normalizeAnnotationState(payload.annotations),
    note: normalizeNoteState(payload.note),
  };
}

function persistDraft() {
  const payload = buildDraftPayload();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function applyLessonState(lessonState) {
  state.title = lessonState.title;
  state.analysisTargetDepth = normalizeAnalysisTargetDepth(lessonState.analysisTargetDepth);
  state.boardOrientation = lessonState.boardOrientation;
  state.activeTab = lessonState.activeTab;
  state.setup.advancedOpen = lessonState.advancedOpen;
  state.toolsExpanded = Boolean(lessonState.toolsExpanded);
  state.pgnCommentsVisible = lessonState.pgnCommentsVisible !== false;
  state.pvLinesVisible = lessonState.pvLinesVisible !== false;
  state.setup.armedPiece = null;
  state.setup.pieces = lessonState.setup.pieces;
  state.setup.meta = lessonState.setup.meta;
  state.setupFen = lessonState.setupFen;
  state.setup.fenInput = lessonState.setupFen;
  state.setup.fenError = '';
  state.note = normalizeNoteState(lessonState.note);
  state.practice = createEmptyPracticeState();
  state.annotations.enabled = false;
  state.annotations.paintedSquares = new Set(lessonState.annotations?.paintedSquares || []);
  state.annotations.circledSquares = new Set(lessonState.annotations?.circledSquares || []);
  state.annotations.arrows = normalizeAnnotationArrows(lessonState.annotations?.arrows);
  state.annotations.suppressContextMenu = false;
  state.annotations.gesture = createEmptyAnnotationGestureState();
  assignAnalysisTree(lessonState.analysis);
}

function hydrateDraft() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const draft = JSON.parse(raw);
    state.practicePreferenceKind = normalizePracticeKind(draft?.practiceKindPreference);
    if (draft && typeof draft === 'object' && !Array.isArray(draft) && draft.nodes && draft.rootId) {
      applyLessonState(validateAndNormalizeLessonPayload(draft));
      return;
    }

    const title = typeof draft?.title === 'string' ? draft.title : DEFAULT_TITLE;
    const analysisTargetDepth = normalizeAnalysisTargetDepth(draft?.analysisTargetDepth);
    const boardOrientation = draft?.boardOrientation === 'black' ? 'black' : 'white';
    const activeTab = [TAB_SETUP, TAB_ANALYSIS, TAB_PGN].includes(draft?.activeTab) ? draft.activeTab : TAB_PGN;
    const advancedOpen = Boolean(draft?.advancedOpen);
    const toolsExpanded = Boolean(draft?.toolsExpanded);
    const pgnCommentsVisible = draft?.pgnCommentsVisible !== false;
    const pvLinesVisible = draft?.pvLinesVisible !== false;
    const normalizedSetup = normalizeSetupFenForLesson(typeof draft?.setupFen === 'string' ? draft.setupFen : DEFAULT_POSITION);
    const analysisHistory = Array.isArray(draft?.analysisHistory)
      ? draft.analysisHistory
          .filter((move) => move && typeof move.from === 'string' && typeof move.to === 'string')
          .map((move) => ({
            from: move.from,
            to: move.to,
            promotion: normalizePromotionValue(move.promotion),
            san: String(move.san || '').trim(),
          }))
      : [];
    const analysisCursor = Number.isFinite(draft?.analysisCursor)
      ? clamp(Math.trunc(draft.analysisCursor), 0, analysisHistory.length)
      : analysisHistory.length;

    applyLessonState({
      title,
      analysisTargetDepth,
      boardOrientation,
      activeTab,
      advancedOpen,
      toolsExpanded,
      pgnCommentsVisible,
      pvLinesVisible,
      setupFen: normalizedSetup.setupFen,
      setup: normalizedSetup.setup,
      analysis: buildLegacyAnalysisTree(analysisHistory, analysisCursor, normalizedSetup.setupFen),
      annotations: normalizeAnnotationState(draft?.annotations),
      note: normalizeNoteState(draft?.note),
    });
  } catch (error) {
    console.warn('Unable to restore draft.', error);
  }
}

function downloadTextFile(fileName, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

function saveLessonFile() {
  const payload = buildLessonPayload();
  const fileName = `${slugifyLessonTitle(state.title)}.lesson.json`;
  downloadTextFile(fileName, JSON.stringify(payload, null, 2), 'application/json');
  syncLessonFileStatus(`Saved ${fileName}.`);
}

async function openLessonFile(file) {
  if (!file) {
    return;
  }

  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('Lesson file is not valid JSON.');
  }

  const lessonState = validateAndNormalizeLessonPayload(payload);
  applyLessonState(lessonState);
  syncAnalysisGameFromTree();
  renderAll();
  schedulePersist();
  syncLessonFileStatus(`Loaded ${file.name}.`);
}

function buildLessonStateFromImportedPgn(importedPgn) {
  const normalizedSetup = normalizeSetupFenForLesson(String(importedPgn?.setupFen || DEFAULT_POSITION).trim());
  const analysis = validateAndNormalizeLessonNodes(
    importedPgn?.analysis?.nodes,
    String(importedPgn?.analysis?.rootId || ROOT_NODE_ID).trim() || ROOT_NODE_ID,
    String(importedPgn?.analysis?.currentNodeId || ROOT_NODE_ID).trim() || ROOT_NODE_ID,
    normalizedSetup.setupFen,
  );

  return {
    title: typeof importedPgn?.title === 'string' ? importedPgn.title : DEFAULT_TITLE,
    analysisTargetDepth: currentAnalysisTargetDepth(),
    boardOrientation: state.boardOrientation,
    activeTab: TAB_PGN,
    advancedOpen: false,
    toolsExpanded: true,
    pvLinesVisible: state.pvLinesVisible,
    setupFen: normalizedSetup.setupFen,
    setup: normalizedSetup.setup,
    analysis,
    annotations: normalizeAnnotationState(null),
    note: normalizeNoteState({ text: '', expanded: state.note.expanded }),
  };
}

function savePgnFile() {
  const fileName = `${slugifyLessonTitle(state.title)}.pgn`;
  const pgnText = buildPgnFromLessonTree({
    title: state.title,
    setupFen: state.setupFen,
    rootId: state.analysis.rootId,
    nodes: state.analysis.nodes,
  });
  downloadTextFile(fileName, pgnText, 'application/x-chess-pgn');
  syncLessonFileStatus(`Exported ${fileName}.`);
}

async function openPgnFile(file) {
  if (!file) {
    return;
  }

  const text = await file.text();
  const importedPgn = parsePgnToLessonTree(text);
  const lessonState = buildLessonStateFromImportedPgn(importedPgn);
  applyLessonState(lessonState);
  syncAnalysisGameFromTree();
  renderAll();
  schedulePersist();
  syncLessonFileStatus(`Imported ${file.name}.`);
}

function commitSetupState(pieces, meta, options = {}) {
  const { syncFenInput = true, resetAnalysis = true } = options;
  const sanitized = sanitizeSetupState(pieces, meta);
  state.setup.pieces = sanitized.pieces;
  state.setup.meta = sanitized.meta;
  state.setupFen = buildFenFromPiecesAndMeta(sanitized.pieces, sanitized.meta);
  if (syncFenInput) {
    state.setup.fenInput = state.setupFen;
  }
  state.setup.fenError = '';
  if (resetAnalysis) {
    resetAnalysisToSetup({
      keepTab: true,
    });
  }
  schedulePersist();
}

function applyStrictFenInput() {
  const fen = state.setup.fenInput.trim();
  const validation = validateFen(fen);
  if (!validation.ok) {
    state.setup.fenError = validation.error;
    renderHeroBanner();
    renderSetupPanel();
    return;
  }
  try {
    const game = new Chess(fen);
    const parsed = parseFenLike(game.fen());
    if (!parsed.ok) {
      state.setup.fenError = parsed.error;
      renderHeroBanner();
      renderSetupPanel();
      return;
    }
    commitSetupState(parsed.pieces, parsed.meta, { syncFenInput: true, resetAnalysis: true });
    renderAll();
  } catch (error) {
    state.setup.fenError = error?.message || 'Unable to apply that FEN.';
    renderHeroBanner();
    renderSetupPanel();
  }
}

function resetFenDraft() {
  state.setup.fenInput = state.setupFen;
  state.setup.fenError = '';
  renderHeroBanner();
  renderSetupPanel();
}

function updateSetupFromBoardMutation(mutator) {
  const nextPieces = { ...state.setup.pieces };
  mutator(nextPieces);
  commitSetupState(nextPieces, cloneMeta(state.setup.meta), { syncFenInput: true, resetAnalysis: true });
  renderAll();
}

function clearBoard() {
  updateSetupFromBoardMutation((pieces) => {
    Object.keys(pieces).forEach((square) => {
      delete pieces[square];
    });
  });
}

function resetSetupPosition() {
  const parsed = parseFenLike(DEFAULT_POSITION);
  if (!parsed.ok) {
    return;
  }
  commitSetupState(parsed.pieces, parsed.meta, { syncFenInput: true, resetAnalysis: true });
  renderAll();
}

function placeSetupPiece(square, piece, fromSquare = null) {
  updateSetupFromBoardMutation((pieces) => {
    if (fromSquare && fromSquare !== square) {
      delete pieces[fromSquare];
    }
    pieces[square] = piece;
  });
}

function removeSetupPiece(square) {
  if (!state.setup.pieces[square]) {
    return;
  }
  updateSetupFromBoardMutation((pieces) => {
    delete pieces[square];
  });
}

function flipBoard() {
  state.boardOrientation = state.boardOrientation === 'white' ? 'black' : 'white';
  renderBoard();
  renderHeaderMeta();
  schedulePersist();
}

function setPaletteColor(color) {
  if (!['w', 'b'].includes(color)) {
    return;
  }
  state.setup.paletteColor = color;
  if (state.setup.armedPiece) {
    const upper = state.setup.armedPiece.toUpperCase();
    state.setup.armedPiece = color === 'w' ? upper : upper.toLowerCase();
  }
  renderSetupPanel();
  schedulePersist();
}

function toggleArmedPiece(piece) {
  state.setup.armedPiece = state.setup.armedPiece === piece ? null : piece;
  renderSetupPanel();
}

function currentPalettePieces() {
  return PIECE_ORDER.map((piece) => (state.setup.paletteColor === 'w' ? piece : piece.toLowerCase()));
}

function setSetupActiveColor(color) {
  if (hasStandardInitialPlacement(state.setup.pieces)) {
    return;
  }
  const nextMeta = cloneMeta(state.setup.meta);
  nextMeta.activeColor = color === 'b' ? 'b' : 'w';
  commitSetupState({ ...state.setup.pieces }, nextMeta, { syncFenInput: true, resetAnalysis: true });
  renderAfterSetupMetaChange();
}

function updateCastlingRight(flag, enabled) {
  const rights = parseCastlingRights(state.setup.meta.castling);
  if (enabled) {
    rights.add(flag);
  } else {
    rights.delete(flag);
  }
  const nextMeta = cloneMeta(state.setup.meta);
  nextMeta.castling = castlingStringFromRights(rights);
  commitSetupState({ ...state.setup.pieces }, nextMeta, { syncFenInput: true, resetAnalysis: true });
  renderAfterSetupMetaChange();
}

function updateEnPassantSquare(square) {
  const nextMeta = cloneMeta(state.setup.meta);
  nextMeta.enPassant = square || '-';
  commitSetupState({ ...state.setup.pieces }, nextMeta, { syncFenInput: true, resetAnalysis: true });
  renderAfterSetupMetaChange();
}

function clearAnalysisSelection() {
  state.analysis.selectedSquare = null;
  state.analysis.legalMoves = [];
}

function resetAnalysisOutput(options = {}) {
  const { keepReady = true, summary = defaultAnalysisSummary() } = options;
  if (state.engine.worker && state.engine.analyzing) {
    state.engine.worker.postMessage('stop');
  }
  state.engine.loading = false;
  state.engine.analyzing = false;
  state.engine.stopping = false;
  state.engine.searchFen = '';
  state.engine.pendingFen = '';
  state.engine.searchMode = '';
  state.engine.pendingSearchMode = '';
  clearEngineContinuationState();
  state.engine.summary = summary;
  state.engine.evalRailVisible = true;
  clearEngineSearchData();
  if (!keepReady) {
    state.engine.ready = false;
  }
}

function allocateAnalysisNodeId() {
  let candidate = `n${state.analysis.nodeCounter}`;
  while (state.analysis.nodes[candidate]) {
    state.analysis.nodeCounter += 1;
    candidate = `n${state.analysis.nodeCounter}`;
  }
  state.analysis.nodeCounter += 1;
  return candidate;
}

function syncAnalysisGameFromTree(options = {}) {
  const { resetEngine = true } = options;
  clearAnalysisSelection();
  state.analysis.pendingPromotion = null;
  if (!canAnalyzeCurrentSetup()) {
    state.analysis.game = null;
    state.analysis.currentFen = state.setupFen;
    state.analysis.lastMoveSquares = [];
    state.analysis.boardMessage = 'Fix the setup to enable legal-move analysis.';
    if (resetEngine) {
      resetAnalysisOutput({ summary: defaultAnalysisSummary() });
    }
    return;
  }

  const rootNode = getAnalysisNode(state.analysis.rootId);
  if (!rootNode || rootNode.fen !== state.setupFen) {
    assignAnalysisTree(createEmptyAnalysisTree(state.setupFen));
  }

  let currentNode = getCurrentAnalysisNode();
  if (!currentNode) {
    state.analysis.currentNodeId = state.analysis.rootId;
    currentNode = getCurrentAnalysisNode();
  }

  try {
    state.analysis.game = new Chess(currentNode.fen);
    state.analysis.currentFen = currentNode.fen;
  } catch {
    state.analysis.currentNodeId = state.analysis.rootId;
    currentNode = getCurrentAnalysisNode();
    state.analysis.game = new Chess(currentNode.fen);
    state.analysis.currentFen = currentNode.fen;
  }

  if (currentNode?.parentId) {
    state.analysis.lastMoveSquares = [currentNode.from, currentNode.to];
    state.analysis.boardMessage = `Current move: ${currentNode.san}.`;
  } else {
    state.analysis.lastMoveSquares = [];
    state.analysis.boardMessage = 'Select a piece belonging to the side to move.';
  }
  if (state.practice.active) {
    syncPracticeBoardMessage();
  }
  if (resetEngine) {
    resetAnalysisOutput({ summary: defaultAnalysisSummary() });
  }
}

function jumpToAnalysisNode(nodeId, options = {}) {
  const { syncSelection = true } = options;
  const nextNode = getAnalysisNode(nodeId);
  if (!nextNode) {
    return;
  }
  if (state.activeTab === TAB_SETUP && countAnalysisMoveNodes()) {
    state.activeTab = TAB_PGN;
  }
  if (syncSelection) {
    applyAnalysisPathSelection(nodeId);
  }
  state.analysis.currentNodeId = nodeId;
  syncAnalysisGameFromTree();
  schedulePersist();
  renderAll();
}

function navigateToAnalysisStart() {
  if (state.practice.active) {
    return;
  }
  jumpToAnalysisNode(state.analysis.rootId);
}

function navigateToAnalysisParent() {
  if (state.practice.active) {
    return;
  }
  const currentNode = getCurrentAnalysisNode();
  if (!currentNode?.parentId) {
    return;
  }
  jumpToAnalysisNode(currentNode.parentId);
}

function navigateToAnalysisForward() {
  if (state.practice.active) {
    return;
  }
  const nextNodeId = getAnalysisNextNodeId();
  if (!nextNodeId) {
    return;
  }
  jumpToAnalysisNode(nextNodeId);
}

function navigateToAnalysisEnd() {
  if (state.practice.active) {
    return;
  }
  let cursorId = state.analysis.currentNodeId;
  let nextNodeId = getAnalysisNextNodeId(cursorId);
  if (!nextNodeId) {
    return;
  }

  while (nextNodeId) {
    cursorId = nextNodeId;
    nextNodeId = getAnalysisNextNodeId(cursorId);
  }

  jumpToAnalysisNode(cursorId);
}

function resetAnalysisToSetup(options = {}) {
  const { keepTab = true } = options;
  state.practice = createEmptyPracticeState();
  assignAnalysisTree(createEmptyAnalysisTree(state.setupFen));
  syncAnalysisGameFromTree();
  state.engine.evalRailVisible = true;
  if (!keepTab) {
    state.activeTab = TAB_ANALYSIS;
  }
  schedulePersist();
}

function setPracticeFeedback(message, kind = 'warning') {
  state.practice.feedback = String(message || '');
  state.practice.feedbackKind = kind;
}

function practiceMoveMatchesExpectedNode(move, expectedNode) {
  return Boolean(
    move
    && expectedNode
    && move.from === expectedNode.from
    && move.to === expectedNode.to
    && normalizePromotionValue(move.promotion) === normalizePromotionValue(expectedNode.promotion),
  );
}

function formatPracticeMoveLabel(move) {
  if (!move) {
    return 'that move';
  }
  const from = String(move.from || '').trim().toLowerCase();
  const to = String(move.to || '').trim().toLowerCase();
  const promotion = normalizePromotionValue(move.promotion);
  try {
    const replay = new Chess(state.analysis.currentFen);
    const applied = replay.move({ from, to, promotion });
    return applied?.san || `${from}${to}${promotion || ''}`;
  } catch {
    return `${from}${to}${promotion || ''}`;
  }
}

function findMatchingPracticeNode(move) {
  if (!move) {
    return null;
  }
  return getPracticeCandidateNodes().find((candidateNode) => practiceMoveMatchesExpectedNode(move, candidateNode)) || null;
}

function practiceHintTextForNode(expectedNode) {
  if (!expectedNode) {
    return 'No hint is available for this position.';
  }
  if (expectedNode.san === 'O-O' || expectedNode.san === 'O-O-O') {
    return `Hint: ${state.analysis.game?.turn() === 'b' ? 'Black' : 'White'} castles.`;
  }
  const piece = state.analysis.game?.get(expectedNode.from);
  if (!piece) {
    return `Hint: the move starts from ${expectedNode.from}.`;
  }
  return `Hint: ${state.analysis.game?.turn() === 'b' ? 'Black' : 'White'} ${PIECE_LABELS[piece.type.toUpperCase()]} from ${expectedNode.from}.`;
}

function practiceHintText() {
  const candidateNodes = getPracticeCandidateNodes();
  if (!candidateNodes.length) {
    return 'No hint is available for this position.';
  }
  if (candidateNodes.length === 1) {
    return practiceHintTextForNode(candidateNodes[0]);
  }

  const uniqueFromSquares = Array.from(new Set(candidateNodes.map((node) => node.from).filter(Boolean)));
  if (uniqueFromSquares.length === 1) {
    const fromSquare = uniqueFromSquares[0];
    const piece = state.analysis.game?.get(fromSquare);
    if (!piece) {
      return `Hint: every recorded move starts from ${fromSquare}.`;
    }
    return `Hint: every recorded move starts with ${state.analysis.game?.turn() === 'b' ? 'Black' : 'White'} ${PIECE_LABELS[piece.type.toUpperCase()]} from ${fromSquare}.`;
  }

  return getPracticePreferredChildNode()
    ? 'Hint: multiple recorded continuations are accepted here. Reveal move will follow the saved preferred branch.'
    : 'Hint: multiple recorded continuations are accepted here.';
}

function stopPracticeSession() {
  if (!state.practice.active) {
    return;
  }
  state.practice = createEmptyPracticeState();
  clearAnalysisSelection();
  dismissPromotionDialog();
  state.engine.evalRailVisible = true;
  syncAnalysisGameFromTree({ resetEngine: false });
  renderAll();
}

function startPracticeSession(options = {}) {
  const practiceKind = normalizePracticeKind(options.kind ?? state.practicePreferenceKind);
  const branchRootNodeId = String(options.branchRootNodeId || state.analysis.currentNodeId || state.analysis.rootId).trim() || state.analysis.rootId;
  const lineNodeIds = practiceKind === PRACTICE_KIND_LINE ? buildDisplayedLineNodeIds(state.analysis.rootId) : [];
  const branchReady = practiceKind === PRACTICE_KIND_BRANCH ? branchPracticeReady(branchRootNodeId) : false;
  if (practiceKind === PRACTICE_KIND_LINE && lineNodeIds.length < 2) {
    syncLessonFileStatus('Record at least one move on the selected lesson line before starting practice.');
    renderAnalysisPanel();
    renderPgnPanel();
    return;
  }
  if (practiceKind === PRACTICE_KIND_BRANCH && !branchReady) {
    syncLessonFileStatus('Jump to a lesson position with at least one recorded continuation before starting a branch drill.');
    renderAnalysisPanel();
    renderPgnPanel();
    return;
  }

  state.practice = createEmptyPracticeState();
  state.practice.active = true;
  state.practice.kind = practiceKind;
  state.practice.branchRootNodeId = practiceKind === PRACTICE_KIND_BRANCH ? branchRootNodeId : state.analysis.rootId;
  state.practice.lineNodeIds = lineNodeIds;
  setPracticeFeedback(
    practiceKind === PRACTICE_KIND_BRANCH
      ? 'Branch drill started. Recorded continuations stay hidden until you solve them.'
      : 'Practice started. Future moves stay hidden until you solve them.',
    'warning',
  );
  state.activeTab = TAB_ANALYSIS;
  state.toolsExpanded = true;
  clearAnalysisSelection();
  dismissPromotionDialog();
  resetAnalysisOutput({ keepReady: true, summary: defaultAnalysisSummary() });
  state.engine.evalRailVisible = false;
  state.analysis.currentNodeId = state.practice.branchRootNodeId;
  syncAnalysisGameFromTree({ resetEngine: false });
  schedulePersist();
  renderAll();
}

function restartPracticeSession() {
  startPracticeSession({
    kind: state.practice.active ? state.practice.kind : state.practicePreferenceKind,
    branchRootNodeId: state.practice.active ? state.practice.branchRootNodeId : state.analysis.currentNodeId,
  });
}

function requestPracticeHint() {
  if (!state.practice.active || practiceComplete()) {
    return;
  }
  setPracticeFeedback(practiceHintText(), 'warning');
  syncPracticeBoardMessage();
  renderNotationPanel();
  renderAnalysisPanel();
  renderPgnPanel();
}

function revealPracticeMove() {
  if (!state.practice.active) {
    return;
  }
  const revealedNode = state.practice.kind === PRACTICE_KIND_BRANCH
    ? getPracticePreferredChildNode()
    : getPracticeExpectedNode();
  if (!revealedNode) {
    return;
  }
  state.practice.positionIndex += 1;
  state.practice.revealedCount += 1;
  const completesPractice = practiceWillCompleteAfterAdvance(revealedNode);
  setPracticeFeedback(
    completesPractice
      ? `Revealed ${revealedNode.san}. Practice complete.`
      : `Revealed ${revealedNode.san}. Continue with the next move.`,
    completesPractice ? 'success' : 'warning',
  );
  jumpToAnalysisNode(revealedNode.id, { syncSelection: state.practice.kind !== PRACTICE_KIND_BRANCH });
}

function submitPracticeMove(move) {
  if (!state.practice.active) {
    applyAnalysisMove(move);
    return;
  }
  clearAnalysisSelection();
  if (practiceComplete()) {
    setPracticeFeedback('This practice session is already complete.', 'success');
    syncPracticeBoardMessage();
    renderAll();
    return;
  }
  const matchedNode = findMatchingPracticeNode(move);
  if (matchedNode) {
    state.practice.positionIndex += 1;
    state.practice.correctCount += 1;
    const completesPractice = practiceWillCompleteAfterAdvance(matchedNode);
    setPracticeFeedback(
      completesPractice
        ? `Correct: ${matchedNode.san}. Practice complete.`
        : `Correct: ${matchedNode.san}.`,
      'success',
    );
    jumpToAnalysisNode(matchedNode.id, { syncSelection: state.practice.kind !== PRACTICE_KIND_BRANCH });
    return;
  }
  state.practice.incorrectCount += 1;
  setPracticeFeedback(
    state.practice.kind === PRACTICE_KIND_BRANCH
      ? `Not a recorded continuation: ${formatPracticeMoveLabel(move)}. Try again.`
      : `Not this line: ${formatPracticeMoveLabel(move)}. Try again.`,
    'danger',
  );
  syncPracticeBoardMessage();
  renderAll();
}

function formatScoreLabel(scoreType, scoreValue) {
  const numeric = Number(scoreValue);
  if (!Number.isFinite(numeric)) {
    return '0.00';
  }
  if (scoreType === 'mate') {
    return numeric > 0 ? `M${numeric}` : `-M${Math.abs(numeric)}`;
  }
  const pawns = (numeric / 100).toFixed(2);
  return numeric >= 0 ? `+${pawns}` : pawns;
}

function normalizeScoreToWhitePerspective(scoreType, scoreValue, fen) {
  const numeric = Number(scoreValue);
  if (!Number.isFinite(numeric)) {
    return {
      scoreType,
      scoreValue: null,
    };
  }
  const parsed = parseFenLike(fen);
  const multiplier = parsed.ok && parsed.meta.activeColor === 'b' ? -1 : 1;
  return {
    scoreType,
    scoreValue: numeric * multiplier,
  };
}

function scoreToWhiteFraction(scoreType, scoreValue) {
  const numeric = Number(scoreValue);
  if (!Number.isFinite(numeric)) {
    return 0.5;
  }
  if (scoreType === 'mate') {
    return numeric > 0 ? 0.98 : 0.02;
  }
  return clamp(0.5 + numeric / 1200, 0.06, 0.94);
}

function formatNodeCount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return '0';
  }
  if (numeric >= 1_000_000) {
    return `${(numeric / 1_000_000).toFixed(1)}M`;
  }
  if (numeric >= 1_000) {
    return `${(numeric / 1_000).toFixed(1)}k`;
  }
  return `${Math.round(numeric)}`;
}

function currentAnalyzeButtonLabel() {
  if (state.engine.loading) {
    return 'Loading...';
  }
  if (state.engine.stopping) {
    return 'Stopping...';
  }
  if (state.engine.analyzing) {
    return 'Stop';
  }
  return hasAnalysisContinuationAvailable() ? 'Continue' : 'Analyze';
}

function currentPvPlaceholderText() {
  if (state.engine.loading) {
    return 'Loading engine line...';
  }
  if (state.engine.stopping) {
    return 'Stopping analysis...';
  }
  if (state.engine.analyzing) {
    if (state.engine.searchMode === ENGINE_SEARCH_MODE_CONTINUE) {
      return Number.isFinite(state.engine.searchTargetDepth)
        ? `Continuing analysis past depth ${state.engine.searchTargetDepth}...`
        : 'Continuing analysis from the current board position...';
    }
    const targetDepth = Number.isFinite(state.engine.searchTargetDepth)
      ? state.engine.searchTargetDepth
      : currentAnalysisTargetDepth();
    if (!state.engine.depth) {
      return `Stockfish is starting deep analysis toward depth ${targetDepth}...`;
    }
    return `Stockfish is computing 3 variations toward depth ${targetDepth}...`;
  }
  return 'No principal variation yet.';
}

function hasVisibleEnginePvLines() {
  return state.engine.pvLines.some((entry) => entry.line);
}

function renderPvLineListMarkup() {
  const emptyText = currentPvPlaceholderText();
  return `
    <div class="pv-line-list">
      ${state.engine.pvLines.map((entry) => `
        <div class="pv-line ${entry.line ? '' : 'is-empty'}">
          <div class="pv-line-head">
            <span class="pv-line-index">PV ${entry.index}</span>
            <span class="pv-line-depth">Depth ${entry.depth ?? '—'}</span>
            <span class="pv-line-score">${escapeHtml(entry.evalLabel || 'Pending')}</span>
          </div>
          <div class="pv-line-text">${escapeHtml(entry.line || emptyText)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function parseInfoLine(line) {
  const tokens = String(line ?? '').trim().split(/\s+/);
  if (!tokens.length || tokens[0] !== 'info') {
    return null;
  }
  const info = {
    depth: null,
    nps: null,
    scoreType: '',
    scoreValue: null,
    pv: [],
    multipv: 1,
    nodes: null,
  };
  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    switch (token) {
      case 'depth':
        info.depth = Number.parseInt(tokens[index + 1], 10);
        index += 1;
        break;
      case 'multipv':
        info.multipv = Number.parseInt(tokens[index + 1], 10) || 1;
        index += 1;
        break;
      case 'score':
        info.scoreType = tokens[index + 1] || '';
        info.scoreValue = Number.parseInt(tokens[index + 2], 10);
        index += 2;
        break;
      case 'nps':
        info.nps = Number.parseInt(tokens[index + 1], 10);
        index += 1;
        break;
      case 'nodes':
        info.nodes = Number.parseInt(tokens[index + 1], 10);
        index += 1;
        break;
      case 'pv':
        info.pv = tokens.slice(index + 1);
        index = tokens.length;
        break;
      default:
        break;
    }
  }
  return info;
}

function uciMovesToSan(fen, moves) {
  if (!validateFen(fen).ok || !Array.isArray(moves)) {
    return [];
  }
  try {
    const game = new Chess(fen);
    const sanMoves = [];
    for (const rawMove of moves) {
      const move = String(rawMove ?? '').trim().toLowerCase();
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) {
        break;
      }
      const applied = game.move({
        from: move.slice(0, 2),
        to: move.slice(2, 4),
        promotion: move[4] || undefined,
      });
      sanMoves.push(applied.san);
    }
    return sanMoves;
  } catch {
    return [];
  }
}

async function stockfishAssetExists(path) {
  try {
    const response = await window.fetch(new URL(path, import.meta.url), {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function isStockfishBundleInstalled(candidate) {
  const [workerExists, wasmExists] = await Promise.all([
    stockfishAssetExists(candidate.workerPath),
    stockfishAssetExists(candidate.wasmPath),
  ]);
  return workerExists && wasmExists;
}

async function resolveStockfishBundleCandidate() {
  let sawThreadedOnlyInstall = false;
  for (const candidate of ENGINE_BUNDLE_CANDIDATES) {
    if (!await isStockfishBundleInstalled(candidate)) {
      continue;
    }
    if (!candidate.requiresCrossOriginIsolation || window.crossOriginIsolated) {
      return candidate;
    }
    sawThreadedOnlyInstall = true;
  }
  if (sawThreadedOnlyInstall && !window.crossOriginIsolated) {
    throw new Error('A multi-threaded Stockfish bundle is installed, but this server is missing the headers it needs. Run python local_server.py or install a single-threaded bundle.');
  }
  throw new Error('No supported Stockfish browser bundle was found in vendor/stockfish/. Add a stockfish-18-*.js/.wasm pair there.');
}

function terminateEngineWorker() {
  if (!state.engine.worker) {
    return;
  }
  state.engine.worker.removeEventListener('message', handleWorkerMessage);
  state.engine.worker.removeEventListener('error', handleWorkerError);
  state.engine.worker.terminate();
  state.engine.worker = null;
}

async function createStockfishWorker() {
  const candidate = await resolveStockfishBundleCandidate();
  state.engine.bundleId = candidate.id;
  state.engine.bundleLabel = candidate.label;
  state.engine.bundlePath = candidate.workerPath;
  state.engine.summary = `Loading Stockfish (${candidate.label})...`;
  renderAnalysisPanel();
  renderHeaderMeta();
  const worker = new Worker(new URL(candidate.workerPath, import.meta.url));
  worker.addEventListener('message', handleWorkerMessage);
  worker.addEventListener('error', handleWorkerError);
  return worker;
}

function clearEngineReadyHandshake() {
  if (state.engine.readyTimer) {
    window.clearTimeout(state.engine.readyTimer);
    state.engine.readyTimer = null;
  }
  state.engine.loadingPromise = null;
  state.engine.resolveReady = null;
  state.engine.rejectReady = null;
}

function handleWorkerError(event) {
  const message = event?.message || (state.engine.bundleLabel
    ? `Stockfish (${state.engine.bundleLabel}) worker failed to start.`
    : 'Stockfish worker failed to start.');
  if (state.engine.rejectReady) {
    state.engine.rejectReady(new Error(message));
  }
  clearEngineReadyHandshake();
  terminateEngineWorker();
  resetAnalysisOutput({ keepReady: false, summary: message });
  renderAll();
}

function handleWorkerMessage(event) {
  const line = String(event?.data ?? '').trim();
  if (!line) {
    return;
  }
  if (line === 'readyok') {
    state.engine.ready = true;
    state.engine.loading = false;
    const resolve = state.engine.resolveReady;
    clearEngineReadyHandshake();
    if (resolve) {
      resolve(state.engine.worker);
    }
    if (!state.engine.analyzing && !state.engine.stopping) {
      state.engine.summary = defaultAnalysisSummary();
      renderAnalysisPanel();
      renderHeaderMeta();
    }
    return;
  }
  if (line.startsWith('info ') && state.engine.searchFen) {
    const info = parseInfoLine(line);
    if (!info || info.multipv < 1 || info.multipv > ENGINE_MULTI_PV_COUNT) {
      return;
    }
    const normalizedScore = info.scoreType
      ? normalizeScoreToWhitePerspective(info.scoreType, info.scoreValue, state.engine.searchFen)
      : { scoreType: '', scoreValue: null };
    state.engine.depth = Number.isFinite(info.depth) ? info.depth : state.engine.depth;
    state.engine.nps = Number.isFinite(info.nps) ? info.nps : state.engine.nps;
    state.engine.nodes = Number.isFinite(info.nodes) ? info.nodes : state.engine.nodes;
    const pvIndex = info.multipv - 1;
    const existingLine = state.engine.pvLines[pvIndex] || createEmptyEnginePvLine(info.multipv);
    const sanLine = uciMovesToSan(state.engine.searchFen, info.pv);
    const nextEvalLabel = info.scoreType
      ? formatScoreLabel(normalizedScore.scoreType, normalizedScore.scoreValue)
      : existingLine.evalLabel;
    state.engine.pvLines[pvIndex] = {
      index: info.multipv,
      line: sanLine.length ? sanLine.join(' ') : '',
      depth: Number.isFinite(info.depth) ? info.depth : existingLine.depth,
      scoreType: normalizedScore.scoreType || existingLine.scoreType,
      scoreValue: Number.isFinite(normalizedScore.scoreValue) ? normalizedScore.scoreValue : existingLine.scoreValue,
      evalLabel: nextEvalLabel,
    };
    if (info.multipv === 1 && info.scoreType) {
      state.engine.scoreType = normalizedScore.scoreType;
      state.engine.scoreValue = normalizedScore.scoreValue;
      state.engine.evalLabel = nextEvalLabel;
    }
    const summaryBits = [
      state.engine.searchMode === ENGINE_SEARCH_MODE_CONTINUE
        ? (Number.isFinite(state.engine.searchTargetDepth)
            ? `Continuing past depth ${state.engine.searchTargetDepth}`
            : 'Continuing analysis')
        : `Analyzing toward depth ${state.engine.searchTargetDepth ?? currentAnalysisTargetDepth()}`,
    ];
    if (Number.isFinite(state.engine.depth)) {
      summaryBits.push(`Depth ${state.engine.depth}`);
    }
    summaryBits.push(`Eval ${state.engine.evalLabel}`);
    if (state.engine.nps) {
      summaryBits.push(`${formatNodeCount(state.engine.nps)} nps`);
    }
    state.engine.summary = summaryBits.join(' | ');
    renderNotationPanel();
    renderAnalysisPanel();
    renderBoard();
    renderHeaderMeta();
    return;
  }
  if (line.startsWith('bestmove ')) {
    if (state.engine.pendingFen && state.engine.worker) {
      const pendingSearchMode = state.engine.pendingSearchMode || ENGINE_SEARCH_MODE_CHECKPOINT;
      startEngineSearch(state.engine.worker, state.engine.pendingFen, {
        preserveDisplay: true,
        freshGame: true,
        searchMode: pendingSearchMode,
        targetDepth: pendingSearchMode === ENGINE_SEARCH_MODE_CHECKPOINT ? currentAnalysisTargetDepth() : null,
        summary: pendingSearchMode === ENGINE_SEARCH_MODE_CONTINUE
          ? 'Continuing analysis from the current board position...'
          : `Analyzing current board position toward depth ${currentAnalysisTargetDepth()}...`,
      });
      return;
    }
    if (!state.engine.searchFen && !state.engine.stopping && !state.engine.analyzing) {
      return;
    }
    const stoppedFen = state.engine.searchFen;
    const completedMode = state.engine.searchMode;
    const targetDepth = state.engine.searchTargetDepth;
    const wasStopping = state.engine.stopping;
    const tokens = line.split(/\s+/);
    state.engine.analyzing = false;
    state.engine.stopping = false;
    state.engine.pendingFen = '';
    state.engine.pendingSearchMode = '';
    state.engine.bestMove = tokens[1] || '';
    const hasBestMove = Boolean(state.engine.bestMove && state.engine.bestMove !== '(none)');
    if (hasBestMove) {
      const san = uciMovesToSan(stoppedFen, [state.engine.bestMove])[0] || state.engine.bestMove;
      if (completedMode === ENGINE_SEARCH_MODE_CHECKPOINT && !wasStopping) {
        const completedDepth = Number.isFinite(state.engine.depth) ? state.engine.depth : targetDepth;
        state.engine.summary = Number.isFinite(completedDepth)
          ? `Analysis complete at depth ${completedDepth}. Best move: ${san}.`
          : `Analysis complete. Best move: ${san}.`;
        state.engine.resumeFen = stoppedFen;
        state.engine.resumeDepth = Number.isFinite(targetDepth)
          ? targetDepth
          : (Number.isFinite(state.engine.depth) ? state.engine.depth : currentAnalysisTargetDepth());
        state.engine.resumeEligible = Boolean(stoppedFen && state.engine.ready && state.engine.worker);
      } else if (completedMode === ENGINE_SEARCH_MODE_CHECKPOINT && Number.isFinite(targetDepth)) {
        state.engine.summary = Number.isFinite(state.engine.depth)
          ? `Search stopped at depth ${state.engine.depth} before target ${targetDepth}. Best move: ${san}.`
          : `Search stopped before target ${targetDepth}. Best move: ${san}.`;
        clearEngineContinuationState();
      } else if (completedMode === ENGINE_SEARCH_MODE_CONTINUE) {
        state.engine.summary = Number.isFinite(state.engine.depth)
          ? `Search stopped at depth ${state.engine.depth}. Best move: ${san}.`
          : `Search stopped. Best move: ${san}.`;
        clearEngineContinuationState();
      } else {
        state.engine.summary = `Search stopped. Best move: ${san}.`;
        clearEngineContinuationState();
      }
    } else {
      state.engine.summary = completedMode === ENGINE_SEARCH_MODE_CHECKPOINT && !wasStopping
        ? 'Analysis complete. No legal moves are available in this position.'
        : 'Search finished. No legal moves are available in this position.';
      clearEngineContinuationState();
    }
    state.engine.searchFen = '';
    state.engine.searchMode = '';
    state.engine.searchTargetDepth = null;
    renderNotationPanel();
    renderAnalysisPanel();
    renderHeaderMeta();
    return;
  }
}

async function ensureStockfishReady() {
  if (state.engine.ready && state.engine.worker) {
    return state.engine.worker;
  }
  if (state.engine.loadingPromise) {
    return state.engine.loadingPromise;
  }
  state.engine.loading = true;
  state.engine.summary = 'Loading Stockfish engine...';
  renderNotationPanel();
  renderAnalysisPanel();
  renderHeaderMeta();
  state.engine.loadingPromise = new Promise((resolve, reject) => {
    state.engine.resolveReady = resolve;
    state.engine.rejectReady = reject;
    state.engine.readyTimer = window.setTimeout(() => {
      if (state.engine.worker && !state.engine.ready) {
        terminateEngineWorker();
      }
      reject(new Error('Stockfish readiness timed out.'));
      clearEngineReadyHandshake();
    }, ENGINE_READY_TIMEOUT_MS);
    void (async () => {
      try {
        if (!state.engine.worker) {
          state.engine.worker = await createStockfishWorker();
        }
        state.engine.worker.postMessage('uci');
        state.engine.worker.postMessage('isready');
      } catch (error) {
        reject(error);
        clearEngineReadyHandshake();
      }
    })();
  }).finally(() => {
    state.engine.loading = false;
    renderAnalysisPanel();
    renderHeaderMeta();
  });
  return state.engine.loadingPromise;
}

function stopAnalysisSearch({ clearSummary = false, hideEvalRail = clearSummary } = {}) {
  if (state.engine.worker && state.engine.searchFen) {
    state.engine.worker.postMessage('stop');
  }
  state.engine.analyzing = false;
  state.engine.stopping = false;
  state.engine.searchFen = '';
  state.engine.pendingFen = '';
  state.engine.searchMode = '';
  state.engine.pendingSearchMode = '';
  clearEngineContinuationState();
  if (clearSummary) {
    state.engine.summary = defaultAnalysisSummary();
    clearEngineSearchData();
  }
  state.engine.evalRailVisible = !hideEvalRail;
}

async function toggleAnalysis() {
  if (state.practice.active) {
    state.engine.summary = 'Stop practice mode before re-enabling Stockfish.';
    renderNotationPanel();
    renderAnalysisPanel();
    renderHeaderMeta();
    return;
  }
  if (!state.analysis.game) {
    state.engine.summary = defaultAnalysisSummary();
    renderNotationPanel();
    renderAnalysisPanel();
    renderHeaderMeta();
    return;
  }
  if (state.engine.analyzing) {
    state.engine.stopping = true;
    state.engine.pendingFen = '';
    state.engine.pendingSearchMode = '';
    state.engine.summary = 'Stopping Stockfish search...';
    renderNotationPanel();
    renderAnalysisPanel();
    renderHeaderMeta();
    if (state.engine.worker) {
      state.engine.worker.postMessage('stop');
    }
    return;
  }
  try {
    state.engine.evalRailVisible = true;
    const currentFen = state.analysis.currentFen;
    const continuationRequested = hasAnalysisContinuationAvailable();
    const continuationDepth = Number.isFinite(state.engine.resumeDepth) ? state.engine.resumeDepth : null;
    const requestedWarmRestart = Boolean(
      continuationRequested
      && state.engine.worker
      && state.engine.ready
    );
    if (continuationRequested) {
      state.engine.summary = state.engine.ready
        ? (Number.isFinite(continuationDepth)
            ? `Continuing analysis past depth ${continuationDepth}...`
            : 'Continuing analysis from the current board position...')
        : 'Loading Stockfish engine...';
    } else {
      clearEngineSearchData();
      state.engine.summary = state.engine.ready
        ? `Analyzing current board position toward depth ${currentAnalysisTargetDepth()}...`
        : 'Loading Stockfish engine...';
    }
    renderNotationPanel();
    renderBoard();
    renderAnalysisPanel();
    const worker = await ensureStockfishReady();
    const canWarmRestart = Boolean(requestedWarmRestart && worker === state.engine.worker);
    startEngineSearch(worker, currentFen, {
      preserveDisplay: continuationRequested,
      freshGame: !canWarmRestart,
      searchMode: continuationRequested ? ENGINE_SEARCH_MODE_CONTINUE : ENGINE_SEARCH_MODE_CHECKPOINT,
      targetDepth: continuationRequested ? continuationDepth : currentAnalysisTargetDepth(),
      summary: continuationRequested
        ? (Number.isFinite(continuationDepth)
            ? `Continuing analysis past depth ${continuationDepth}...`
            : 'Continuing analysis from the current board position...')
        : `Analyzing current board position toward depth ${currentAnalysisTargetDepth()}...`,
    });
  } catch (error) {
    state.engine.ready = false;
    state.engine.analyzing = false;
    state.engine.stopping = false;
    state.engine.searchFen = '';
    state.engine.pendingFen = '';
    state.engine.searchMode = '';
    state.engine.pendingSearchMode = '';
    clearEngineContinuationState();
    state.engine.evalRailVisible = true;
    clearEngineSearchData();
    state.engine.summary = error?.message || 'Failed to start Stockfish.';
    renderNotationPanel();
    renderAnalysisPanel();
    renderBoard();
    renderHeaderMeta();
  }
}

function resetAnalysisSelectionAndOutputAfterMove() {
  clearAnalysisSelection();
  stopAnalysisSearch({ clearSummary: true });
}

function findExistingAnalysisChildId(parentNode, move) {
  if (!parentNode) {
    return '';
  }
  const promotion = normalizePromotionValue(move.promotion);
  return parentNode.children.find((childId) => {
    const childNode = getAnalysisNode(childId);
    return childNode
      && childNode.from === move.from
      && childNode.to === move.to
      && normalizePromotionValue(childNode.promotion) === promotion;
  }) || '';
}

function applyAnalysisMove(move) {
  if (!state.analysis.game) {
    return;
  }
  const shouldKeepAnalysisLive = (state.engine.analyzing && !state.engine.stopping) || state.engine.loading;
  const currentNode = getCurrentAnalysisNode();
  if (!currentNode) {
    return;
  }
  const applied = state.analysis.game.move({
    from: move.from,
    to: move.to,
    promotion: move.promotion,
  });
  const existingChildId = findExistingAnalysisChildId(currentNode, applied);

  if (existingChildId) {
    currentNode.selectedChildId = existingChildId;
    applyAnalysisPathSelection(existingChildId);
    state.analysis.currentNodeId = existingChildId;
  } else {
    const nodeId = allocateAnalysisNodeId();
    state.analysis.nodes[nodeId] = {
      id: nodeId,
      parentId: currentNode.id,
      from: applied.from,
      to: applied.to,
      promotion: applied.promotion || undefined,
      san: applied.san,
      fen: state.analysis.game.fen(),
      children: [],
      selectedChildId: null,
      comment: '',
    };
    currentNode.children.push(nodeId);
    currentNode.selectedChildId = nodeId;
    applyAnalysisPathSelection(nodeId);
    state.analysis.currentNodeId = nodeId;
  }

  syncAnalysisGameFromTree({ resetEngine: !shouldKeepAnalysisLive });
  state.analysis.boardMessage = shouldKeepAnalysisLive
    ? `Current move: ${applied.san}. Stockfish is following the new board position.`
    : `Current move: ${applied.san}. Analyze the current board position for fresh evaluation.`;
  if (state.engine.analyzing && !state.engine.stopping) {
    queueEngineSearchForFen(state.analysis.currentFen);
  }
  schedulePersist();
  renderAll();
}

function openPromotionDialog(moves, mode = 'analysis') {
  state.analysis.pendingPromotion = {
    moves,
    mode,
  };
  renderPromotionModal();
}

function dismissPromotionDialog() {
  state.analysis.pendingPromotion = null;
  renderPromotionModal();
}

function choosePromotion(promotion) {
  if (!state.analysis.pendingPromotion?.moves) {
    return;
  }
  const chosenMove = state.analysis.pendingPromotion.moves.find((move) => move.promotion === promotion);
  const mode = state.analysis.pendingPromotion.mode || 'analysis';
  dismissPromotionDialog();
  if (chosenMove) {
    if (mode === 'practice') {
      submitPracticeMove(chosenMove);
    } else {
      applyAnalysisMove(chosenMove);
    }
  }
}

function handleAnalysisSquareClick(square) {
  if (!state.analysis.game) {
    return;
  }
  if (state.analysis.selectedSquare) {
    if (square === state.analysis.selectedSquare) {
      clearAnalysisSelection();
      state.analysis.boardMessage = 'Selection cleared.';
      renderBoard();
      renderAnalysisPanel();
      return;
    }
    const matchingMoves = state.analysis.legalMoves.filter((move) => move.to === square);
    if (matchingMoves.length) {
      const promotions = Array.from(new Set(matchingMoves.map((move) => move.promotion).filter(Boolean)));
      if (promotions.length > 1) {
        openPromotionDialog(matchingMoves, state.practice.active ? 'practice' : 'analysis');
        return;
      }
      submitPracticeMove(matchingMoves[0]);
      return;
    }
  }

  const piece = state.analysis.game.get(square);
  if (piece && piece.color === state.analysis.game.turn()) {
    state.analysis.selectedSquare = square;
    state.analysis.legalMoves = state.analysis.game.moves({
      square,
      verbose: true,
    });
    state.analysis.boardMessage = state.analysis.legalMoves.length
      ? `Selected ${square}. Choose a legal target square.`
      : `No legal moves are available from ${square}.`;
    renderBoard();
    renderAnalysisPanel();
    return;
  }

  clearAnalysisSelection();
  state.analysis.boardMessage = 'Select a piece belonging to the side to move.';
  renderBoard();
  renderAnalysisPanel();
}

function currentDisplayPieces() {
  if (state.activeTab === TAB_SETUP) {
    return state.setup.pieces;
  }
  if (state.analysis.game && validateFen(state.analysis.currentFen).ok) {
    const parsed = parsePlacement(state.analysis.currentFen.split(/\s+/)[0]);
    if (parsed.ok) {
      return parsed.pieces;
    }
  }
  return state.setup.pieces;
}

function currentTurnLabel() {
  if (state.activeTab === TAB_SETUP || !state.analysis.game) {
    return state.setup.meta.activeColor === 'b' ? 'Black to move' : 'White to move';
  }
  return state.analysis.game.turn() === 'b' ? 'Black to move' : 'White to move';
}

function currentContextLabel() {
  if (state.practice.active) {
    return 'Practice board';
  }
  if (state.activeTab === TAB_SETUP) {
    return 'Setup editor';
  }
  return state.activeTab === TAB_ANALYSIS ? 'Analysis board' : 'Line navigator';
}

function currentBoardFenLabel() {
  return state.activeTab === TAB_SETUP ? state.setupFen : state.analysis.currentFen;
}

function annotationsVisible() {
  return state.activeTab !== TAB_SETUP;
}

function annotateModeActive() {
  return annotationsVisible() && state.annotations.enabled;
}

function squareFromEventTarget(target) {
  if (!(target instanceof Element)) {
    return '';
  }
  const squareEl = target.closest('.board-square');
  if (!squareEl || !dom.boardGrid.contains(squareEl)) {
    return '';
  }
  return squareEl.dataset.square || '';
}

function squareFromClientPoint(clientX, clientY) {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) {
    return '';
  }
  return squareFromEventTarget(document.elementFromPoint(clientX, clientY));
}

function annotationMarkupForSquare(square) {
  if (!annotationsVisible()) {
    return '';
  }
  const layers = [];
  if (state.annotations.paintedSquares.has(square)) {
    layers.push('<span class="board-annotation board-annotation-paint" aria-hidden="true"></span>');
  }
  if (state.annotations.circledSquares.has(square)) {
    layers.push('<span class="board-annotation board-annotation-circle" aria-hidden="true"></span>');
  }
  return layers.join('');
}

function annotationArrowKey(from, to) {
  return `${from}:${to}`;
}

function squareCenterPoint(square, orientation = state.boardOrientation) {
  if (!SQUARE_PATTERN.test(square)) {
    return null;
  }

  const fileIndex = square.charCodeAt(0) - 97;
  const rankIndex = Number.parseInt(square[1], 10) - 1;
  const col = orientation === 'black' ? 7 - fileIndex : fileIndex;
  const row = orientation === 'black' ? rankIndex : 7 - rankIndex;

  return {
    x: (col * BOARD_CELL_SIZE) + (BOARD_CELL_SIZE / 2),
    y: (row * BOARD_CELL_SIZE) + (BOARD_CELL_SIZE / 2),
  };
}

function buildAnnotationArrowMarkup(from, to, options = {}) {
  const { preview = false } = options;
  const start = squareCenterPoint(from);
  const end = squareCenterPoint(to);
  if (!start || !end || (start.x === end.x && start.y === end.y)) {
    return '';
  }

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance <= ANNOTATION_ARROW_HEAD_LENGTH) {
    return '';
  }

  const unitX = deltaX / distance;
  const unitY = deltaY / distance;
  const headBaseX = end.x - (unitX * ANNOTATION_ARROW_HEAD_LENGTH);
  const headBaseY = end.y - (unitY * ANNOTATION_ARROW_HEAD_LENGTH);
  const perpendicularX = -unitY;
  const perpendicularY = unitX;
  const headHalfWidth = ANNOTATION_ARROW_HEAD_WIDTH / 2;
  const leftX = headBaseX + (perpendicularX * headHalfWidth);
  const leftY = headBaseY + (perpendicularY * headHalfWidth);
  const rightX = headBaseX - (perpendicularX * headHalfWidth);
  const rightY = headBaseY - (perpendicularY * headHalfWidth);
  const className = `board-annotation-arrow ${preview ? 'is-preview' : ''}`.trim();
  const headClassName = `board-annotation-arrow-head ${preview ? 'is-preview' : ''}`.trim();
  return `
    <g>
      <line
        class="${className}"
        x1="${start.x}"
        y1="${start.y}"
        x2="${headBaseX}"
        y2="${headBaseY}"
      ></line>
      <polygon
        class="${headClassName}"
        points="${end.x},${end.y} ${leftX},${leftY} ${rightX},${rightY}"
      ></polygon>
    </g>
  `;
}

function currentPreviewArrow() {
  const { gesture } = state.annotations;
  if (!gesture.active || gesture.mode !== 'arrow') {
    return null;
  }
  if (!SQUARE_PATTERN.test(gesture.startSquare) || !SQUARE_PATTERN.test(gesture.lastSquare) || gesture.startSquare === gesture.lastSquare) {
    return null;
  }
  return {
    from: gesture.startSquare,
    to: gesture.lastSquare,
  };
}

function renderAnnotationOverlay() {
  if (!dom.boardAnnotationOverlay) {
    return;
  }
  if (!annotationsVisible()) {
    dom.boardAnnotationOverlay.innerHTML = '';
    return;
  }

  const savedArrows = state.annotations.arrows
    .map((arrow) => buildAnnotationArrowMarkup(arrow.from, arrow.to))
    .join('');
  const previewArrow = currentPreviewArrow();
  const previewMarkup = previewArrow
    ? buildAnnotationArrowMarkup(previewArrow.from, previewArrow.to, { preview: true })
    : '';

  if (!savedArrows && !previewMarkup) {
    dom.boardAnnotationOverlay.innerHTML = '';
    return;
  }

  dom.boardAnnotationOverlay.innerHTML = `
    ${savedArrows}
    ${previewMarkup}
  `;
}

function hasAnyAnnotations() {
  return state.annotations.paintedSquares.size > 0
    || state.annotations.circledSquares.size > 0
    || state.annotations.arrows.length > 0;
}

function resetAnnotationGesture() {
  state.annotations.gesture = createEmptyAnnotationGestureState();
}

function cancelAnnotationGesture() {
  const shouldRefreshOverlay = state.annotations.gesture.active && state.annotations.gesture.mode === 'arrow';
  resetAnnotationGesture();
  state.annotations.suppressBoardClickUntil = 0;
  state.annotations.suppressContextMenu = false;
  if (shouldRefreshOverlay) {
    renderAnnotationOverlay();
  }
}

function paintAnnotationSquare(square) {
  if (!SQUARE_PATTERN.test(square) || state.annotations.paintedSquares.has(square)) {
    return false;
  }
  state.annotations.paintedSquares.add(square);
  return true;
}

function clearAllAnnotations() {
  if (!hasAnyAnnotations()) {
    return false;
  }
  state.annotations.paintedSquares.clear();
  state.annotations.circledSquares.clear();
  state.annotations.arrows = [];
  return true;
}

function toggleAnnotationCircle(square) {
  if (!SQUARE_PATTERN.test(square)) {
    return false;
  }
  if (state.annotations.circledSquares.has(square)) {
    state.annotations.circledSquares.delete(square);
  } else {
    state.annotations.circledSquares.add(square);
  }
  return true;
}

function addAnnotationArrow(from, to) {
  if (!SQUARE_PATTERN.test(from) || !SQUARE_PATTERN.test(to) || from === to) {
    return false;
  }
  const arrowExists = state.annotations.arrows.some((arrow) => annotationArrowKey(arrow.from, arrow.to) === annotationArrowKey(from, to));
  if (arrowExists) {
    return false;
  }
  state.annotations.arrows = [...state.annotations.arrows, { from, to }];
  return true;
}

function commitAnnotationRender(changed) {
  if (!changed) {
    return false;
  }
  renderBoard();
  schedulePersist();
  return true;
}

function setAnnotateMode(enabled) {
  const nextEnabled = Boolean(enabled);
  if (state.annotations.enabled === nextEnabled) {
    return;
  }
  cancelAnnotationGesture();
  state.annotations.enabled = nextEnabled;
  if (nextEnabled) {
    clearAnalysisSelection();
  }
  renderBoard();
  renderAnalysisPanel();
  renderPgnPanel();
}

function applyAnnotationGestureSquare(square) {
  const { gesture } = state.annotations;
  if (!gesture.active || !SQUARE_PATTERN.test(square) || square === gesture.lastSquare) {
    return;
  }

  let changed = false;
  if (gesture.button === 2) {
    if (gesture.mode === 'paint') {
      if (!gesture.dragged) {
        gesture.dragged = true;
        changed = paintAnnotationSquare(gesture.startSquare) || changed;
      }
      changed = paintAnnotationSquare(square) || changed;
    } else if (gesture.mode === 'arrow') {
      gesture.dragged = true;
    }
  }

  gesture.lastSquare = square;
  if (gesture.mode === 'arrow') {
    renderAnnotationOverlay();
    return;
  }
  commitAnnotationRender(changed);
}

function squareAtDisplayCell(row, col, orientation) {
  if (orientation === 'black') {
    return `${String.fromCharCode(104 - col)}${row + 1}`;
  }
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

function boardLightAtCell(row, col) {
  return (row + col) % 2 === 0;
}

function buildBoardMarkup() {
  const pieces = currentDisplayPieces();
  const selectedSquare = state.activeTab === TAB_SETUP ? null : state.analysis.selectedSquare;
  const lastMoveSquares = new Set(state.activeTab === TAB_SETUP ? [] : state.analysis.lastMoveSquares);
  const legalMoves = state.activeTab === TAB_SETUP ? [] : state.analysis.legalMoves;
  const legalTargets = new Set(legalMoves.map((move) => move.to));
  const legalCaptures = new Set(
    legalMoves
      .filter((move) => move.captured || String(move.flags || '').includes('e'))
      .map((move) => move.to),
  );
  let markup = '';
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const square = squareAtDisplayCell(row, col, state.boardOrientation);
      const isLight = boardLightAtCell(row, col);
      const piece = pieces[square] || '';
      const classes = ['board-square', isLight ? 'light' : 'dark'];
      if (state.activeTab === TAB_SETUP) {
        classes.push('is-setup');
      } else {
        classes.push('is-playable');
      }
      if (square === selectedSquare) {
        classes.push('selected');
      }
      if (lastMoveSquares.has(square)) {
        classes.push('last-move');
      }
      if (legalTargets.has(square)) {
        classes.push(legalCaptures.has(square) ? 'legal-capture' : 'legal-target');
      }
      if (state.boardDragHoverSquare === square && state.activeTab === TAB_SETUP) {
        classes.push('drag-hover');
      }
      const fileLabel = row === 7 ? square[0] : '';
      const rankLabel = col === 0 ? square[1] : '';
      const labelClass = isLight ? 'coord-light' : 'coord-dark';
      markup += `
        <div class="${classes.join(' ')}" data-square="${square}" data-piece="${piece}">
          ${annotationMarkupForSquare(square)}
          ${rankLabel ? `<span class="coord-rank ${labelClass}">${rankLabel}</span>` : ''}
          ${fileLabel ? `<span class="coord-file ${labelClass}">${fileLabel}</span>` : ''}
          ${piece ? `
            <div class="board-piece-shell ${state.activeTab === TAB_SETUP ? 'is-draggable' : ''}" data-square="${square}" data-piece="${piece}" draggable="${state.activeTab === TAB_SETUP}">
              <img class="board-piece" src="${PIECE_ASSETS[piece]}" alt="">
            </div>
          ` : ''}
        </div>
      `;
    }
  }
  return markup;
}

function renderBoard() {
  dom.boardGrid.innerHTML = buildBoardMarkup();
  renderAnnotationOverlay();
  syncBoardSize();

  if (state.engine.evalRailVisible) {
    dom.evalBadgeWrap.classList.remove('is-hidden');
    dom.evalBarWrap.classList.remove('is-hidden');
    dom.evalBadgeWrap.setAttribute('aria-hidden', 'false');
    dom.evalBarWrap.setAttribute('aria-hidden', 'false');
    dom.evalBarWrap.dataset.orientation = state.boardOrientation;
    dom.evalBadge.textContent = state.engine.evalLabel || '0.00';
    const whiteFraction = Number.isFinite(state.engine.scoreValue)
      ? scoreToWhiteFraction(state.engine.scoreType, state.engine.scoreValue)
      : 0.5;
    dom.evalBarWhite.style.height = `${(whiteFraction * 100).toFixed(1)}%`;
    dom.evalBarWhite.style.width = '100%';
    return;
  }
  dom.evalBadgeWrap.classList.add('is-hidden');
  dom.evalBarWrap.classList.add('is-hidden');
  dom.evalBadgeWrap.setAttribute('aria-hidden', 'true');
  dom.evalBarWrap.setAttribute('aria-hidden', 'true');
}

function syncBoardSize() {
  if (!dom.rootElement || !dom.boardFrame || !dom.boardColumn) {
    return;
  }

  dom.rootElement.style.setProperty('--board-side-gap', '0px');
  dom.boardColumn.style.removeProperty('--board-size');
  dom.boardFrame.style.removeProperty('--board-size');

  const columnWidth = dom.boardColumn.clientWidth;
  if (!columnWidth) {
    return;
  }

  const viewportBottomPadding = remToPx(0.9);
  const frameTop = dom.boardFrame.getBoundingClientRect().top;
  const availableHeight = Math.max(0, window.innerHeight - frameTop - viewportBottomPadding);
  const maxBoardSize = remToPx(42);
  const boardSize = Math.floor(Math.min(columnWidth, availableHeight, maxBoardSize));

  if (boardSize > 0) {
    dom.boardColumn.style.setProperty('--board-size', `${boardSize}px`);
  }

  const boardWidth = dom.boardFrame.offsetWidth;
  const boardSideGap = Math.max(0, (columnWidth - boardWidth) / 2);
  dom.rootElement.style.setProperty('--board-side-gap', `${boardSideGap}px`);
}

function renderHeaderMeta() {
  const setupSummary = currentSetupSummary();
  const engineLabel = state.practice.active
    ? 'Practice mode'
    : state.engine.loading
      ? 'Stockfish loading'
      : state.engine.analyzing
        ? 'Stockfish live'
        : state.engine.ready
          ? 'Stockfish ready'
          : 'Stockfish idle';

  dom.boardTitleDisplay.textContent = state.title.trim() || 'Untitled position';
  dom.boardStageSubtitle.textContent = state.practice.active
    ? state.practice.kind === PRACTICE_KIND_BRANCH
      ? 'Solve any recorded continuation from the current lesson branch without seeing future moves or engine output.'
      : 'Solve the next move from the selected lesson line without seeing future moves or engine output.'
    : state.activeTab === TAB_SETUP
      ? 'Build the source position on the board while keeping the setup fields synchronized.'
      : state.activeTab === TAB_ANALYSIS
        ? 'Play legal moves on the board while the right pane tracks evaluation and the current lesson tree.'
        : 'Follow the lesson tree on the right and jump to any recorded branch while the board stays in view.';
  dom.modePill.textContent = state.practice.active ? 'Practice' : state.activeTab === TAB_SETUP ? 'Setup' : state.activeTab === TAB_ANALYSIS ? 'Analysis' : 'Line';
  dom.validityPill.textContent = state.activeTab === TAB_SETUP ? setupSummary.title : engineLabel;
  dom.validityPill.className = `pill ${state.activeTab === TAB_SETUP && setupSummary.kind === 'success' ? 'pill-primary' : ''}`.trim();
  dom.boardContextLabel.textContent = currentContextLabel();
  dom.turnToken.textContent = currentTurnLabel();
  dom.castlingToken.textContent = `Castling ${state.setup.meta.castling === '-' ? 'none' : state.setup.meta.castling}`;
  dom.enPassantToken.textContent = `En passant ${state.setup.meta.enPassant === '-' ? 'none' : state.setup.meta.enPassant}`;
  dom.currentFenCode.textContent = currentBoardFenLabel();
  dom.setupFenCode.textContent = state.setupFen;
  dom.engineReadyLabel.textContent = engineLabel;
  if (dom.headerAnalyzeButton) {
    dom.headerAnalyzeButton.textContent = currentAnalyzeButtonLabel();
    dom.headerAnalyzeButton.disabled = state.practice.active || !state.analysis.game || state.engine.loading || state.engine.stopping;
    dom.headerAnalyzeButton.classList.toggle('primary', !state.engine.analyzing && !state.engine.stopping);
    dom.headerAnalyzeButton.classList.toggle('danger', state.engine.analyzing || state.engine.stopping);
    dom.headerAnalyzeButton.setAttribute('aria-pressed', state.engine.analyzing ? 'true' : 'false');
  }
  if (document.activeElement !== dom.titleInput) {
    dom.titleInput.value = state.title;
  }
}

function renderHeroBanner() {
  const summary = currentSetupSummary();
  dom.heroBanner.innerHTML = `
    <div class="banner ${summary.kind}">
      <div>
        <strong>${escapeHtml(summary.title)}</strong>
        <div>${escapeHtml(summary.message)}</div>
      </div>
    </div>
  `;
}

function commentPreviewText(comment) {
  const normalized = normalizeAnalysisComment(comment).replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }
  return normalized.length > 140
    ? `${normalized.slice(0, 137).trimEnd()}...`
    : normalized;
}

function renderNotationInlineComment(comment) {
  if (!state.pgnCommentsVisible) {
    return '';
  }
  const preview = commentPreviewText(comment);
  if (!preview) {
    return '';
  }
  return `<span class="notation-inline-comment">{${escapeHtml(preview)}}</span>`;
}

function currentAnalysisCommentContext() {
  const currentNode = getCurrentAnalysisNode() || getAnalysisNode(state.analysis.rootId);
  if (!currentNode || currentNode.id === state.analysis.rootId) {
    return {
      copy: 'Saved in PGN before the first move.',
      value: currentNode?.comment || '',
    };
  }
  return {
    copy: `Saved in PGN after ${currentNode.san}.`,
    value: currentNode.comment || '',
  };
}

function renderNotationRootComment() {
  if (!state.pgnCommentsVisible) {
    return '';
  }
  const rootNode = getAnalysisNode(state.analysis.rootId);
  const preview = commentPreviewText(rootNode?.comment);
  if (!preview) {
    return '';
  }
  return `
    <div class="notation-root-comment">
      <span class="notation-inline-comment">{${escapeHtml(preview)}}</span>
    </div>
  `;
}

function renderNotationCommentEditor() {
  if (!state.pgnCommentsVisible) {
    return '';
  }
  const commentState = currentAnalysisCommentContext();
  return `
    <section class="notation-note" aria-label="PGN comment">
      <div class="notation-note-head">
        <div>
          <h3 class="notation-note-title">PGN comment</h3>
          <p class="notation-note-copy">${escapeHtml(commentState.copy)}</p>
        </div>
      </div>
      <div>
        <label class="sr-only" for="notationCommentInput">PGN comment</label>
        <textarea
          id="notationCommentInput"
          class="field-textarea notation-note-input"
          placeholder="Add a PGN comment for this position..."
          spellcheck="true"
        >${escapeHtml(commentState.value)}</textarea>
      </div>
    </section>
  `;
}

function renderNotationMoveToken(node, forceLeadingNumber = false) {
  const ply = getAnalysisPly(node.id);
  const isBlackMove = isBlackMoveForPly(ply);
  const inlineCommentMarkup = renderNotationInlineComment(node.comment);
  let moveNumberMarkup = '';

  if (!isBlackMove) {
    moveNumberMarkup = `<span class="notation-move-number">${moveNumberForPly(ply)}.</span>`;
  } else if (forceLeadingNumber) {
    moveNumberMarkup = `<span class="notation-move-number">${moveNumberForPly(ply)}...</span>`;
  }

  return `${moveNumberMarkup}<button
      type="button"
      class="notation-move ${state.analysis.currentNodeId === node.id ? 'is-current' : ''}"
      data-action="jump-node"
      data-node-id="${node.id}"
    >${escapeHtml(node.san)}</button>${inlineCommentMarkup ? ` ${inlineCommentMarkup}` : ''}`;
}

function renderNotationStaticMoveToken(node, forceLeadingNumber = false) {
  const ply = getAnalysisPly(node.id);
  const isBlackMove = isBlackMoveForPly(ply);
  let moveNumberMarkup = '';

  if (!isBlackMove) {
    moveNumberMarkup = `<span class="notation-move-number">${moveNumberForPly(ply)}.</span>`;
  } else if (forceLeadingNumber) {
    moveNumberMarkup = `<span class="notation-move-number">${moveNumberForPly(ply)}...</span>`;
  }

  return `${moveNumberMarkup}<span class="notation-move ${state.analysis.currentNodeId === node.id ? 'is-current' : ''}">${escapeHtml(node.san)}</span>`;
}

function renderNotationVariation(parentId, childId) {
  return `
    <div class="notation-variation">
      ${renderNotationBranchSequence(parentId, { forcedChildId: childId, skipInitialSiblings: true })}
    </div>
  `;
}

function renderNotationBranchSequence(parentId, options = {}) {
  const { forcedChildId = '', skipInitialSiblings = false } = options;
  let currentParentId = parentId;
  let overrideChildId = forcedChildId;
  let suppressSiblings = skipInitialSiblings;
  let forceLeadingNumber = true;
  const segments = [];
  let tokens = [];
  const seenParents = new Set();

  while (currentParentId && !seenParents.has(currentParentId)) {
    seenParents.add(currentParentId);
    const parentNode = getAnalysisNode(currentParentId);
    if (!parentNode) {
      break;
    }

    const childId = overrideChildId || getAnalysisDisplayedChildId(parentNode);
    overrideChildId = '';
    if (!childId) {
      break;
    }

    const childNode = getAnalysisNode(childId);
    if (!childNode) {
      break;
    }

    tokens.push(renderNotationMoveToken(childNode, forceLeadingNumber));
    forceLeadingNumber = false;

    const siblingIds = suppressSiblings ? [] : parentNode.children.filter((id) => id !== childId);
    suppressSiblings = false;
    if (siblingIds.length) {
      segments.push(`
        <div class="notation-segment">
          <div class="notation-text notation-line">${tokens.join(' ')}</div>
          <div class="notation-variation-list">
            ${siblingIds.map((siblingId) => renderNotationVariation(parentNode.id, siblingId)).join('')}
          </div>
        </div>
      `);
      tokens = [];
      forceLeadingNumber = true;
    }

    currentParentId = childId;
  }

  if (tokens.length) {
    segments.push(`
      <div class="notation-segment">
        <div class="notation-text notation-line">${tokens.join(' ')}</div>
      </div>
    `);
  }

  return segments.join('');
}

function notationSummaryText() {
  if (state.practice.active) {
    return currentPracticePrompt();
  }
  if (!countAnalysisMoveNodes()) {
    return 'Play moves on the board to build the lesson tree.';
  }
  const currentNode = getCurrentAnalysisNode();
  if (!currentNode || currentNode.id === state.analysis.rootId) {
    return 'At the start position.';
  }
  return currentNode?.san
    ? `Current move: ${currentNode.san}.`
    : 'Jump to any point in the lesson tree.';
}

function renderNotationNote() {
  return `
    <section class="notation-note" aria-label="Lesson note">
      <div class="notation-note-head">
        <div>
          <h3 class="notation-note-title">Note</h3>
        </div>
      </div>
      ${state.note.expanded ? `
        <div>
          <label class="sr-only" for="notationNoteInput">Lesson note</label>
          <textarea
            id="notationNoteInput"
            class="field-textarea notation-note-input"
            placeholder="Add a note for this lesson..."
            spellcheck="true"
          >${escapeHtml(state.note.text)}</textarea>
        </div>
      ` : ''}
    </section>
  `;
}

function renderNotationPvBlock() {
  if (state.practice.active) {
    return '';
  }
  if (!state.pvLinesVisible) {
    return '';
  }
  if (!state.engine.loading && !state.engine.stopping && !state.engine.analyzing && !hasVisibleEnginePvLines()) {
    return '';
  }
  return `
    <section class="notation-pv" aria-label="Engine lines">
      <div class="notation-pv-head">
        <div>
          <h3 class="notation-pv-title">Engine lines</h3>
          <p class="notation-pv-copy">Top 3 candidate lines from the current board position.</p>
        </div>
      </div>
      ${renderPvLineListMarkup()}
    </section>
  `;
}

function renderPracticeStatusGridMarkup() {
  return `
    <div class="status-grid">
      <div class="status-tile">
        <span class="status-tile-label">${practicePrimaryStatusLabel()}</span>
        <span class="status-tile-value">${practicePrimaryStatusValue()}</span>
      </div>
      <div class="status-tile">
        <span class="status-tile-label">Correct</span>
        <span class="status-tile-value">${state.practice.correctCount}</span>
      </div>
      <div class="status-tile">
        <span class="status-tile-label">Mistakes</span>
        <span class="status-tile-value">${state.practice.incorrectCount}</span>
      </div>
      <div class="status-tile">
        <span class="status-tile-label">Reveals</span>
        <span class="status-tile-value">${state.practice.revealedCount}</span>
      </div>
    </div>
  `;
}

function renderPracticeNotationBlock() {
  if (!state.practice.active) {
    return '';
  }
  const solvedNodes = getPracticeSolvedNodes();
  let forceLeadingNumber = true;
  const solvedMarkup = solvedNodes.length
    ? solvedNodes.map((node) => {
      const markup = renderNotationStaticMoveToken(node, forceLeadingNumber);
      forceLeadingNumber = false;
      return markup;
    }).join(' ')
    : '<p class="notation-empty">No moves solved yet.</p>';
  return `
    <section class="notation-note" aria-label="Practice mode">
      <div class="notation-note-head">
        <div>
          <h3 class="notation-note-title">Practice mode</h3>
          <p class="notation-note-copy">${escapeHtml(currentPracticePrompt())}</p>
        </div>
      </div>
      ${renderPracticeStatusGridMarkup()}
      <div class="banner ${state.practice.feedbackKind}">
        <div>
          <strong>${practiceComplete() ? 'Practice complete' : 'Next move hidden'}</strong>
          <div>${escapeHtml(currentPracticeFeedback())}</div>
        </div>
      </div>
      <div class="notation-text notation-line">${solvedMarkup}</div>
    </section>
  `;
}

function renderNotationPanel() {
  const hasHistory = countAnalysisMoveNodes() > 0;
  const currentNode = getCurrentAnalysisNode();
  const atStart = !currentNode || currentNode.id === state.analysis.rootId;
  const atEnd = !getAnalysisNextNodeId();

  dom.notationSummary.textContent = notationSummaryText();
  dom.notationStartButton.disabled = state.practice.active || !hasHistory || atStart;
  dom.notationPrevButton.disabled = state.practice.active || !hasHistory || atStart;
  dom.notationNextButton.disabled = state.practice.active || !hasHistory || atEnd;
  dom.notationEndButton.disabled = state.practice.active || !hasHistory || atEnd;

  if (state.practice.active) {
    dom.notationPanel.innerHTML = `
      <div class="notation-content-stack">
        ${renderPracticeNotationBlock()}
        ${renderNotationCommentEditor()}
        ${renderNotationNote()}
      </div>
    `;
    return;
  }

  if (!hasHistory) {
    dom.notationPanel.innerHTML = `
      <div class="notation-content-stack">
        <p class="notation-empty">Play on the board to record the lesson tree.</p>
        ${renderNotationCommentEditor()}
        ${renderNotationPvBlock()}
        ${renderNotationNote()}
      </div>
    `;
    return;
  }

  dom.notationPanel.innerHTML = `
    <div class="notation-content-stack">
      <div class="notation-tree">
        ${renderNotationRootComment()}
        ${renderNotationBranchSequence(state.analysis.rootId)}
      </div>
      ${renderNotationCommentEditor()}
      ${renderNotationPvBlock()}
      ${renderNotationNote()}
    </div>
  `;
}

function sideSelectorMarkup(keyPrefix, selectedValue, labels) {
  return `
    <div class="segment-group">
      ${labels.map((entry) => `
        <button
          type="button"
          class="segmented-button ${selectedValue === entry.value ? 'is-selected' : ''}"
          data-action="${keyPrefix}"
          data-value="${entry.value}"
        >${entry.label}</button>
      `).join('')}
    </div>
  `;
}

function practiceKindSelectorMarkup() {
  return sideSelectorMarkup('set-practice-kind', state.practicePreferenceKind, [
    { value: PRACTICE_KIND_LINE, label: 'Selected line' },
    { value: PRACTICE_KIND_BRANCH, label: 'Branch drill' },
  ]);
}

function practiceAvailabilityMessage(practiceKind) {
  if (practiceKind === PRACTICE_KIND_BRANCH) {
    return branchPracticeReady()
      ? 'The session starts from the current position and accepts any recorded child move.'
      : 'Jump to a lesson position with at least one recorded child move to start a branch drill.';
  }
  return selectedLinePracticeReady()
    ? 'The session follows the displayed lesson line from the setup position.'
    : 'Record at least one move on the selected lesson line before starting practice mode.';
}

function advancedControlsMarkup() {
  const rights = parseCastlingRights(state.setup.meta.castling);
  const whiteKingReady = state.setup.pieces.e1 === 'K';
  const whiteKingSideEnabled = whiteKingReady && state.setup.pieces.h1 === 'R';
  const whiteQueenSideEnabled = whiteKingReady && state.setup.pieces.a1 === 'R';
  const blackKingReady = state.setup.pieces.e8 === 'k';
  const blackKingSideEnabled = blackKingReady && state.setup.pieces.h8 === 'r';
  const blackQueenSideEnabled = blackKingReady && state.setup.pieces.a8 === 'r';
  const enPassantSquares = legalEnPassantSquaresForPieces({
    pieces: state.setup.pieces,
    activeColor: state.setup.meta.activeColor,
    castling: sanitizeCastlingForPieces(state.setup.meta.castling, state.setup.pieces),
    halfmove: state.setup.meta.halfmove,
    fullmove: state.setup.meta.fullmove,
  });
  const locksActiveColor = hasStandardInitialPlacement(state.setup.pieces);
  const activeValue = locksActiveColor ? 'w' : state.setup.meta.activeColor;

  return `
    <div class="details-body">
      <div class="stack-grid">
        <div class="field-row">
          <label class="field-label">Side to move</label>
          ${sideSelectorMarkup('set-active-color', activeValue, [
            { value: 'w', label: 'White' },
            { value: 'b', label: 'Black' },
          ])}
          ${locksActiveColor ? '<p class="muted-copy">The standard starting position always begins with White.</p>' : ''}
        </div>

        <div class="castling-grid">
          <div class="castling-column">
            <label class="field-label">White castling</label>
            <label class="checkbox-chip">
              <input type="checkbox" data-action="toggle-castling" data-flag="K" ${rights.has('K') ? 'checked' : ''} ${whiteKingSideEnabled ? '' : 'disabled'}>
              <span>O-O</span>
            </label>
            <label class="checkbox-chip">
              <input type="checkbox" data-action="toggle-castling" data-flag="Q" ${rights.has('Q') ? 'checked' : ''} ${whiteQueenSideEnabled ? '' : 'disabled'}>
              <span>O-O-O</span>
            </label>
          </div>
          <div class="castling-column">
            <label class="field-label">Black castling</label>
            <label class="checkbox-chip">
              <input type="checkbox" data-action="toggle-castling" data-flag="k" ${rights.has('k') ? 'checked' : ''} ${blackKingSideEnabled ? '' : 'disabled'}>
              <span>O-O</span>
            </label>
            <label class="checkbox-chip">
              <input type="checkbox" data-action="toggle-castling" data-flag="q" ${rights.has('q') ? 'checked' : ''} ${blackQueenSideEnabled ? '' : 'disabled'}>
              <span>O-O-O</span>
            </label>
          </div>
        </div>

        <div class="field-row">
          <label class="field-label" for="enPassantSelect">En passant</label>
          <select id="enPassantSelect" class="field-select" data-action="set-en-passant">
            <option value="-">None</option>
            ${enPassantSquares.map((square) => `
              <option value="${square}" ${state.setup.meta.enPassant === square ? 'selected' : ''}>${square}</option>
            `).join('')}
          </select>
          <p class="muted-copy">${enPassantSquares.length ? 'Only legal en passant target squares are shown.' : 'No legal en passant square exists for this position.'}</p>
        </div>
      </div>
    </div>
  `;
}

function renderSetupPanel() {
  const currentPalette = currentPalettePieces();
  const markup = `
    <article class="lesson-section">
      <div class="lesson-section-header">
        <div>
          <h3 class="lesson-section-title">Board setup</h3>
          <p class="section-copy">Keep the source position clean and lesson-ready while the board stays in sync on the left.</p>
        </div>
      </div>

      <div class="action-row action-row-compact">
        <button type="button" class="action-button tonal" data-action="reset-setup">Reset setup</button>
        <button type="button" class="action-button danger" data-action="clear-board">Clear board</button>
        <button type="button" class="action-button" data-action="flip-board">Flip board</button>
      </div>

      <div class="section-divider"></div>

      <div class="lesson-subsection">
        <div>
          <h4 class="lesson-subtitle">Piece palette</h4>
          <p class="muted-copy">Arm a piece, drag it onto the board, or right-click a square to clear it.</p>
        </div>
      </div>

      <div class="panel-grid">
        <div class="field-row">
          <label class="field-label">Palette side</label>
          ${sideSelectorMarkup('set-palette-color', state.setup.paletteColor, [
            { value: 'w', label: 'White' },
            { value: 'b', label: 'Black' },
          ])}
        </div>

        <div class="piece-palette">
          ${currentPalette.map((piece) => `
            <div class="piece-tool">
              <button
                type="button"
                class="piece-tool-button ${state.setup.armedPiece === piece ? 'is-armed' : ''}"
                data-action="toggle-piece-tool"
                data-piece="${piece}"
                data-drag-piece="${piece}"
                draggable="true"
                aria-label="${piece === piece.toLowerCase() ? 'Black' : 'White'} ${PIECE_LABELS[piece.toUpperCase()]}"
              >
                <img class="piece-tool-icon" src="${PIECE_ASSETS[piece]}" alt="">
              </button>
              <span class="piece-tool-label">${PIECE_LABELS[piece.toUpperCase()]}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </article>

    <article class="lesson-section">
      <div class="lesson-section-header">
        <div>
          <h3 class="lesson-section-title">Position source</h3>
          <p class="section-copy">Paste a legal FEN to replace the setup board, or let the editor keep it synchronized for you.</p>
        </div>
      </div>

      <div class="stack-grid">
        <div class="field-row">
          <label class="field-label" for="fenInput">FEN</label>
          <textarea id="fenInput" class="field-textarea" spellcheck="false">${escapeHtml(state.setup.fenInput)}</textarea>
        </div>

        <div class="action-row">
          <button type="button" class="action-button action-button-static primary" data-action="apply-fen">Apply FEN</button>
          <button type="button" class="action-button action-button-static tonal" data-action="reset-fen">Reset draft</button>
        </div>

        <div class="banner ${state.setup.fenError ? 'danger' : 'warning'}">
          <div>
            <strong>${state.setup.fenError ? 'FEN blocked' : 'Editor sync'}</strong>
            <div>${escapeHtml(state.setup.fenError || 'Board edits rewrite this field immediately, and any setup change resets the analysis state and lesson tree.')}</div>
          </div>
        </div>
      </div>
    </article>

    <article class="lesson-section lesson-section-compact">
      <button type="button" class="details-toggle" data-action="toggle-advanced">
        <span>Advanced position details</span>
        <span class="details-toggle-copy">${state.setup.advancedOpen ? 'Hide' : 'Show'}</span>
      </button>
      ${state.setup.advancedOpen ? advancedControlsMarkup() : ''}
    </article>
  `;
  withPreservedScroll(dom.controlPaneScroll, () => {
    dom.setupPanel.innerHTML = markup;
  });
}

function renderPracticeToolSection() {
  const practiceReady = state.practicePreferenceKind === PRACTICE_KIND_BRANCH
    ? branchPracticeReady()
    : selectedLinePracticeReady();
  if (!state.practice.active) {
    return `
      <article class="lesson-section">
        <div class="lesson-section-header">
          <div>
            <h3 class="lesson-section-title">Practice mode</h3>
            <p class="section-copy">Switch between a fixed selected-line drill and a branch drill that accepts any recorded continuation from the current position.</p>
          </div>
        </div>
        <div class="stack-grid">
          <div class="field-row">
            <label class="field-label">Practice type</label>
            ${practiceKindSelectorMarkup()}
          </div>
          <div class="banner ${practiceReady ? 'warning' : 'danger'}">
            <div>
              <strong>${practiceReady ? 'Ready to practice' : 'Practice unavailable'}</strong>
              <div>${escapeHtml(practiceAvailabilityMessage(state.practicePreferenceKind))}</div>
            </div>
          </div>
          <div class="action-row action-row-compact">
            <button type="button" class="action-button primary" data-action="start-practice" ${practiceReady ? '' : 'disabled'}>Start practice</button>
          </div>
        </div>
      </article>
    `;
  }
  return `
    <article class="lesson-section">
      <div class="lesson-section-header">
        <div>
          <h3 class="lesson-section-title">Practice mode</h3>
          <p class="section-copy">${escapeHtml(currentPracticePrompt())}</p>
        </div>
      </div>
      ${renderPracticeStatusGridMarkup()}
      <div class="stack-grid">
        <div class="banner ${state.practice.feedbackKind}">
          <div>
            <strong>${practiceComplete() ? 'Practice complete' : 'Practice active'}</strong>
            <div>${escapeHtml(currentPracticeFeedback())}</div>
          </div>
        </div>
        <div class="action-row action-row-compact">
          <button type="button" class="action-button tonal" data-action="practice-hint" ${practiceComplete() ? 'disabled' : ''}>Hint</button>
          <button type="button" class="action-button tonal" data-action="practice-reveal" ${practiceComplete() ? 'disabled' : ''}>Reveal move</button>
          <button type="button" class="action-button" data-action="restart-practice">Restart</button>
          <button type="button" class="action-button danger" data-action="stop-practice">Stop practice</button>
        </div>
      </div>
    </article>
  `;
}

function renderAnalysisPanel() {
  const hasBoard = Boolean(state.analysis.game);
  const annotateButtonClass = `action-button tonal ${state.annotations.enabled ? 'is-active' : ''}`.trim();
  const analyzeButtonLabel = currentAnalyzeButtonLabel();
  const analysisButtonDisabled = state.practice.active || !hasBoard || state.engine.loading || state.engine.stopping;
  const depthInputDisabled = state.practice.active || !hasBoard || state.engine.loading || state.engine.analyzing || state.engine.stopping;
  const analyzeButtonTone = state.engine.analyzing || state.engine.stopping ? 'danger' : 'primary';
  const pvLineMarkup = !state.practice.active && state.pvLinesVisible ? renderPvLineListMarkup() : '';
  dom.analysisPanel.innerHTML = `
    <article class="lesson-section">
      <div class="lesson-section-header">
        <div>
          <h3 class="lesson-section-title">Analysis</h3>
          <p class="section-copy">${escapeHtml(state.analysis.boardMessage)}</p>
        </div>
      </div>
      <div class="action-row action-row-compact">
        <button type="button" class="action-button ${analyzeButtonTone}" data-action="toggle-analysis" ${analysisButtonDisabled ? 'disabled' : ''}>
          ${escapeHtml(analyzeButtonLabel)}
        </button>
        <button type="button" class="action-button tonal" data-action="reset-analysis" ${hasBoard ? '' : 'disabled'}>Reset to setup</button>
        <button type="button" class="${annotateButtonClass}" data-action="toggle-annotate" aria-pressed="${state.annotations.enabled ? 'true' : 'false'}">Annotate</button>
        <button type="button" class="action-button" data-action="flip-board">Flip board</button>
      </div>
      <div class="analysis-target-depth-row">
        <label class="field-label" for="analysisTargetDepthInput">Target depth</label>
        <div class="analysis-target-depth-control">
          <input
            id="analysisTargetDepthInput"
            class="field-input analysis-target-depth-input"
            type="number"
            min="${ANALYSIS_TARGET_DEPTH_MIN}"
            max="${ANALYSIS_TARGET_DEPTH_MAX}"
            step="1"
            inputmode="numeric"
            value="${currentAnalysisTargetDepth()}"
            ${depthInputDisabled ? 'disabled' : ''}
          >
          <p class="analysis-target-depth-copy">Auto-stop at this checkpoint, then use Continue to resume open-ended search.</p>
        </div>
      </div>

      <div class="section-divider"></div>

      ${state.practice.active ? `
        <div class="stack-grid">
          <div class="banner warning">
            <div>
              <strong>Engine hidden</strong>
              <div>Stockfish output is hidden while practice mode is active.</div>
            </div>
          </div>
        </div>
      ` : `
        <div class="status-grid">
          <div class="status-tile">
            <span class="status-tile-label">Evaluation</span>
            <span class="status-tile-value">${escapeHtml(state.engine.evalLabel || '0.00')}</span>
          </div>
          <div class="status-tile">
            <span class="status-tile-label">Depth</span>
            <span class="status-tile-value">${state.engine.depth ?? '—'}</span>
          </div>
          <div class="status-tile">
            <span class="status-tile-label">Nodes</span>
            <span class="status-tile-value">${escapeHtml(formatNodeCount(state.engine.nodes))}</span>
          </div>
        </div>

        <div class="stack-grid">
          <div class="banner ${hasBoard ? (state.engine.analyzing ? 'warning' : 'success') : 'danger'}">
            <div>
              <strong>${hasBoard ? 'Engine status' : 'Analysis unavailable'}</strong>
              <div>${escapeHtml(state.engine.summary)}</div>
            </div>
          </div>
          ${pvLineMarkup}
        </div>
      `}
    </article>
    ${renderPracticeToolSection()}
  `;
}

function renderPgnPanel() {
  const hasBoard = Boolean(state.analysis.game);
  const totalPly = countAnalysisMoveNodes();
  const branchPoints = countAnalysisBranchPoints();
  const lineSummary = totalPly
    ? `${totalPly} ply recorded in the lesson tree with ${branchPoints || 0} branch point${branchPoints === 1 ? '' : 's'}.`
    : 'No moves recorded yet. Use Analysis to start building the lesson tree.';
  const annotateButtonClass = `action-button tonal ${state.annotations.enabled ? 'is-active' : ''}`.trim();
  dom.pgnPanel.innerHTML = `
    <article class="lesson-section">
      <div class="lesson-section-header">
        <div>
          <h3 class="lesson-section-title">Line navigation</h3>
          <p class="section-copy">The notation above stays live. Jump back to the start, reset to the setup, or keep exploring from the board.</p>
        </div>
      </div>
      <div class="action-row action-row-compact">
        <button type="button" class="action-button tonal" data-action="navigate-start" ${(hasBoard && !state.practice.active) ? '' : 'disabled'}>Back to start</button>
        <button type="button" class="action-button tonal" data-action="reset-analysis" ${hasBoard ? '' : 'disabled'}>Reset to setup</button>
        <button type="button" class="${annotateButtonClass}" data-action="toggle-annotate" aria-pressed="${state.annotations.enabled ? 'true' : 'false'}">Annotate</button>
        <button type="button" class="action-button" data-action="flip-board">Flip board</button>
      </div>
      <div class="stack-grid">
        <p class="muted-copy">${escapeHtml(lineSummary)}</p>
        <div class="banner ${hasBoard ? 'success' : 'warning'}">
          <div>
            <strong>${hasBoard ? 'Current board' : 'Line waiting'}</strong>
            <div>${escapeHtml(state.analysis.boardMessage)}</div>
          </div>
        </div>
      </div>
    </article>
    ${renderPracticeToolSection()}
  `;
}

function renderPromotionModal() {
  const pending = state.analysis.pendingPromotion;
  if (!pending?.moves?.length) {
    dom.promotionModal.hidden = true;
    dom.promotionModal.setAttribute('aria-hidden', 'true');
    dom.promotionChoices.innerHTML = '';
    return;
  }
  const moveColor = pending.moves[0]?.color === 'b' ? 'b' : 'w';
  dom.promotionModal.hidden = false;
  dom.promotionModal.setAttribute('aria-hidden', 'false');
  dom.promotionSubtitle.textContent = `${moveColor === 'w' ? 'White' : 'Black'} pawn promotion choices`;
  dom.promotionChoices.innerHTML = ['q', 'r', 'b', 'n'].map((promotion) => {
    const key = moveColor === 'w' ? promotion.toUpperCase() : promotion;
    const name = PIECE_LABELS[promotion.toUpperCase()];
    return `
      <button type="button" class="promotion-choice" data-action="choose-promotion" data-promotion="${promotion}">
        <img src="${PIECE_ASSETS[key]}" alt="">
        <span>${name}</span>
      </button>
    `;
  }).join('');
}

function renderTabs() {
  document.querySelectorAll('.tab-chip').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.tab === state.activeTab);
  });

  const panels = [
    [dom.setupPanel, TAB_SETUP],
    [dom.analysisPanel, TAB_ANALYSIS],
    [dom.pgnPanel, TAB_PGN],
  ];
  panels.forEach(([panel, tab]) => {
    const active = tab === state.activeTab;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
}

function renderWorkspaceTools() {
  if (!dom.workspaceTools) {
    return;
  }
  dom.workspaceTools.hidden = !state.toolsExpanded;
}

function renderAll() {
  renderBoard();
  renderHeaderMeta();
  renderHeroBanner();
  renderNotationPanel();
  renderSetupPanel();
  renderAnalysisPanel();
  renderPgnPanel();
  renderTabs();
  renderWorkspaceTools();
  syncLessonVisibilityMenuState();
  renderPromotionModal();
}

function renderAfterSetupMetaChange() {
  withPreservedScroll(dom.controlPaneScroll, () => {
    renderHeaderMeta();
    renderHeroBanner();
    renderNotationPanel();
    renderSetupPanel();
    renderAnalysisPanel();
    renderPgnPanel();
    renderPromotionModal();
  });
}

function handleBoardClick(event) {
  if (Date.now() < state.annotations.suppressBoardClickUntil) {
    event.preventDefault();
    state.annotations.suppressBoardClickUntil = 0;
    return;
  }
  const squareEl = event.target.closest('.board-square');
  if (!squareEl) {
    return;
  }
  const square = squareEl.dataset.square;
  if (!square) {
    return;
  }

  if (annotateModeActive()) {
    event.preventDefault();
    return;
  }

  if (state.activeTab === TAB_SETUP) {
    if (state.setup.armedPiece) {
      placeSetupPiece(square, state.setup.armedPiece);
      return;
    }
    if (state.setup.pieces[square]) {
      const piece = state.setup.pieces[square];
      state.setup.armedPiece = piece;
      state.setup.paletteColor = piece === piece.toLowerCase() ? 'b' : 'w';
      renderSetupPanel();
    }
    return;
  }

  handleAnalysisSquareClick(square);
}

function handleBoardContextMenu(event) {
  if (annotationsVisible()) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (state.activeTab !== TAB_SETUP) {
    return;
  }
  const square = squareFromEventTarget(event.target);
  if (!square) {
    return;
  }
  event.preventDefault();
  removeSetupPiece(square);
}

function handleBoardMouseDown(event) {
  if (event.button !== 0 && event.button !== 2) {
    return;
  }
  if (event.button === 2) {
    if (!annotationsVisible()) {
      return;
    }
  } else {
    if (!annotationsVisible()) {
      return;
    }
    if (hasAnyAnnotations()) {
      event.preventDefault();
      state.annotations.suppressBoardClickUntil = Date.now() + 400;
      commitAnnotationRender(clearAllAnnotations());
      return;
    }
    if (annotateModeActive()) {
      event.preventDefault();
      state.annotations.suppressBoardClickUntil = Date.now() + 400;
      return;
    }
    return;
  }

  const squareEl = event.target.closest('.board-square');
  if (!squareEl) {
    return;
  }
  const square = squareEl.dataset.square || '';
  if (!SQUARE_PATTERN.test(square)) {
    return;
  }

  event.preventDefault();
  state.annotations.gesture = {
    active: true,
    button: event.button,
    mode: event.button === 2 && event.altKey ? 'arrow' : 'paint',
    startSquare: square,
    lastSquare: square,
    dragged: false,
  };
  state.annotations.suppressContextMenu = event.button === 2;
}

function handleDocumentMouseMove(event) {
  if (!state.annotations.gesture.active) {
    return;
  }
  if (event.buttons === 0) {
    cancelAnnotationGesture();
    return;
  }
  applyAnnotationGestureSquare(squareFromClientPoint(event.clientX, event.clientY));
}

function handleDocumentMouseUp(event) {
  const { gesture } = state.annotations;
  if (!gesture.active) {
    return;
  }

  const releaseSquare = squareFromClientPoint(event.clientX, event.clientY);
  let changed = false;
  if (gesture.button === 2) {
    if (gesture.mode === 'paint' && !gesture.dragged && releaseSquare === gesture.startSquare) {
      changed = toggleAnnotationCircle(gesture.startSquare);
    } else if (gesture.mode === 'arrow' && releaseSquare && releaseSquare !== gesture.startSquare) {
      changed = addAnnotationArrow(gesture.startSquare, releaseSquare);
    }
  }

  const shouldRefreshOverlay = gesture.mode === 'arrow';
  resetAnnotationGesture();
  if (changed) {
    commitAnnotationRender(true);
  } else if (shouldRefreshOverlay) {
    renderAnnotationOverlay();
  }
  if (gesture.button === 2) {
    window.setTimeout(() => {
      state.annotations.suppressContextMenu = false;
    }, 250);
  } else {
    state.annotations.suppressContextMenu = false;
  }
}

function handleDocumentContextMenu(event) {
  const square = squareFromEventTarget(event.target);
  if (annotationsVisible() && square) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (!state.annotations.suppressContextMenu) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  state.annotations.suppressContextMenu = false;
}

function extractDragPayload(event) {
  const text = event.dataTransfer?.getData('application/x-chess-piece');
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function handleBoardDragStart(event) {
  if (state.activeTab !== TAB_SETUP) {
    return;
  }
  const pieceShell = event.target.closest('[data-piece][draggable="true"]');
  if (!pieceShell) {
    return;
  }
  const piece = pieceShell.dataset.piece;
  const square = pieceShell.dataset.square || '';
  if (!piece) {
    return;
  }
  event.dataTransfer?.setData('application/x-chess-piece', JSON.stringify({
    piece,
    fromSquare: square || null,
    source: square ? 'board' : 'palette',
  }));
  event.dataTransfer.effectAllowed = 'copyMove';
}

function handlePaletteDragStart(event) {
  const dragSource = event.target.closest('[data-drag-piece]');
  if (!dragSource) {
    return;
  }
  const piece = dragSource.dataset.dragPiece;
  if (!piece) {
    return;
  }
  event.dataTransfer?.setData('application/x-chess-piece', JSON.stringify({
    piece,
    fromSquare: null,
    source: 'palette',
  }));
  event.dataTransfer.effectAllowed = 'copy';
}

function handleBoardDragOver(event) {
  if (state.activeTab !== TAB_SETUP) {
    return;
  }
  const squareEl = event.target.closest('.board-square');
  if (!squareEl) {
    return;
  }
  event.preventDefault();
  updateBoardDragHover(squareEl.dataset.square || null);
}

function handleBoardDrop(event) {
  if (state.activeTab !== TAB_SETUP) {
    return;
  }
  const squareEl = event.target.closest('.board-square');
  if (!squareEl) {
    return;
  }
  event.preventDefault();
  const payload = extractDragPayload(event);
  updateBoardDragHover(null);
  if (!payload?.piece) {
    return;
  }
  placeSetupPiece(squareEl.dataset.square, payload.piece, payload.fromSquare || null);
}

function updateBoardDragHover(square) {
  if (state.boardDragHoverSquare === square) {
    return;
  }
  if (state.boardDragHoverSquare) {
    const previous = dom.boardGrid.querySelector(`[data-square="${state.boardDragHoverSquare}"]`);
    previous?.classList.remove('drag-hover');
  }
  state.boardDragHoverSquare = square;
  if (state.boardDragHoverSquare) {
    const next = dom.boardGrid.querySelector(`[data-square="${state.boardDragHoverSquare}"]`);
    next?.classList.add('drag-hover');
  }
}

function clearBoardDragHover() {
  updateBoardDragHover(null);
}

function handleDocumentClick(event) {
  const clickTarget = event.target;
  const clickedInsideLessonActions = clickTarget instanceof Element && Boolean(clickTarget.closest('.lesson-overflow'));
  if (!clickedInsideLessonActions) {
    closeLessonActionsMenu();
  }

  const actionEl = clickTarget instanceof Element ? clickTarget.closest('[data-action]') : null;
  if (!actionEl) {
    return;
  }
  const { action } = actionEl.dataset;
  switch (action) {
    case 'toggle-lesson-actions':
      toggleLessonActionsMenu();
      break;
    case 'set-tab':
      if (state.practice.active && actionEl.dataset.tab === TAB_SETUP) {
        stopPracticeSession();
      }
      state.activeTab = actionEl.dataset.tab || TAB_SETUP;
      renderAll();
      schedulePersist();
      break;
    case 'flip-board':
      flipBoard();
      break;
    case 'reset-setup':
      resetSetupPosition();
      break;
    case 'clear-board':
      clearBoard();
      break;
    case 'toggle-piece-tool':
      toggleArmedPiece(actionEl.dataset.piece || '');
      break;
    case 'set-palette-color':
      setPaletteColor(actionEl.dataset.value || 'w');
      break;
    case 'set-active-color':
      setSetupActiveColor(actionEl.dataset.value || 'w');
      break;
    case 'apply-fen':
      applyStrictFenInput();
      break;
    case 'reset-fen':
      resetFenDraft();
      break;
    case 'toggle-advanced':
      state.setup.advancedOpen = !state.setup.advancedOpen;
      renderSetupPanel();
      schedulePersist();
      break;
    case 'set-practice-kind':
      state.practicePreferenceKind = normalizePracticeKind(actionEl.dataset.value);
      renderAnalysisPanel();
      renderPgnPanel();
      schedulePersist();
      break;
    case 'toggle-analysis':
      void toggleAnalysis();
      break;
    case 'start-practice':
      startPracticeSession();
      break;
    case 'restart-practice':
      restartPracticeSession();
      break;
    case 'stop-practice':
      stopPracticeSession();
      break;
    case 'practice-hint':
      requestPracticeHint();
      break;
    case 'practice-reveal':
      revealPracticeMove();
      break;
    case 'toggle-annotate':
      setAnnotateMode(!state.annotations.enabled);
      break;
    case 'toggle-note':
      state.note.expanded = !state.note.expanded;
      closeLessonActionsMenu({ restoreFocus: true });
      renderNotationPanel();
      syncLessonVisibilityMenuState();
      schedulePersist();
      if (state.note.expanded) {
        window.setTimeout(() => {
          document.getElementById('notationNoteInput')?.focus();
        }, 0);
      }
      break;
    case 'toggle-pgn-comments':
      state.pgnCommentsVisible = !state.pgnCommentsVisible;
      closeLessonActionsMenu({ restoreFocus: true });
      renderNotationPanel();
      syncLessonVisibilityMenuState();
      schedulePersist();
      break;
    case 'toggle-tools':
      state.toolsExpanded = !state.toolsExpanded;
      closeLessonActionsMenu({ restoreFocus: true });
      renderWorkspaceTools();
      syncLessonVisibilityMenuState();
      schedulePersist();
      break;
    case 'toggle-pv-lines':
      state.pvLinesVisible = !state.pvLinesVisible;
      closeLessonActionsMenu({ restoreFocus: true });
      renderNotationPanel();
      renderAnalysisPanel();
      syncLessonVisibilityMenuState();
      schedulePersist();
      break;
    case 'reset-analysis':
      resetAnalysisToSetup({ keepTab: true });
      renderAll();
      break;
    case 'navigate-start':
      navigateToAnalysisStart();
      break;
    case 'navigate-back':
      navigateToAnalysisParent();
      break;
    case 'navigate-forward':
      navigateToAnalysisForward();
      break;
    case 'navigate-end':
      navigateToAnalysisEnd();
      break;
    case 'jump-node':
      jumpToAnalysisNode(actionEl.dataset.nodeId || '');
      break;
    case 'open-lesson':
      closeLessonActionsMenu();
      if (dom.lessonFileInput) {
        dom.lessonFileInput.value = '';
        dom.lessonFileInput.click();
      }
      break;
    case 'save-lesson':
      closeLessonActionsMenu();
      saveLessonFile();
      break;
    case 'import-pgn':
      closeLessonActionsMenu();
      if (dom.pgnFileInput) {
        dom.pgnFileInput.value = '';
        dom.pgnFileInput.click();
      }
      break;
    case 'export-pgn':
      closeLessonActionsMenu();
      savePgnFile();
      break;
    case 'copy-fen':
      void copyCurrentFenToClipboard();
      break;
    case 'set-color-theme':
      applyColorTheme(actionEl.dataset.value || 'light', { persist: true });
      closeLessonActionsMenu({ restoreFocus: true });
      break;
    case 'choose-promotion':
      choosePromotion(actionEl.dataset.promotion || '');
      break;
    case 'dismiss-promotion':
      dismissPromotionDialog();
      break;
    default:
      break;
  }
}

function handleDocumentInput(event) {
  if (event.target === dom.titleInput) {
    state.title = dom.titleInput.value;
    dom.boardTitleDisplay.textContent = state.title.trim() || 'Untitled position';
    schedulePersist();
    return;
  }
  if (event.target?.id === 'analysisTargetDepthInput') {
    if (event.target.value !== '') {
      state.analysisTargetDepth = normalizeAnalysisTargetDepth(event.target.value);
      schedulePersist();
    }
    return;
  }
  if (event.target?.id === 'notationNoteInput') {
    state.note.text = event.target.value;
    schedulePersist();
    return;
  }
  if (event.target?.id === 'notationCommentInput') {
    const currentNode = getCurrentAnalysisNode() || getAnalysisNode(state.analysis.rootId);
    if (currentNode) {
      currentNode.comment = normalizeAnalysisComment(event.target.value);
      schedulePersist();
    }
    return;
  }
  if (event.target.id === 'fenInput') {
    state.setup.fenInput = event.target.value;
  }
}

function handleDocumentChange(event) {
  if (event.target === dom.lessonFileInput) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    openLessonFile(file).catch((error) => {
      console.error('Unable to open lesson file.', error);
      syncLessonFileStatus(error?.message || 'Unable to open lesson file.');
    }).finally(() => {
      if (dom.lessonFileInput) {
        dom.lessonFileInput.value = '';
      }
    });
    return;
  }
  if (event.target === dom.pgnFileInput) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    openPgnFile(file).catch((error) => {
      console.error('Unable to import PGN file.', error);
      syncLessonFileStatus(error?.message || 'Unable to import PGN file.');
    }).finally(() => {
      if (dom.pgnFileInput) {
        dom.pgnFileInput.value = '';
      }
    });
    return;
  }
  if (event.target?.id === 'analysisTargetDepthInput') {
    state.analysisTargetDepth = normalizeAnalysisTargetDepth(event.target.value);
    event.target.value = String(state.analysisTargetDepth);
    if (!state.engine.analyzing && !state.engine.stopping && !hasAnalysisContinuationAvailable()) {
      state.engine.summary = defaultAnalysisSummary();
    }
    renderAnalysisPanel();
    renderHeaderMeta();
    schedulePersist();
    return;
  }

  const action = event.target?.dataset?.action;
  if (!action) {
    return;
  }
  switch (action) {
    case 'toggle-castling':
      updateCastlingRight(event.target.dataset.flag || '', Boolean(event.target.checked));
      break;
    case 'set-en-passant':
      updateEnPassantSquare(event.target.value || '-');
      break;
    default:
      break;
  }
}

function isTypingTarget(target) {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function handleDocumentKeydown(event) {
  if (event.key === 'Escape' && isLessonActionsMenuOpen()) {
    event.preventDefault();
    closeLessonActionsMenu({ restoreFocus: true });
    return;
  }
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }
  if (state.practice.active) {
    return;
  }
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return;
  }
  if (isTypingTarget(event.target) || !dom.promotionModal.hidden || !state.analysis.game || !countAnalysisMoveNodes()) {
    return;
  }

  const currentNode = getCurrentAnalysisNode();
  if (!currentNode) {
    return;
  }

  const targetNodeId = event.key === 'ArrowLeft'
    ? (currentNode.parentId || '')
    : getAnalysisNextNodeId(currentNode.id);
  if (!targetNodeId) {
    return;
  }

  event.preventDefault();
  jumpToAnalysisNode(targetNodeId);
}

function initializeDefaultSetup() {
  const parsed = parseFenLike(DEFAULT_POSITION);
  if (!parsed.ok) {
    throw new Error(parsed.error);
  }
  const sanitized = sanitizeSetupState(parsed.pieces, parsed.meta);
  state.setup.pieces = sanitized.pieces;
  state.setup.meta = sanitized.meta;
  state.setupFen = buildFenFromPiecesAndMeta(sanitized.pieces, sanitized.meta);
  state.setup.fenInput = state.setupFen;
  state.practice = createEmptyPracticeState();
  assignAnalysisTree(createEmptyAnalysisTree(state.setupFen));
  syncAnalysisGameFromTree();
}

function bindEvents() {
  document.addEventListener('click', handleDocumentClick);
  document.addEventListener('input', handleDocumentInput);
  document.addEventListener('change', handleDocumentChange);
  document.addEventListener('keydown', handleDocumentKeydown);
  document.addEventListener('mousemove', handleDocumentMouseMove);
  document.addEventListener('mouseup', handleDocumentMouseUp);
  document.addEventListener('contextmenu', handleDocumentContextMenu, true);
  document.addEventListener('dragstart', handlePaletteDragStart);
  dom.boardGrid.addEventListener('mousedown', handleBoardMouseDown);
  dom.boardGrid.addEventListener('click', handleBoardClick);
  dom.boardGrid.addEventListener('contextmenu', handleBoardContextMenu, true);
  dom.boardGrid.addEventListener('dragstart', handleBoardDragStart);
  dom.boardGrid.addEventListener('dragover', handleBoardDragOver);
  dom.boardGrid.addEventListener('drop', handleBoardDrop);
  dom.boardGrid.addEventListener('dragleave', (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    clearBoardDragHover();
  });
  dom.boardGrid.addEventListener('dragend', clearBoardDragHover);
  dom.promotionModal.addEventListener('click', (event) => {
    if (event.target === dom.promotionModal) {
      dismissPromotionDialog();
    }
  });
  window.addEventListener('beforeunload', () => {
    persistDraft();
    terminateEngineWorker();
  });
  window.addEventListener('resize', handleViewportResize);
  window.visualViewport?.addEventListener('resize', syncOpenLessonActionsMenuLayout);
  window.addEventListener('blur', cancelAnnotationGesture);
  syncLessonFileStatus(state.lessonFileStatus);
  setLessonActionsMenuOpen(false);
}

initializeColorTheme();
initializeDefaultSetup();
hydrateDraft();
syncAnalysisGameFromTree();
bindEvents();
renderAll();

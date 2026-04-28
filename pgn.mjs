import { Chess, DEFAULT_POSITION, parsePgn, validateFen } from './vendor/chess.js';

const ROOT_NODE_ID = 'root';
const APP_SITE_NAME = 'Chess Lesson Study Board';
const DEFAULT_RESULT = '*';

function normalizeCommentText(value) {
  return typeof value === 'string'
    ? value.replace(/\r\n?/g, '\n')
    : '';
}

function normalizeHeaderText(value) {
  return String(value ?? '').trim();
}

function sanitizeCommentForPgn(comment) {
  return normalizeCommentText(comment)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\{/g, '[')
    .replace(/\}/g, ']');
}

function mergeCommentText(existing, addition) {
  const base = normalizeCommentText(existing).trim();
  const extra = normalizeCommentText(addition).trim();
  if (!extra) {
    return base;
  }
  if (!base) {
    return extra;
  }
  if (base === extra || base.includes(extra)) {
    return base;
  }
  return `${base}\n\n${extra}`;
}

function escapeHeaderValue(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function getHeaderValue(headers, targetKey) {
  const target = String(targetKey || '').toLowerCase();
  for (const [key, value] of Object.entries(headers || {})) {
    if (String(key || '').toLowerCase() === target) {
      return value;
    }
  }
  return undefined;
}

function deriveImportedTitle(headers) {
  const event = normalizeHeaderText(getHeaderValue(headers, 'Event'));
  if (event && event !== '?') {
    return event;
  }
  const white = normalizeHeaderText(getHeaderValue(headers, 'White'));
  const black = normalizeHeaderText(getHeaderValue(headers, 'Black'));
  if (white && white !== '?' && black && black !== '?') {
    return `${white} vs ${black}`;
  }
  const opening = normalizeHeaderText(getHeaderValue(headers, 'Opening'));
  if (opening && opening !== '?') {
    return opening;
  }
  return '';
}

function resolveSetupFen(headers) {
  const setupValue = normalizeHeaderText(getHeaderValue(headers, 'SetUp'));
  const rawFen = normalizeHeaderText(getHeaderValue(headers, 'FEN'));
  if (setupValue === '1' && !rawFen) {
    throw new Error('PGN SetUp tag requires a FEN tag.');
  }
  if (!rawFen) {
    return DEFAULT_POSITION;
  }
  const validation = validateFen(rawFen);
  if (!validation.ok) {
    throw new Error(`PGN FEN tag is invalid: ${validation.error}`);
  }
  return new Chess(rawFen).fen();
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

function createAnalysisNodeId(tree) {
  let candidate = `n${tree.nodeCounter}`;
  while (tree.nodes[candidate]) {
    tree.nodeCounter += 1;
    candidate = `n${tree.nodeCounter}`;
  }
  tree.nodeCounter += 1;
  return candidate;
}

function getPreferredChildId(node, nodes) {
  if (!node || !Array.isArray(node.children) || !node.children.length) {
    return '';
  }
  if (node.selectedChildId && node.children.includes(node.selectedChildId) && nodes[node.selectedChildId]) {
    return node.selectedChildId;
  }
  return node.children.find((childId) => Boolean(nodes[childId])) || '';
}

function appendImportedVariationEntries(tree, parentId, parentFen, entries) {
  const list = Array.isArray(entries) ? entries : [];
  list.forEach((entry) => {
    appendImportedVariationEntry(tree, parentId, parentFen, entry);
  });
}

function appendImportedVariationEntry(tree, parentId, parentFen, entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const parentNode = tree.nodes[parentId];
  if (!parentNode) {
    throw new Error(`Missing parent node ${parentId} while importing PGN.`);
  }

  if (!entry.move) {
    if (entry.comment) {
      parentNode.comment = mergeCommentText(parentNode.comment, entry.comment);
    }
    appendImportedVariationEntries(tree, parentId, parentFen, entry.variations);
    return '';
  }

  const replay = new Chess(parentFen);
  let applied;
  try {
    applied = replay.move(entry.move, { strict: false });
  } catch {
    throw new Error(`Invalid move in PGN: ${entry.move}`);
  }

  const nodeId = createAnalysisNodeId(tree);
  const comment = normalizeCommentText(entry.comment).trim();
  tree.nodes[nodeId] = {
    id: nodeId,
    parentId,
    from: applied.from,
    to: applied.to,
    promotion: applied.promotion || undefined,
    san: applied.san,
    fen: replay.fen(),
    children: [],
    selectedChildId: null,
    comment,
  };
  parentNode.children.push(nodeId);
  if (!parentNode.selectedChildId) {
    parentNode.selectedChildId = nodeId;
  }

  appendImportedVariationEntries(tree, nodeId, replay.fen(), entry.variations);
  return nodeId;
}

function findSelectedLineEndId(tree) {
  let cursorId = tree.rootId;
  const seen = new Set();
  while (cursorId && !seen.has(cursorId)) {
    seen.add(cursorId);
    const node = tree.nodes[cursorId];
    if (!node) {
      break;
    }
    const nextId = getPreferredChildId(node, tree.nodes);
    if (!nextId) {
      break;
    }
    cursorId = nextId;
  }
  return cursorId || tree.rootId;
}

function parseFenMoveContext(fen) {
  const tokens = String(fen || '').trim().split(/\s+/);
  const activeColor = tokens[1] === 'b' ? 'b' : 'w';
  const fullmove = Math.max(1, Number.parseInt(tokens[5], 10) || 1);
  return { activeColor, fullmove };
}

function formatPgnMoveToken(parentFen, san, forceMoveNumber) {
  const { activeColor, fullmove } = parseFenMoveContext(parentFen);
  if (activeColor === 'w') {
    return `${fullmove}. ${san}`;
  }
  if (forceMoveNumber) {
    return `${fullmove}... ${san}`;
  }
  return san;
}

function buildVariationSequence(nodes, parentId, forcedChildId = '') {
  const parts = [];
  let currentParentId = parentId;
  let overrideChildId = forcedChildId;
  let forceMoveNumber = true;
  const seenParents = new Set();

  while (currentParentId && !seenParents.has(currentParentId)) {
    seenParents.add(currentParentId);
    const parentNode = nodes[currentParentId];
    if (!parentNode) {
      break;
    }

    const childId = overrideChildId || getPreferredChildId(parentNode, nodes);
    overrideChildId = '';
    if (!childId) {
      break;
    }

    const childNode = nodes[childId];
    if (!childNode) {
      break;
    }

    parts.push(formatPgnMoveToken(parentNode.fen, childNode.san, forceMoveNumber));
    const comment = sanitizeCommentForPgn(childNode.comment);
    if (comment) {
      parts.push(`{${comment}}`);
    }

    const siblingIds = parentNode.children.filter((id) => id !== childId && nodes[id]);
    siblingIds.forEach((siblingId) => {
      const variation = buildVariationSequence(nodes, parentNode.id, siblingId);
      if (variation) {
        parts.push(`(${variation})`);
      }
    });

    currentParentId = childId;
    forceMoveNumber = false;
  }

  return parts.join(' ');
}

function buildHeaderEntries(title, setupFen) {
  const event = normalizeHeaderText(title) || APP_SITE_NAME;
  const entries = [
    ['Event', event],
    ['Site', APP_SITE_NAME],
    ['Date', '????.??.??'],
    ['Round', '-'],
    ['White', '?'],
    ['Black', '?'],
    ['Result', DEFAULT_RESULT],
  ];
  if (setupFen !== DEFAULT_POSITION) {
    entries.push(['SetUp', '1']);
    entries.push(['FEN', setupFen]);
  }
  return entries;
}

export function parsePgnToLessonTree(pgnText) {
  const source = String(pgnText ?? '');
  if (!source.trim()) {
    throw new Error('PGN file is empty.');
  }

  let parsed;
  try {
    parsed = parsePgn(source);
  } catch (error) {
    throw new Error(error?.message ? `PGN is invalid: ${error.message}` : 'PGN is invalid.');
  }

  const headers = parsed?.headers && typeof parsed.headers === 'object' ? parsed.headers : {};
  const setupFen = resolveSetupFen(headers);
  const tree = createEmptyAnalysisTree(setupFen);
  tree.nodes[tree.rootId].comment = normalizeCommentText(parsed?.root?.comment).trim();
  appendImportedVariationEntries(tree, tree.rootId, setupFen, parsed?.root?.variations);
  tree.currentNodeId = findSelectedLineEndId(tree);

  return {
    title: deriveImportedTitle(headers),
    setupFen,
    headers,
    analysis: tree,
  };
}

export function buildPgnFromLessonTree({ title = '', setupFen = DEFAULT_POSITION, rootId = ROOT_NODE_ID, nodes = {} } = {}) {
  const normalizedFen = String(setupFen || '').trim() || DEFAULT_POSITION;
  const validation = validateFen(normalizedFen);
  if (!validation.ok) {
    throw new Error(`Cannot export PGN from an invalid setup FEN: ${validation.error}`);
  }

  const rootNode = nodes[rootId];
  if (!rootNode) {
    throw new Error('Cannot export PGN because the lesson root node is missing.');
  }
  if (String(rootNode.fen || '').trim() !== normalizedFen) {
    throw new Error('Cannot export PGN because the lesson root FEN does not match the setup FEN.');
  }

  const headerText = buildHeaderEntries(title, normalizedFen)
    .map(([key, value]) => `[${key} "${escapeHeaderValue(value)}"]`)
    .join('\n');

  const moveTextParts = [];
  const rootComment = sanitizeCommentForPgn(rootNode.comment);
  if (rootComment) {
    moveTextParts.push(`{${rootComment}}`);
  }

  const sequence = buildVariationSequence(nodes, rootId);
  if (sequence) {
    moveTextParts.push(sequence);
  }
  moveTextParts.push(DEFAULT_RESULT);

  return `${headerText}\n\n${moveTextParts.join(' ').trim()}`.trim();
}

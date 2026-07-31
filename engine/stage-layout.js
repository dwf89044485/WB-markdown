export const DEVICE_PRESETS = Object.freeze([
  Object.freeze({ id: 'phone', label: 'Phone', width: 393, height: 852 }),
  Object.freeze({ id: 'ipad-mini', label: 'iPad mini', width: 744, height: 1133 }),
  Object.freeze({ id: 'ipad-air', label: 'iPad Air', width: 840, height: 1190 }),
  Object.freeze({ id: 'ipad-pro', label: 'iPad Pro', width: 1024, height: 1366 }),
  Object.freeze({ id: 'android-expanded', label: 'Android Expanded', width: 1280, height: 800 }),
  Object.freeze({ id: 'surface-pro', label: 'Surface Pro', width: 1440, height: 960 }),
]);

const GRID_TARGET = 68;
const MIN_CELL = GRID_TARGET * 0.8;
const MAX_CELL = GRID_TARGET * 1.2;

export function resolveOrientedSize(preset, orientation, transientOrientation = null) {
  const resolvedOrientation = transientOrientation ?? orientation;
  if (resolvedOrientation !== 'portrait' && resolvedOrientation !== 'landscape') {
    throw new RangeError(`Unsupported orientation: ${resolvedOrientation}`);
  }

  const short = Math.min(preset.width, preset.height);
  const long = Math.max(preset.width, preset.height);
  return resolvedOrientation === 'portrait'
    ? { width: short, height: long }
    : { width: long, height: short };
}

function compareGridCandidates(a, b, width, height) {
  const fields = [
    'score',
    'aspectPenalty',
    'densityPenalty',
    'squareness',
    'cellTargetDistance',
    'cellCount',
    'shortAxisCount',
    'longAxisCount',
  ];

  for (const field of fields) {
    if (a[field] !== b[field]) return a[field] - b[field];
  }

  const aWidthAxisCount = width <= height ? a.shortAxisCount : a.longAxisCount;
  const bWidthAxisCount = width <= height ? b.shortAxisCount : b.longAxisCount;
  return aWidthAxisCount - bWidthAxisCount;
}

function resolveAxisCountCandidates(size) {
  const minimum = Math.max(1, Math.ceil(size / MAX_CELL));
  const maximum = Math.floor(size / MIN_CELL);
  if (minimum <= maximum) {
    return Array.from({ length: maximum - minimum + 1 }, (_, index) => minimum + index);
  }

  return [...new Set([
    Math.max(1, Math.floor(size / GRID_TARGET)),
    Math.max(1, Math.ceil(size / GRID_TARGET)),
  ])];
}

export function chooseIntegerGrid(width, height) {
  const colsCandidates = resolveAxisCountCandidates(width);
  const rowsCandidates = resolveAxisCountCandidates(height);
  let best = null;

  for (const cols of colsCandidates) {
    const cellW = width / cols;
    for (const rows of rowsCandidates) {
      const cellH = height / rows;
      const aspectPenalty = Math.log(Math.max(cellW, cellH) / Math.min(cellW, cellH));
      const densityPenalty = Math.abs(Math.log(Math.sqrt(cellW * cellH) / GRID_TARGET));
      const candidate = {
        cols,
        rows,
        cellW,
        cellH,
        aspectPenalty,
        densityPenalty,
        score: 4 * aspectPenalty + densityPenalty,
        squareness: Math.abs(cellW - cellH),
        cellTargetDistance: Math.abs(Math.sqrt(cellW * cellH) - GRID_TARGET),
        cellCount: cols * rows,
        shortAxisCount: width <= height ? cols : rows,
        longAxisCount: width <= height ? rows : cols,
      };

      if (!best || compareGridCandidates(candidate, best, width, height) < 0) {
        best = candidate;
      }
    }
  }

  return {
    cols: best.cols,
    rows: best.rows,
    cellW: best.cellW,
    cellH: best.cellH,
    aspectPenalty: best.aspectPenalty,
    densityPenalty: best.densityPenalty,
    score: best.score,
  };
}

export function buildGridModel(geometry) {
  const verticalXs = Array.from(
    { length: geometry.cols + 3 },
    (_, index) => {
      const gridIndex = index - 1;
      if (gridIndex === -1) return 0;
      if (gridIndex === 0) return geometry.shellLeft;
      if (gridIndex === geometry.cols) return geometry.shellRight;
      if (gridIndex === geometry.cols + 1) return geometry.leftAreaW;
      return geometry.shellLeft + gridIndex * geometry.cellW;
    },
  );

  const firstRow = Math.min(0, Math.ceil(-geometry.shellTop / geometry.cellH));
  const lastRow = Math.max(
    geometry.rows,
    Math.floor((geometry.stageH - geometry.shellTop) / geometry.cellH),
  );
  const horizontalYs = Array.from(
    { length: lastRow - firstRow + 1 },
    (_, index) => {
      const gridIndex = firstRow + index;
      if (gridIndex === 0) return geometry.shellTop;
      if (gridIndex === geometry.rows) return geometry.shellTop + geometry.displayH;
      return geometry.shellTop + gridIndex * geometry.cellH;
    },
  );

  return {
    verticalXs,
    horizontalYs,
    shellTop: geometry.shellTop,
    shellBottom: geometry.shellTop + geometry.displayH,
    shellLeft: geometry.shellLeft,
    shellRight: geometry.shellRight,
  };
}

export function computeStageGeometry({
  preset,
  userOrientation,
  transientOrientation = null,
  viewportW,
  viewportH,
  toggleH = 0,
  controlsExpandedH = 0,
  userExpanded = true,
  allowAutoCollapse = true,
  previousAutoCollapsed = false,
  forceStandalone = false,
  forceDesktop = false,
}) {
  if (!Number.isFinite(controlsExpandedH) || controlsExpandedH < 0) {
    throw new RangeError('controlsExpandedH must be finite and non-negative');
  }

  const orientation = transientOrientation ?? userOrientation;
  const { width: logicalW, height: logicalH } = resolveOrientedSize(preset, orientation);
  const expandedStageViewportH = Math.max(0, viewportH - toggleH - controlsExpandedH);
  const expandedUsableH = Math.max(1, expandedStageViewportH - 24);
  const expandedScale = Math.min(1, expandedUsableH / logicalH);
  const collapseThreshold = previousAutoCollapsed ? 0.9 : 0.85;
  let autoCollapsed = false;
  if (userExpanded) {
    autoCollapsed = allowAutoCollapse
      ? expandedScale < collapseThreshold
      : previousAutoCollapsed;
  }
  const controlsExpanded = Boolean(userExpanded && !autoCollapsed);
  const effectiveControlsH = controlsExpanded ? controlsExpandedH : 0;
  const stageViewportH = Math.max(0, viewportH - toggleH - effectiveControlsH);
  const usableH = Math.max(1, stageViewportH - 24);
  const scale = Math.min(1, usableH / logicalH);
  const displayW = logicalW * scale;
  const displayH = logicalH * scale;
  const shellTop = (stageViewportH - displayH) / 2;
  const grid = chooseIntegerGrid(displayW, displayH);
  const cellW = grid.cellW;
  const cellH = grid.cellH;
  const leftAreaW = displayW + 2 * cellW;
  const layoutMinW = Math.max(1440, leftAreaW + 884);

  return {
    orientation,
    logicalW,
    logicalH,
    stageViewportH,
    shellTop,
    usableH,
    expandedScale,
    autoCollapsed,
    controlsExpanded,
    effectiveControlsH,
    scale,
    displayW,
    displayH,
    cols: grid.cols,
    rows: grid.rows,
    cellW,
    cellH,
    leftAreaW,
    layoutMinW,
    stageW: Math.max(viewportW, layoutMinW),
    stageH: viewportH,
    shellLeft: cellW,
    shellRight: cellW + displayW,
    stageStandalone: forceStandalone || (!forceDesktop && viewportW <= 599),
    viewportFullscreen: !forceDesktop && viewportW <= 900,
  };
}

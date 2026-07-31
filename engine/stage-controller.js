import {
  DEVICE_PRESETS,
  buildGridModel,
  computeStageGeometry,
} from './stage-layout.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PRESET_ALIASES = Object.freeze({
  'ipad-air-11': 'ipad-air',
  'ipad-pro-129': 'ipad-pro',
  'surface-pro-8': 'surface-pro',
});

const root = document.documentElement;
const controls = document.querySelector('.demo-controls');
const toggle = document.getElementById('dcToggle');
const shell = document.querySelector('.phone-shell');
const phoneButton = document.getElementById('ctrlDevicePhone');
const padButton = document.getElementById('ctrlDevicePad');
const orientationButton = document.getElementById('ctrlOrientation');
const presetSelect = document.getElementById('ctrlPadResolution');
const gridSvg = document.querySelector('.grid-overlay');
const cornerSvg = document.querySelector('.corner-boxes');

const state = {
  device: 'phone',
  presetId: 'phone',
  userOrientation: 'portrait',
  transientOwner: null,
  transientOrientation: null,
  userExpanded: controls?.classList.contains('is-expanded') ?? true,
  autoCollapsed: false,
};

let controlsExpandedH = 0;
let currentGeometry = null;
let refreshFrame = 0;
let scheduledAllowAutoCollapse = false;

function presetFor(id) {
  const resolvedId = PRESET_ALIASES[id] ?? id;
  return DEVICE_PRESETS.find((preset) => preset.id === resolvedId) ?? DEVICE_PRESETS[0];
}

function readControlsExpandedHeight(forceMeasure = false) {
  if (!controls) return 0;

  const isExpanded = controls.classList.contains('is-expanded');
  if (!isExpanded && !forceMeasure) return controlsExpandedH;

  if (!isExpanded) {
    controls.classList.add('is-measuring', 'is-expanded');
  }

  const styles = getComputedStyle(controls);
  const borderH = (Number.parseFloat(styles.borderTopWidth) || 0)
    + (Number.parseFloat(styles.borderBottomWidth) || 0);
  controlsExpandedH = controls.scrollHeight + borderH;

  if (!isExpanded) {
    controls.classList.remove('is-expanded', 'is-measuring');
  }

  return controlsExpandedH;
}

function readToggleHeight() {
  if (!toggle || !toggle.offsetHeight) return 0;
  const controlsMarginTop = controls
    ? Number.parseFloat(getComputedStyle(controls).marginTop) || 0
    : 0;
  return Math.max(0, toggle.offsetHeight + controlsMarginTop);
}

function createLine(x1, y1, x2, y2, color, dashed = false) {
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(x1));
  line.setAttribute('y1', String(y1));
  line.setAttribute('x2', String(x2));
  line.setAttribute('y2', String(y2));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', '1');
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  if (dashed) line.setAttribute('stroke-dasharray', '8 8');
  return line;
}

function configureSvg(svg, geometry) {
  svg.setAttribute('width', String(geometry.stageW));
  svg.setAttribute('height', String(geometry.stageH));
  svg.setAttribute('viewBox', `0 0 ${geometry.stageW} ${geometry.stageH}`);
  svg.setAttribute('preserveAspectRatio', 'none');
}

export function renderGrid(geometry) {
  if (!gridSvg || !cornerSvg) return;

  const styles = getComputedStyle(root);
  const lineColor = styles.getPropertyValue('--color-grid-line').trim() || '#BBBAB0';
  const tileColor = styles.getPropertyValue('--color-grid-tile').trim() || '#F8F6F1';
  const gridFragment = document.createDocumentFragment();
  const cornerFragment = document.createDocumentFragment();

  configureSvg(gridSvg, geometry);
  configureSvg(cornerSvg, geometry);

  const model = buildGridModel(geometry);
  for (const x of model.verticalXs) {
    gridFragment.append(createLine(x, 0, x, geometry.stageH, lineColor, true));
  }
  for (const y of model.horizontalYs) {
    gridFragment.append(createLine(0, y, geometry.leftAreaW, y, lineColor, true));
  }

  cornerFragment.append(
    createLine(model.shellLeft, model.shellTop, model.shellRight, model.shellTop, lineColor),
    createLine(model.shellLeft, model.shellBottom, model.shellRight, model.shellBottom, lineColor),
    createLine(model.shellLeft, model.shellTop, model.shellLeft, model.shellBottom, lineColor),
    createLine(model.shellRight, model.shellTop, model.shellRight, model.shellBottom, lineColor),
  );

  const corners = [
    [model.shellLeft, model.shellTop],
    [model.shellRight, model.shellTop],
    [model.shellLeft, model.shellBottom],
    [model.shellRight, model.shellBottom],
  ];
  for (const [x, y] of corners) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - 5));
    rect.setAttribute('y', String(y - 5));
    rect.setAttribute('width', '10');
    rect.setAttribute('height', '10');
    rect.setAttribute('fill', tileColor);
    rect.setAttribute('stroke', lineColor);
    rect.setAttribute('stroke-width', '1');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    cornerFragment.append(rect);
  }

  gridSvg.replaceChildren(gridFragment);
  cornerSvg.replaceChildren(cornerFragment);
}

function writeLayout(geometry) {
  const values = {
    '--stage-logical-w': `${geometry.logicalW}px`,
    '--stage-logical-h': `${geometry.logicalH}px`,
    '--stage-display-w': `${geometry.displayW}px`,
    '--stage-display-h': `${geometry.displayH}px`,
    '--stage-scale': String(geometry.scale),
    '--stage-left-area-w': `${geometry.leftAreaW}px`,
    '--stage-layout-min-w': `${geometry.layoutMinW}px`,
    '--layout-shell-w': `${geometry.logicalW}px`,
    '--layout-shell-h': `${geometry.logicalH}px`,
  };

  for (const [name, value] of Object.entries(values)) {
    root.style.setProperty(name, value);
  }

  root.classList.toggle('device-pad', state.device === 'pad');
  root.dataset.stageOrientation = geometry.orientation;
  if (state.transientOwner) {
    root.dataset.stageTransientOwner = state.transientOwner;
    root.dataset.stageTransientOrientation = state.transientOrientation;
  } else {
    delete root.dataset.stageTransientOwner;
    delete root.dataset.stageTransientOrientation;
  }
  phoneButton?.classList.toggle('is-active', state.device === 'phone');
  padButton?.classList.toggle('is-active', state.device === 'pad');
  shell?.classList.toggle('phone-landscape', geometry.orientation === 'landscape');

  controls?.classList.toggle('is-expanded', geometry.controlsExpanded);
  const controlsCollapsed = !geometry.controlsExpanded;
  toggle?.classList.toggle('is-collapsed', controlsCollapsed);
  toggle?.setAttribute('aria-label', controlsCollapsed ? '展开控制面板' : '收起控制面板');
  toggle?.setAttribute('title', controlsCollapsed ? '展开控制面板' : '收起控制面板');

  if (orientationButton) {
    const nextOrientation = geometry.orientation === 'portrait' ? '横屏' : '竖屏';
    const label = orientationButton.querySelector('span');
    if (label) label.textContent = nextOrientation;
    orientationButton.setAttribute('aria-label', `切换为${nextOrientation}`);
  }
}

export function refresh({ allowAutoCollapse = false, remeasureControls = false } = {}) {
  const measuredControlsH = readControlsExpandedHeight(remeasureControls);
  const geometry = computeStageGeometry({
    preset: presetFor(state.presetId),
    userOrientation: state.userOrientation,
    transientOrientation: state.transientOrientation,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    toggleH: readToggleHeight(),
    controlsExpandedH: measuredControlsH,
    userExpanded: state.userExpanded,
    allowAutoCollapse,
    previousAutoCollapsed: state.autoCollapsed,
    forceStandalone: root.classList.contains('force-standalone')
      || root.classList.contains('is-standalone'),
    forceDesktop: root.classList.contains('force-desktop'),
  });

  state.autoCollapsed = geometry.autoCollapsed;
  currentGeometry = geometry;
  writeLayout(geometry);
  renderGrid(geometry);
  return geometry;
}

export function enterStageTransient(owner, orientation) {
  if (typeof owner !== 'string' || !owner) {
    throw new TypeError('Stage transient owner must be a non-empty string');
  }
  if (orientation !== 'portrait' && orientation !== 'landscape') {
    throw new RangeError(`Unsupported stage transient orientation: ${orientation}`);
  }
  if (state.transientOwner === owner && state.transientOrientation === orientation) {
    return false;
  }

  state.transientOwner = owner;
  state.transientOrientation = orientation;
  refresh({ allowAutoCollapse: true });
  return true;
}

export function exitStageTransient(owner) {
  if (state.transientOwner !== owner) return false;

  state.transientOwner = null;
  state.transientOrientation = null;
  refresh({ allowAutoCollapse: true });
  return true;
}

export function scheduleRefresh({ allowAutoCollapse = false } = {}) {
  scheduledAllowAutoCollapse ||= allowAutoCollapse;
  if (refreshFrame) return;
  refreshFrame = requestAnimationFrame(() => {
    refreshFrame = 0;
    const nextAllowAutoCollapse = scheduledAllowAutoCollapse;
    scheduledAllowAutoCollapse = false;
    refresh({ allowAutoCollapse: nextAllowAutoCollapse });
  });
}

phoneButton?.addEventListener('click', () => {
  state.device = 'phone';
  state.presetId = 'phone';
  state.userOrientation = 'portrait';
  refresh({ allowAutoCollapse: true });
});

padButton?.addEventListener('click', () => {
  state.device = 'pad';
  state.presetId = presetSelect?.value || 'ipad-air-11';
  state.userOrientation = 'landscape';
  refresh({ allowAutoCollapse: true });
});

presetSelect?.addEventListener('change', () => {
  if (state.device !== 'pad') return;
  state.presetId = presetSelect.value;
  refresh({ allowAutoCollapse: true });
});

orientationButton?.addEventListener('click', () => {
  state.userOrientation = state.userOrientation === 'portrait' ? 'landscape' : 'portrait';
  refresh({ allowAutoCollapse: true });
});

toggle?.addEventListener('click', () => {
  const controlsAreExpanded = currentGeometry?.controlsExpanded ?? state.userExpanded;
  state.userExpanded = !controlsAreExpanded;
  state.autoCollapsed = false;
  refresh({
    allowAutoCollapse: false,
    remeasureControls: state.userExpanded,
  });
});

window.addEventListener('resize', () => scheduleRefresh({ allowAutoCollapse: true }));
window.addEventListener('wb:themechange', () => {
  if (currentGeometry) renderGrid(currentGeometry);
});

refresh({ allowAutoCollapse: true });

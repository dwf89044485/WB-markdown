import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  DEVICE_PRESETS,
  chooseIntegerGrid,
  computeStageGeometry,
  resolveOrientedSize,
} from '../engine/stage-layout.js';

const EXPECTED_PRESETS = [
  ['phone', 'Phone', 393, 852],
  ['ipad-mini', 'iPad mini', 744, 1133],
  ['ipad-air', 'iPad Air', 840, 1190],
  ['ipad-pro', 'iPad Pro', 1024, 1366],
  ['android-expanded', 'Android Expanded', 1280, 800],
  ['surface-pro', 'Surface Pro', 1440, 960],
];

const presetById = (id) => DEVICE_PRESETS.find((preset) => preset.id === id);

function nextDown(value) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setFloat64(0, value);
  view.setBigUint64(0, view.getBigUint64(0) - 1n);
  return view.getFloat64(0);
}

function geometryFor(preset, orientation, overrides = {}) {
  return computeStageGeometry({
    preset,
    userOrientation: orientation,
    viewportW: 1600,
    viewportH: 2000,
    toggleH: 40,
    controlsExpandedH: 120,
    userExpanded: true,
    allowAutoCollapse: false,
    previousAutoCollapsed: false,
    ...overrides,
  });
}

test('exports the six device presets with exact native dimensions', () => {
  assert.deepEqual(
    DEVICE_PRESETS.map(({ id, label, width, height }) => [id, label, width, height]),
    EXPECTED_PRESETS,
  );
});

test('normalizes all six presets into semantic portrait and landscape sizes', () => {
  for (const [id, , nativeW, nativeH] of EXPECTED_PRESETS) {
    const preset = presetById(id);
    const short = Math.min(nativeW, nativeH);
    const long = Math.max(nativeW, nativeH);

    assert.deepEqual(resolveOrientedSize(preset, 'portrait'), { width: short, height: long });
    assert.deepEqual(resolveOrientedSize(preset, 'landscape'), { width: long, height: short });
  }
});

test('keeps native-landscape presets semantically correct instead of blindly rotating them', () => {
  assert.deepEqual(resolveOrientedSize(presetById('android-expanded'), 'portrait'), {
    width: 800,
    height: 1280,
  });
  assert.deepEqual(resolveOrientedSize(presetById('surface-pro'), 'landscape'), {
    width: 1440,
    height: 960,
  });
});

test('uses transient orientation without mutating user orientation', () => {
  const options = {
    preset: presetById('phone'),
    userOrientation: 'landscape',
    transientOrientation: 'portrait',
    viewportW: 1600,
    viewportH: 2000,
    toggleH: 0,
    controlsExpandedH: 0,
    userExpanded: true,
    allowAutoCollapse: false,
    previousAutoCollapsed: false,
  };

  const geometry = computeStageGeometry(options);

  assert.equal(geometry.orientation, 'portrait');
  assert.equal(geometry.logicalW, 393);
  assert.equal(geometry.logicalH, 852);
  assert.equal(options.userOrientation, 'landscape');
  assert.equal(options.transientOrientation, 'portrait');
});

test('chooses the known scale=1 grids', () => {
  const cases = [
    ['phone', 'portrait', 6, 13, 65.5, 852 / 13],
    ['ipad-air', 'portrait', 12, 17, 70, 70],
    ['android-expanded', 'portrait', 12, 19, 800 / 12, 1280 / 19],
    ['surface-pro', 'portrait', 14, 21, 960 / 14, 1440 / 21],
  ];

  for (const [id, orientation, cols, rows, cellW, cellH] of cases) {
    const geometry = geometryFor(presetById(id), orientation);
    assert.equal(geometry.scale, 1);
    assert.equal(geometry.cols, cols);
    assert.equal(geometry.rows, rows);
    assert.equal(geometry.cellW, cellW);
    assert.equal(geometry.cellH, cellH);
  }
});

test('keeps every scale=1 grid cell edge inside the legal range for all devices and orientations', () => {
  const minimum = 68 * 0.8;
  const maximum = 68 * 1.2;

  for (const preset of DEVICE_PRESETS) {
    for (const orientation of ['portrait', 'landscape']) {
      const geometry = geometryFor(preset, orientation);
      assert.ok(geometry.cellW >= minimum && geometry.cellW <= maximum);
      assert.ok(geometry.cellH >= minimum && geometry.cellH <= maximum);
    }
  }
});

test('strictly transposes integer grids when width and height rotate', () => {
  for (const preset of DEVICE_PRESETS) {
    const portrait = resolveOrientedSize(preset, 'portrait');
    const landscape = resolveOrientedSize(preset, 'landscape');
    const portraitGrid = chooseIntegerGrid(portrait.width, portrait.height);
    const landscapeGrid = chooseIntegerGrid(landscape.width, landscape.height);

    assert.equal(landscapeGrid.cols, portraitGrid.rows);
    assert.equal(landscapeGrid.rows, portraitGrid.cols);
    assert.equal(landscapeGrid.cellW, portraitGrid.cellH);
    assert.equal(landscapeGrid.cellH, portraitGrid.cellW);
  }
});

test('returns all geometry identities without rounding', () => {
  for (const preset of DEVICE_PRESETS) {
    for (const orientation of ['portrait', 'landscape']) {
      const geometry = geometryFor(preset, orientation);

      assert.equal(geometry.displayW, geometry.logicalW * geometry.scale);
      assert.equal(geometry.displayH, geometry.logicalH * geometry.scale);
      assert.equal(geometry.cellW, geometry.displayW / geometry.cols);
      assert.equal(geometry.cellH, geometry.displayH / geometry.rows);
      assert.equal(geometry.leftAreaW, geometry.displayW + 2 * geometry.cellW);
      assert.equal(geometry.layoutMinW, Math.max(1440, geometry.leftAreaW + 884));
      assert.equal(geometry.shellLeft, geometry.cellW);
      assert.equal(geometry.shellRight, geometry.cellW + geometry.displayW);
    }
  }
});

test('derives scale only from usable height and never from viewport width', () => {
  const options = {
    viewportW: 100,
    viewportH: 500,
    toggleH: 40,
    controlsExpandedH: 80,
  };
  const narrow = geometryFor(presetById('phone'), 'portrait', options);
  const wide = geometryFor(presetById('phone'), 'portrait', { ...options, viewportW: 4000 });
  const expectedScale = (500 - 40 - 80 - 24) / 852;

  assert.equal(narrow.usableH, 356);
  assert.equal(narrow.scale, expectedScale);
  assert.equal(narrow.scale, wide.scale);
  assert.equal(narrow.displayW, 393 * expectedScale);
  assert.equal(narrow.displayH, 356);
});

test('chooses the grid from the final scaled display size', () => {
  const geometry = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 500,
    toggleH: 40,
    controlsExpandedH: 80,
  });

  assert.equal(geometry.cols, 3);
  assert.equal(geometry.rows, 6);
  assert.equal(geometry.cellW, geometry.displayW / 3);
  assert.equal(geometry.cellH, geometry.displayH / 6);
  assert.ok(geometry.cellW >= 68 * 0.8 && geometry.cellW <= 68 * 1.2);
  assert.ok(geometry.cellH >= 68 * 0.8 && geometry.cellH <= 68 * 1.2);
});

test('uses final display dimensions for every regular scaled grid', () => {
  const cases = [
    [presetById('phone'), 'landscape', 400],
    [presetById('ipad-air'), 'portrait', 800],
    [presetById('android-expanded'), 'landscape', 650],
    [presetById('surface-pro'), 'portrait', 900],
  ];

  for (const [preset, orientation, viewportH] of cases) {
    const geometry = geometryFor(preset, orientation, {
      viewportH,
      toggleH: 40,
      controlsExpandedH: 80,
    });
    const expected = chooseIntegerGrid(geometry.displayW, geometry.displayH);

    assert.ok(geometry.scale < 1);
    assert.equal(geometry.cols, expected.cols);
    assert.equal(geometry.rows, expected.rows);
    assert.equal(geometry.cellW, expected.cellW);
    assert.equal(geometry.cellH, expected.cellH);
    assert.equal(geometry.cellW, geometry.displayW / geometry.cols);
    assert.equal(geometry.cellH, geometry.displayH / geometry.rows);
    assert.ok(geometry.cellW >= 68 * 0.8 && geometry.cellW <= 68 * 1.2);
    assert.ok(geometry.cellH >= 68 * 0.8 && geometry.cellH <= 68 * 1.2);
  }
});

test('falls back deterministically when an axis has no legal integer count', () => {
  const tiny = chooseIntegerGrid(20, 30);
  const narrow = chooseIntegerGrid(20, 200);
  const gap = chooseIntegerGrid(100, 200);
  const rotatedGap = chooseIntegerGrid(200, 100);
  const globalSquare = chooseIntegerGrid(82, 100);
  const rotatedGlobalSquare = chooseIntegerGrid(100, 82);
  const geometry = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 24 + (100 / 393) * 852,
    toggleH: 0,
    controlsExpandedH: 0,
  });

  assert.deepEqual(
    { cols: tiny.cols, rows: tiny.rows, cellW: tiny.cellW, cellH: tiny.cellH },
    { cols: 1, rows: 1, cellW: 20, cellH: 30 },
  );
  assert.equal(narrow.cols, 1);
  assert.equal(narrow.rows, 3);
  assert.equal(narrow.cellW, 20);
  assert.ok(narrow.cellH >= 68 * 0.8 && narrow.cellH <= 68 * 1.2);
  assert.deepEqual(
    { cols: gap.cols, rows: gap.rows, cellW: gap.cellW, cellH: gap.cellH },
    { cols: 2, rows: 3, cellW: 50, cellH: 200 / 3 },
  );
  assert.equal(rotatedGap.cols, gap.rows);
  assert.equal(rotatedGap.rows, gap.cols);
  assert.equal(rotatedGap.cellW, gap.cellH);
  assert.equal(rotatedGap.cellH, gap.cellW);
  assert.deepEqual(
    {
      cols: globalSquare.cols,
      rows: globalSquare.rows,
      cellW: globalSquare.cellW,
      cellH: globalSquare.cellH,
    },
    { cols: 1, rows: 1, cellW: 82, cellH: 100 },
  );
  assert.equal(rotatedGlobalSquare.cols, globalSquare.rows);
  assert.equal(rotatedGlobalSquare.rows, globalSquare.cols);
  assert.equal(rotatedGlobalSquare.cellW, globalSquare.cellH);
  assert.equal(rotatedGlobalSquare.cellH, globalSquare.cellW);
  assert.equal(geometry.displayW, 100);
  assert.deepEqual(
    { cols: geometry.cols, rows: geometry.rows },
    {
      cols: chooseIntegerGrid(geometry.displayW, geometry.displayH).cols,
      rows: chooseIntegerGrid(geometry.displayW, geometry.displayH).rows,
    },
  );
  assert.equal(geometry.cellW, geometry.displayW / geometry.cols);
  assert.equal(geometry.cellH, geometry.displayH / geometry.rows);
});

test('clamps usable height to 1 and scale to at most 1', () => {
  const constrained = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 20,
    toggleH: 40,
  });
  const unconstrained = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 5000,
  });

  assert.equal(constrained.usableH, 1);
  assert.equal(constrained.scale, 1 / 852);
  assert.equal(unconstrained.scale, 1);
});

test('auto-collapses below 0.85 expanded scale and recomputes final scale without expanded controls', () => {
  const geometry = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 900,
    toggleH: 40,
    controlsExpandedH: 200,
    allowAutoCollapse: true,
  });

  assert.equal(geometry.expandedScale, 636 / 852);
  assert.equal(geometry.autoCollapsed, true);
  assert.equal(geometry.controlsExpanded, false);
  assert.equal(geometry.effectiveControlsH, 0);
  assert.equal(geometry.scale, 836 / 852);
});

test('uses strict 0.85/0.90 hysteresis boundaries down to the previous float', () => {
  const preset = { width: 512, height: 1024 };
  const geometryAt = (expandedScale, previousAutoCollapsed) =>
    geometryFor(preset, 'portrait', {
      viewportH: 24 + expandedScale * 1024,
      toggleH: 0,
      controlsExpandedH: 0,
      allowAutoCollapse: true,
      previousAutoCollapsed,
    });

  const collapseBoundary = geometryAt(0.85, false);
  const justBelowCollapse = geometryAt(nextDown(0.85), false);
  const restoreBoundary = geometryAt(0.9, true);
  const justBelowRestore = geometryAt(nextDown(0.9), true);

  assert.equal(collapseBoundary.expandedScale, 0.85);
  assert.equal(collapseBoundary.autoCollapsed, false);
  assert.equal(justBelowCollapse.expandedScale, nextDown(0.85));
  assert.equal(justBelowCollapse.autoCollapsed, true);
  assert.equal(restoreBoundary.expandedScale, 0.9);
  assert.equal(restoreBoundary.autoCollapsed, false);
  assert.equal(justBelowRestore.expandedScale, nextDown(0.9));
  assert.equal(justBelowRestore.autoCollapsed, true);
});

test('keeps a stable expanded-controls height across repeated collapse decisions', () => {
  const controlsExpandedH = 120;
  const viewportAt = (expandedScale) => 40 + controlsExpandedH + 24 + expandedScale * 852;
  const run = (expandedScale, previousAutoCollapsed) =>
    geometryFor(presetById('phone'), 'portrait', {
      viewportH: viewportAt(expandedScale),
      toggleH: 40,
      controlsExpandedH,
      allowAutoCollapse: true,
      previousAutoCollapsed,
    });

  const collapsed = run(0.84, false);
  const stillCollapsed = run(0.86, collapsed.autoCollapsed);
  const nearlyRestored = run(0.899, stillCollapsed.autoCollapsed);
  const restored = run(0.9, nearlyRestored.autoCollapsed);
  const stableExpanded = run(0.9, restored.autoCollapsed);

  assert.equal(collapsed.autoCollapsed, true);
  assert.equal(collapsed.effectiveControlsH, 0);
  assert.equal(stillCollapsed.autoCollapsed, true);
  assert.equal(stillCollapsed.effectiveControlsH, 0);
  assert.equal(nearlyRestored.autoCollapsed, true);
  assert.equal(nearlyRestored.effectiveControlsH, 0);
  assert.equal(restored.autoCollapsed, false);
  assert.equal(restored.effectiveControlsH, controlsExpandedH);
  assert.equal(stableExpanded.autoCollapsed, false);
  assert.equal(stableExpanded.effectiveControlsH, controlsExpandedH);
});

test('requires controlsExpandedH to be finite and non-negative', () => {
  for (const controlsExpandedH of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(
      () => geometryFor(presetById('phone'), 'portrait', { controlsExpandedH }),
      RangeError,
    );
  }

  const geometry = computeStageGeometry({
    preset: presetById('phone'),
    userOrientation: 'portrait',
    viewportW: 1600,
    viewportH: 2000,
  });
  assert.equal(geometry.effectiveControlsH, 0);
  assert.equal('visibleControlsH' in geometry, false);
});

test('never auto-restores controls that the user explicitly collapsed', () => {
  const geometry = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 2000,
    userExpanded: false,
    allowAutoCollapse: true,
    previousAutoCollapsed: true,
  });

  assert.equal(geometry.autoCollapsed, false);
  assert.equal(geometry.controlsExpanded, false);
  assert.equal(geometry.effectiveControlsH, 0);
});

test('honors allowAutoCollapse=false even below the collapse threshold', () => {
  const geometry = geometryFor(presetById('phone'), 'portrait', {
    viewportH: 500,
    controlsExpandedH: 200,
    allowAutoCollapse: false,
  });

  assert.equal(geometry.autoCollapsed, false);
  assert.equal(geometry.controlsExpanded, true);
  assert.equal(geometry.effectiveControlsH, 200);
});

test('covers standalone and fullscreen breakpoints at exact boundaries', () => {
  const cases = [
    [599, true, true],
    [600, false, true],
    [900, false, true],
    [901, false, false],
  ];

  for (const [viewportW, stageStandalone, viewportFullscreen] of cases) {
    const geometry = geometryFor(presetById('phone'), 'portrait', { viewportW });
    assert.equal(geometry.stageStandalone, stageStandalone);
    assert.equal(geometry.viewportFullscreen, viewportFullscreen);
  }
});

test('applies force flags with forceStandalone taking precedence for stage mode', () => {
  const forcedDesktop = geometryFor(presetById('phone'), 'portrait', {
    viewportW: 599,
    forceDesktop: true,
  });
  const forcedStandalone = geometryFor(presetById('phone'), 'portrait', {
    viewportW: 901,
    forceStandalone: true,
  });
  const both = geometryFor(presetById('phone'), 'portrait', {
    viewportW: 599,
    forceDesktop: true,
    forceStandalone: true,
  });

  assert.equal(forcedDesktop.stageStandalone, false);
  assert.equal(forcedDesktop.viewportFullscreen, false);
  assert.equal(forcedStandalone.stageStandalone, true);
  assert.equal(forcedStandalone.viewportFullscreen, false);
  assert.equal(both.stageStandalone, true);
  assert.equal(both.viewportFullscreen, false);
});

test('stage layout module has no browser-global access', async () => {
  const source = await readFile(new URL('../engine/stage-layout.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:window|document)\b/);
});

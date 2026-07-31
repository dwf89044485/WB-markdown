import assert from 'node:assert/strict';
import test from 'node:test';

import { renderStaticTableFullscreen } from '../engine/table-fullscreen-view.js';

test('uses call-time global icons, escapes title, and prefers explicit icons', () => {
  const previousDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'WORKBUDDY_INLINE_ICONS',
  );

  try {
    globalThis.WORKBUDDY_INLINE_ICONS = {
      'image.svg': '<svg data-icon="global-image" fill="#123456"></svg>',
      'wb-share.svg': '<svg data-icon="global-share" stroke="black"></svg>',
    };

    const globalHtml = renderStaticTableFullscreen({
      title: '<Table & "Share">',
      bodyHtml: '<table></table>',
    });

    assert.match(globalHtml, /data-icon="global-image"/);
    assert.match(globalHtml, /data-icon="global-share"/);
    assert.match(globalHtml, /fill="currentColor"/);
    assert.match(globalHtml, /stroke="currentColor"/);
    assert.match(globalHtml, /&lt;Table &amp; &quot;Share&quot;&gt;/);

    const explicitHtml = renderStaticTableFullscreen({
      bodyHtml: '<table></table>',
      inlineIcons: {
        'image.svg': '<svg data-icon="explicit-image"></svg>',
        'wb-share.svg': '<svg data-icon="explicit-share"></svg>',
      },
    });

    assert.match(explicitHtml, /data-icon="explicit-image"/);
    assert.match(explicitHtml, /data-icon="explicit-share"/);
    assert.doesNotMatch(explicitHtml, /data-icon="global-(?:image|share)"/);
  } finally {
    if (previousDescriptor) {
      Object.defineProperty(globalThis, 'WORKBUDDY_INLINE_ICONS', previousDescriptor);
    } else {
      delete globalThis.WORKBUDDY_INLINE_ICONS;
    }
  }
});

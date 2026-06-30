<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>今日推荐</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Noto+Serif+SC:wght@400;600;700&family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
<style>
  :root {
    --parchment-base: oklch(91% 0.025 72);
    --parchment-light: oklch(94% 0.018 70);
    --parchment-edge: oklch(84% 0.03 65);
    --ink: oklch(17% 0.015 45);
    --ink-soft: oklch(30% 0.018 40);
    --gold: oklch(62% 0.12 72);
    --gold-bright: oklch(75% 0.11 78);
    --seal-red: oklch(42% 0.14 22);
    --rod: oklch(38% 0.06 35);
    --rod-dark: oklch(28% 0.07 30);
    --shadow-warm: oklch(12% 0.01 40 / 0.22);
    --shadow-deep: oklch(10% 0.01 35 / 0.35);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background:
      radial-gradient(ellipse at 25% 25%, oklch(20% 0.03 30) 0%, transparent 55%),
      radial-gradient(ellipse at 75% 75%, oklch(15% 0.02 25) 0%, transparent 50%),
      oklch(12% 0.01 25);
    font-family: 'Noto Serif SC', 'Georgia', 'Times New Roman', serif;
    padding: 32px 16px;
  }

  /* Subtle grain on background */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
  }

  .scene {
    position: relative;
    z-index: 1;
  }

  /* ── SCROLL CONTAINER ── */
  .scroll {
    position: relative;
    width: 420px;
    max-width: 94vw;
  }

  /* ── TOP ROD ── */
  .rod-top,
  .rod-bottom {
    position: relative;
    z-index: 2;
  }

  .rod-body {
    height: 18px;
    background: linear-gradient(
      180deg,
      oklch(45% 0.06 35) 0%,
      oklch(35% 0.07 30) 40%,
      oklch(42% 0.06 32) 60%,
      oklch(30% 0.08 28) 100%
    );
    border-radius: 9px;
    box-shadow:
      0 3px 8px oklch(10% 0.01 30 / 0.4),
      inset 0 1px 0 oklch(55% 0.04 38 / 0.4);
  }

  .rod-top .rod-body {
    margin-bottom: -4px;
    border-radius: 9px 9px 4px 4px;
  }

  .rod-bottom .rod-body {
    margin-top: -4px;
    border-radius: 4px 4px 9px 9px;
  }

  .rod-knob-left,
  .rod-knob-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 26px;
    background: linear-gradient(
      180deg,
      oklch(48% 0.07 38) 0%,
      oklch(32% 0.08 28) 50%,
      oklch(44% 0.07 35) 100%
    );
    border-radius: 6px;
    box-shadow:
      0 2px 4px oklch(10% 0.01 30 / 0.5),
      inset 0 1px 0 oklch(58% 0.05 40 / 0.35);
  }

  .rod-knob-left { left: -14px; }
  .rod-knob-right { right: -14px; }

  /* ── PARCHMENT BODY ── */
  .parchment {
    position: relative;
    background:
      /* Main parchment */
      linear-gradient(
        178deg,
        oklch(96% 0.015 70) 0%,
        oklch(92% 0.025 72) 15%,
        oklch(89% 0.028 68) 50%,
        oklch(93% 0.022 70) 85%,
        oklch(90% 0.026 65) 100%
      ),
      /* Darker edge burn on sides */
      radial-gradient(ellipse at 0% 50%, oklch(78% 0.03 55 / 0.5) 0%, transparent 8%),
      radial-gradient(ellipse at 100% 50%, oklch(78% 0.03 55 / 0.5) 0%, transparent 8%);
    border-left: 1px solid oklch(75% 0.025 55 / 0.4);
    border-right: 1px solid oklch(75% 0.025 55 / 0.4);
    box-shadow:
      inset 0 0 60px oklch(70% 0.03 50 / 0.12),
      0 8px 32px var(--shadow-warm),
      0 2px 6px var(--shadow-warm);
    padding: 36px 38px;
    overflow: hidden;
  }

  /* Parchment texture layers */
  .parchment::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      /* Fibers */
      repeating-linear-gradient(
        2deg,
        transparent,
        transparent 3px,
        oklch(60% 0.02 50 / 0.025) 3px,
        oklch(60% 0.02 50 / 0.025) 4px
      ),
      /* Irregular stains */
      radial-gradient(ellipse at 15% 30%, oklch(65% 0.04 55 / 0.06) 0%, transparent 35%),
      radial-gradient(ellipse at 80% 70%, oklch(60% 0.03 50 / 0.05) 0%, transparent 40%),
      radial-gradient(ellipse at 50% 85%, oklch(55% 0.02 45 / 0.04) 0%, transparent 30%),
      /* Noise texture */
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
  }

  /* Torn edge effect on top and bottom */
  .parchment::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    z-index: 2;
    pointer-events: none;
    height: 16px;
  }

  .parchment::after {
    bottom: 0;
    background: linear-gradient(
      180deg,
      transparent 0%,
      oklch(78% 0.035 55 / 0.55) 50%,
      oklch(72% 0.04 50 / 0.7) 100%
    );
  }

  /* Torn top edge via separate element */
  .torn-top {
    position: absolute;
    top: 0;
    left: -2px;
    right: -2px;
    height: 14px;
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      oklch(72% 0.04 50 / 0.7) 0%,
      oklch(78% 0.035 55 / 0.55) 50%,
      transparent 100%
    );
    clip-path: polygon(
      0% 100%, 3% 40%, 7% 75%, 12% 25%, 18% 60%, 22% 35%, 27% 70%,
      33% 20%, 38% 55%, 42% 30%, 48% 65%, 53% 15%, 58% 50%,
      63% 35%, 68% 70%, 73% 25%, 78% 55%, 83% 10%, 88% 45%,
      92% 60%, 96% 30%, 100% 50%, 100% 100%, 0% 100%
    );
  }

  /* ── CONTENT ZONE ── */
  .content {
    position: relative;
    z-index: 3;
  }

  /* Header */
  .header {
    text-align: center;
    margin-bottom: 28px;
  }

  .seal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 40% 35%, oklch(52% 0.16 22) 0%, oklch(38% 0.14 18) 60%, oklch(30% 0.12 15) 100%);
    box-shadow:
      0 3px 8px oklch(15% 0.01 10 / 0.35),
      inset 0 2px 0 oklch(62% 0.12 25 / 0.3);
    margin-bottom: 16px;
    position: relative;
  }

  .seal::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid oklch(62% 0.1 25 / 0.35);
    border-radius: 50%;
  }

  .seal span {
    font-family: 'Ma Shan Zheng', 'Noto Serif SC', serif;
    font-size: 1.35rem;
    color: oklch(88% 0.04 60);
    line-height: 1;
    transform: rotate(-8deg);
  }

  .ornament-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .ornament-row::before,
  .ornament-row::after {
    content: '';
    height: 1px;
    width: 60px;
    background: linear-gradient(
      90deg,
      transparent,
      oklch(68% 0.06 60 / 0.5) 40%,
      oklch(68% 0.06 60 / 0.5) 60%,
      transparent
    );
  }

  .ornament-icon {
    color: var(--gold);
    opacity: 0.7;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }

  h2 {
    font-family: 'Noto Serif SC', serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--ink);
    letter-spacing: 0.1em;
  }

  .subtitle {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 0.78rem;
    color: oklch(45% 0.02 40);
    letter-spacing: 0.15em;
    margin-top: 4px;
  }

  /* ── BOOK SECTION ── */
  .book-section {
    display: flex;
    gap: 20px;
    margin-bottom: 26px;
    align-items: stretch;
  }

  .book-spine-visual {
    width: 8px;
    flex-shrink: 0;
    background: linear-gradient(
      180deg,
      oklch(22% 0.07 10) 0%,
      oklch(18% 0.06 8) 100%
    );
    border-radius: 3px 0 0 3px;
    box-shadow: 1px 0 4px oklch(10% 0.01 10 / 0.25);
  }

  .book-cover-visual {
    flex: 1;
    background: linear-gradient(
      165deg,
      oklch(38% 0.11 14) 0%,
      oklch(30% 0.1 10) 35%,
      oklch(36% 0.12 13) 100%
    );
    border-radius: 0 3px 3px 0;
    padding: 22px 20px;
    position: relative;
    overflow: hidden;
    box-shadow:
      3px 3px 10px oklch(10% 0.01 10 / 0.25);
  }

  .book-cover-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 35% 25%, oklch(65% 0.1 55 / 0.1) 0%, transparent 55%),
      radial-gradient(ellipse at 70% 80%, oklch(55% 0.08 45 / 0.08) 0%, transparent 45%);
    border-radius: 0 3px 3px 0;
  }

  .book-cover-visual::after {
    content: '';
    position: absolute;
    top: 10px;
    right: 12px;
    width: 22px;
    height: 22px;
    border: 1.5px solid oklch(68% 0.06 55 / 0.3);
    border-radius: 50%;
  }

  .bk-content {
    position: relative;
    z-index: 1;
  }

  .bk-title-line {
    font-family: 'Noto Serif SC', serif;
    font-weight: 700;
    font-size: 1.15rem;
    color: oklch(90% 0.018 68);
    letter-spacing: 0.06em;
    line-height: 1.6;
    margin-bottom: 14px;
  }

  .bk-author {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: 0.82rem;
    color: oklch(80% 0.035 62);
    letter-spacing: 0.05em;
  }

  /* ── DIVIDER ── */
  .rule {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
  }

  .rule::before,
  .rule::after {
    content: '';
    flex: 1;
    height: 1px;
    background: oklch(70% 0.03 55 / 0.4);
  }

  .rule-diamond {
    width: 7px;
    height: 7px;
    background: var(--gold);
    transform: rotate(45deg);
    flex-shrink: 0;
    opacity: 0.55;
  }

  /* ── QUOTE ── */
  .quote-block {
    position: relative;
    padding: 6px 0 6px 20px;
    margin-bottom: 24px;
    border-left: 2px solid oklch(72% 0.05 58 / 0.35);
  }

  .quote-block p {
    font-size: 0.9rem;
    color: var(--ink-soft);
    line-height: 1.85;
    letter-spacing: 0.04em;
    font-style: italic;
  }

  .quote-mark {
    position: absolute;
    left: 4px;
    top: -4px;
    font-family: 'Playfair Display', serif;
    font-size: 2.2rem;
    color: var(--gold);
    opacity: 0.3;
    line-height: 1;
    pointer-events: none;
  }

  /* ── META ── */
  .meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 26px;
    padding: 10px 14px;
    background: oklch(88% 0.02 60 / 0.35);
    border: 1px solid oklch(78% 0.025 58 / 0.25);
  }

  .meta span {
    font-family: 'Playfair Display', serif;
    font-size: 0.78rem;
    color: oklch(42% 0.02 38);
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .meta-bullet {
    width: 6px;
    height: 6px;
    background: var(--seal-red);
    border-radius: 50%;
    opacity: 0.55;
    flex-shrink: 0;
  }

  /* ── BUTTON ── */
  .btn {
    display: block;
    width: 100%;
    padding: 13px 0;
    font-family: 'Noto Serif SC', serif;
    font-weight: 600;
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    color: oklch(94% 0.01 65);
    background: linear-gradient(
      175deg,
      oklch(35% 0.08 18) 0%,
      oklch(28% 0.09 15) 50%,
      oklch(36% 0.08 20) 100%
    );
    border: 1px solid oklch(42% 0.07 20 / 0.5);
    cursor: pointer;
    position: relative;
    transition:
      background 200ms cubic-bezier(0.25, 1, 0.5, 1),
      box-shadow 200ms cubic-bezier(0.25, 1, 0.5, 1),
      transform 180ms cubic-bezier(0.25, 1, 0.5, 1);
    box-shadow:
      0 2px 8px oklch(10% 0.01 10 / 0.3);
  }

  .btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: oklch(100% 0 0 / 0.08);
  }

  .btn:hover {
    background: linear-gradient(
      175deg,
      oklch(40% 0.09 18) 0%,
      oklch(33% 0.1 15) 50%,
      oklch(41% 0.09 20) 100%
    );
    box-shadow:
      0 4px 16px oklch(10% 0.01 10 / 0.4);
    transform: translateY(-1px);
  }

  .btn:active {
    transform: translateY(0);
    box-shadow:
      0 1px 3px oklch(10% 0.01 10 / 0.2);
  }

  .btn:focus-visible {
    outline: 2px solid var(--gold-bright);
    outline-offset: 3px;
  }

  /* ── FOOTER FLOURISH ── */
  .foot-note {
    text-align: center;
    margin-top: 14px;
    font-family: 'Playfair Display', serif;
    font-size: 0.72rem;
    color: oklch(58% 0.025 50 / 0.45);
    letter-spacing: 0.18em;
  }

  /* ── AMBIENT GLOW ── */
  .ambient-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 110%;
    height: 105%;
    background: radial-gradient(
      ellipse at center,
      oklch(62% 0.1 65 / 0.08) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
    border-radius: 50%;
    filter: blur(30px);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn { transition: none; }
  }
</style>
</head>
<body>
<div class="scene">
  <div class="ambient-glow"></div>

  <div class="scroll">

    <!-- Top Rod -->
    <div class="rod-top">
      <div class="rod-body">
        <div class="rod-knob-left"></div>
        <div class="rod-knob-right"></div>
      </div>
    </div>

    <!-- Parchment -->
    <div class="parchment">
      <div class="torn-top"></div>

      <div class="content">

        <!-- Header -->
        <div class="header">
          <div class="seal"><span>荐</span></div>
          <div class="ornament-row">
            <svg class="ornament-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="12" cy="12" r="9" stroke-dasharray="3 5"/>
            </svg>
          </div>
          <h2>今 日 推 荐</h2>
          <div class="subtitle">DAILY READING</div>
        </div>

        <!-- Book -->
        <div class="book-section">
          <div class="book-spine-visual"></div>
          <div class="book-cover-visual">
            <div class="bk-content">
              <div class="bk-title-line">人类群星<br>闪耀时</div>
              <div class="bk-author">斯蒂芬·茨威格</div>
            </div>
          </div>
        </div>

        <!-- Rule -->
        <div class="rule">
          <span class="rule-diamond"></span>
        </div>

        <!-- Quote -->
        <div class="quote-block">
          <span class="quote-mark">&ldquo;</span>
          <p>十四段决定世界命运的时刻，在历史的夜幕中如星辰般璀璨闪耀。</p>
        </div>

        <!-- Meta -->
        <div class="meta">
          <span><span class="meta-bullet"></span>传记文学</span>
          <span>1927 年初版</span>
        </div>

        <!-- CTA -->
        <button class="btn" onclick="alert('正在跳转至详情页...')">翻 开 书 页</button>

      </div>
    </div>

    <!-- Bottom Rod -->
    <div class="rod-bottom">
      <div class="rod-body">
        <div class="rod-knob-left"></div>
        <div class="rod-knob-right"></div>
      </div>
    </div>

  </div>

  <div class="foot-note">&#10087;  &#10087;  &#10087;</div>
</div>
</body>
</html>

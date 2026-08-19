import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 45678;
const CHROME_PATH = '/usr/bin/google-chrome';
const BUILD_DIR = path.resolve('./.output/chrome-mv3');
const ASSETS_DIR = path.resolve('./assets');
const POPUP_WIDTH = 380;
const POPUP_HEIGHT = 520;

const SCREENSHOTS = [
  {
    file: 'store-screenshot-1-default-1280x800.png',
    label: 'Screenshot 1 — Convert Timestamps Instantly',
    hero: 'Convert Timestamps Instantly',
    sub: 'Convert Unix timestamps and dates in seconds — right from your browser.',
    tag: 'Instant Conversion',
    tagColor: '#10b981',
    cards: [
      { label: 'Speed', val: '< 1s', color: '#10b981' },
      { label: 'Formats', val: 'Flexible', color: '#38bdf8' },
      { label: 'Access', val: 'Browser', color: '#f59e0b' },
    ],
    setup: null,
  },
  {
    file: 'store-screenshot-2-smart-1280x800.png',
    label: 'Screenshot 2 — Smart Timestamp Detection',
    hero: 'Smart Timestamp Detection',
    sub: 'Automatically recognize 10-digit seconds and 13-digit milliseconds.',
    tag: 'Auto-Detect',
    tagColor: '#38bdf8',
    cards: [
      { label: '10-Digit', val: 'Seconds', color: '#10b981' },
      { label: '13-Digit', val: 'Milliseconds', color: '#38bdf8' },
      { label: 'Detection', val: 'Automatic', color: '#f59e0b' },
    ],
    setup: { value: '1717113600', mode: 'timestamp' },
  },
  {
    file: 'store-screenshot-3-utc-local-1280x800.png',
    label: 'Screenshot 3 — UTC & Local Time, Side by Side',
    hero: 'UTC & Local Time, Side by Side',
    sub: 'Compare UTC and local time instantly when debugging across time zones.',
    tag: 'Dual Timezone',
    tagColor: '#a78bfa',
    cards: [
      { label: 'Local', val: 'Your Time', color: '#10b981' },
      { label: 'UTC', val: 'Global', color: '#38bdf8' },
      { label: 'Relative', val: 'Live', color: '#f43f5e' },
    ],
    setup: { value: '1717113600', mode: 'timestamp' },
  },
  {
    file: 'store-screenshot-4-anywhere-1280x800.png',
    label: 'Screenshot 4 — Convert Timestamps Anywhere',
    hero: 'Convert Timestamps Anywhere',
    sub: 'Select a timestamp on any webpage and convert it instantly.',
    tag: 'Context Menu',
    tagColor: '#f59e0b',
    cards: [
      { label: 'Action', val: 'Select', color: '#10b981' },
      { label: 'Target', val: 'Any Page', color: '#38bdf8' },
      { label: 'Result', val: 'Instant', color: '#f43f5e' },
    ],
    setup: null,
  },
  {
    file: 'store-screenshot-5-privacy-1280x800.png',
    label: 'Screenshot 5 — Fast, Private & Offline',
    hero: 'Fast, Private & Offline',
    sub: 'Everything runs locally in your browser. No data collection. No network requests.',
    tag: 'Privacy First',
    tagColor: '#f43f5e',
    cards: [
      { label: 'Data', val: 'Local Only', color: '#10b981' },
      { label: 'Network', val: 'None', color: '#38bdf8' },
      { label: 'Tracking', val: 'Zero', color: '#f59e0b' },
    ],
    setup: null,
  },
];

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

function createServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
  };

  return http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];

    if (reqUrl === '/stage') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(getStageHtml());
      return;
    }

    if (reqUrl === '/popup.html' || reqUrl === '/') {
      const popupPath = path.join(BUILD_DIR, 'popup.html');
      fs.readFile(popupPath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }
        const html = data.toString().replace(
          '<head>',
          '<head>\n<script>\n' + getChromeApiMock() + '\n</script>'
        );
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }

    let filePath = path.join(BUILD_DIR, reqUrl);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
}

function getChromeApiMock() {
  return `
    if (!window.chrome) window.chrome = {};
    if (!window.chrome.storage) {
      window.chrome.storage = {
        local: {
          get: function(keys, cb) {
            var result = {};
            var k = Array.isArray(keys) ? keys : (keys ? [keys] : []);
            k.forEach(function(key) {
              var raw = localStorage.getItem('cs:' + key);
              if (raw !== null) {
                try { result[key] = JSON.parse(raw); }
                catch(e) { result[key] = raw; }
              }
            });
            if (cb) cb(result);
            return Promise.resolve(result);
          },
          set: function(items, cb) {
            Object.keys(items).forEach(function(key) {
              localStorage.setItem('cs:' + key, JSON.stringify(items[key]));
            });
            if (cb) cb();
            return Promise.resolve();
          },
          remove: function(keys, cb) {
            var k = Array.isArray(keys) ? keys : (keys ? [keys] : []);
            k.forEach(function(key) { localStorage.removeItem('cs:' + key); });
            if (cb) cb();
            return Promise.resolve();
          },
          clear: function(cb) {
            var keys = [];
            for (var i = 0; i < localStorage.length; i++) {
              var key = localStorage.key(i);
              if (key && key.startsWith('cs:')) keys.push(key);
            }
            keys.forEach(function(k) { localStorage.removeItem(k); });
            if (cb) cb();
            return Promise.resolve();
          },
        },
        onChanged: {
          addListener: function() {},
          removeListener: function() {},
        },
      };
    }
  `;
}

function getStageHtml() {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>Epoch Pro - Store Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1280px;
      height: 800px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #020617;
      display: flex;
      flex-direction: column;
      user-select: none;
    }

    .browser-header {
      background: #1e222d;
      border-bottom: 1px solid #2d3343;
      display: flex;
      flex-direction: column;
      z-index: 10;
    }

    .title-bar {
      height: 38px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 12px;
    }

    .window-controls { display: flex; gap: 7px; margin-right: 8px; }
    .win-dot { width: 11px; height: 11px; border-radius: 50%; }
    .dot-red { background: #ff5f56; }
    .dot-yellow { background: #ffbd2e; }
    .dot-green { background: #27c93f; }

    .tab-bar { display: flex; align-items: flex-end; flex: 1; height: 100%; }

    .tab {
      background: #11141c;
      color: #e2e8f0;
      font-size: 11.5px;
      font-weight: 500;
      padding: 8px 14px;
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: 240px;
      border-top: 1px solid #2d3343;
      border-left: 1px solid #2d3343;
      border-right: 1px solid #2d3343;
    }

    .tab-favicon { width: 14px; height: 14px; border-radius: 2px; }
    .tab-close { color: #64748b; font-size: 13px; margin-left: auto; }

    .tab-inactive {
      background: transparent;
      color: #94a3b8;
      border: none;
      font-size: 11.5px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-bar {
      background: #11141c;
      height: 44px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 10px;
      border-bottom: 1px solid #232936;
    }

    .nav-btns { display: flex; gap: 12px; color: #64748b; font-size: 14px; }

    .omnibox {
      flex: 1;
      background: #1e222d;
      height: 28px;
      border-radius: 14px;
      border: 1px solid #2d3343;
      display: flex;
      align-items: center;
      padding: 0 12px;
      gap: 8px;
      font-size: 11.5px;
      color: #cbd5e1;
      max-width: 720px;
    }

    .lock-icon { color: #10b981; font-size: 10px; }

    .extensions-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      position: relative;
    }

    .ext-icon-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      cursor: pointer;
      position: relative;
    }

    .ext-icon-btn.active {
      background: #2d3343;
      box-shadow: 0 0 0 1px #10b981;
    }

    .browser-viewport {
      flex: 1;
      position: relative;
      background: radial-gradient(circle at 30% 30%, #172033 0%, #0b0f19 100%);
      display: flex;
      padding: 40px 60px;
    }

    .mock-webpage {
      flex: 1;
      background: rgba(18, 24, 38, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.07);
      border-radius: 16px;
      padding: 32px 40px;
      backdrop-filter: blur(12px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      display: flex;
      flex-direction: column;
      gap: 20px;
      filter: blur(1px) brightness(0.85);
    }

    .mock-tag {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .mock-hero-title {
      font-size: 26px;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.5px;
    }

    .mock-subtext {
      color: #94a3b8;
      font-size: 13px;
      max-width: 480px;
      line-height: 1.6;
    }

    .mock-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 10px;
      max-width: 580px;
    }

    .mock-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
    }

    .mock-card-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .mock-card-val { font-size: 20px; font-weight: 700; margin-top: 4px; }

    .popup-wrapper {
      position: absolute;
      top: 10px;
      right: 28px;
      width: ${POPUP_WIDTH}px;
      box-shadow: 0 25px 60px -10px rgba(0, 0, 0, 0.8),
                  0 0 20px rgba(16, 185, 129, 0.12);
      background: #020617;
      z-index: 99;
      overflow: hidden;
      border-radius: 16px;
    }

    .popup-caret {
      position: absolute;
      top: 2px;
      right: 76px;
      width: 14px;
      height: 14px;
      background: #0f172a;
      border-top: 1px solid rgba(16, 185, 129, 0.4);
      border-left: 1px solid rgba(16, 185, 129, 0.4);
      transform: rotate(45deg);
      z-index: 100;
    }

    iframe {
      width: ${POPUP_WIDTH}px;
      border: none;
      display: block;
      height: auto;
    }

    @keyframes dropDown {
      from { opacity: 0; transform: translateY(-12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="browser-header">
    <div class="title-bar">
      <div class="window-controls">
        <div class="win-dot dot-red"></div>
        <div class="win-dot dot-yellow"></div>
        <div class="win-dot dot-green"></div>
      </div>
      <div class="tab-bar">
        <div class="tab">
          <img src="/icon/32.png" class="tab-favicon" alt="Epoch Pro" />
          <span>Unix Timestamp Converter & Epoch Pro</span>
          <span class="tab-close">×</span>
        </div>
        <div class="tab-inactive">
          <span>github.com - Developer Tools</span>
        </div>
      </div>
    </div>

    <div class="nav-bar">
      <div class="nav-btns">
        <span>←</span>
        <span>→</span>
        <span>↻</span>
      </div>
      <div class="omnibox">
        <span class="lock-icon">🔒</span>
        <span>chrome-extension://epochpro/popup.html</span>
      </div>
      <div class="extensions-bar">
        <div class="ext-icon-btn active" id="epochpro-btn">
          <img src="/icon/32.png" width="18" height="18" alt="Epoch Pro" />
        </div>
        <div class="ext-icon-btn">
          <span style="color: #64748b; font-size: 13px;">🧩</span>
        </div>
      </div>
    </div>
  </div>

  <div class="browser-viewport">
    <div class="mock-webpage" id="mock-webpage">
      <div>
        <div class="mock-tag" id="mock-tag" style="color: #10b981;">Timestamp Conversion</div>
        <h1 class="mock-hero-title" id="mock-hero">Instantly Convert Unix Timestamps</h1>
        <p class="mock-subtext" id="mock-sub">Transform Unix timestamps into readable dates with a single click.</p>
      </div>

      <div class="mock-cards-grid" id="mock-cards">
        <div class="mock-card">
          <div class="mock-card-label">10-Digit</div>
          <div class="mock-card-val" style="color: #10b981;">Seconds</div>
        </div>
        <div class="mock-card">
          <div class="mock-card-label">13-Digit</div>
          <div class="mock-card-val" style="color: #38bdf8;">Milliseconds</div>
        </div>
        <div class="mock-card">
          <div class="mock-card-label">Auto-Detect</div>
          <div class="mock-card-val" style="color: #f59e0b;">Smart</div>
        </div>
      </div>
    </div>

    <div class="popup-caret"></div>

    <div class="popup-wrapper">
      <iframe id="extension-frame" src="/popup.html?mode=standalone"></iframe>
    </div>
  </div>

  <script>
    window.__updateStage = function({ hero, sub, tag, tagColor, cards }) {
      if (hero) document.getElementById('mock-hero').textContent = hero;
      if (sub) document.getElementById('mock-sub').textContent = sub;
      if (tag) {
        const el = document.getElementById('mock-tag');
        el.textContent = tag;
        el.style.color = tagColor || '#10b981';
      }
      if (cards) {
        const container = document.getElementById('mock-cards');
        container.innerHTML = cards.map(c =>
          '<div class="mock-card">' +
            '<div class="mock-card-label">' + c.label + '</div>' +
            '<div class="mock-card-val" style="color:' + c.color + ';">' + c.val + '</div>' +
          '</div>'
        ).join('');
      }
    };

    window.__resizeIframe = function() {
      var iframe = document.getElementById('extension-frame');
      if (!iframe || !iframe.contentDocument) return 0;
      var doc = iframe.contentDocument;
      var inner = doc.querySelector('.w-\\\\[380px\\\\]') || doc.querySelector('[class*="w-[380px]"]');
      if (!inner) {
        var allDivs = doc.querySelectorAll('div');
        for (var i = 0; i < allDivs.length; i++) {
          if (allDivs[i].offsetWidth >= 370 && allDivs[i].offsetWidth <= 400 && allDivs[i].offsetHeight > 100) {
            inner = allDivs[i];
            break;
          }
        }
      }
      var h = inner ? inner.offsetHeight + 2 : doc.body.scrollHeight;
      iframe.style.height = h + 'px';
      var wrapper = document.querySelector('.popup-wrapper');
      if (wrapper) {
        wrapper.style.height = h + 'px';
      }
      return h;
    };

    window.__setInput = function(value) {
      var iframe = document.getElementById('extension-frame');
      if (!iframe || !iframe.contentDocument) return false;
      var input = iframe.contentDocument.querySelector('input[type="text"]');
      if (!input) return false;

      var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };

    window.__clickMode = function(mode) {
      var iframe = document.getElementById('extension-frame');
      if (!iframe || !iframe.contentDocument) return false;
      var buttons = iframe.contentDocument.querySelectorAll('button');
      for (var btn of buttons) {
        if (btn.textContent && btn.textContent.includes(mode === 'timestamp' ? 'Timestamp' : 'Date')) {
          btn.click();
          return true;
        }
      }
      return false;
    };
  </script>
</body>
</html>
  `;
}

async function updateStage(page, cfg) {
  await page.evaluate((c) => window.__updateStage(c), {
    hero: cfg.hero,
    sub: cfg.sub,
    tag: cfg.tag,
    tagColor: cfg.tagColor,
    cards: cfg.cards,
  });
}

async function setInputValue(page, value) {
  await page.evaluate((v) => window.__setInput(v), value);
}

async function clickMode(page, mode) {
  await page.evaluate((m) => window.__clickMode(m), mode);
}

async function waitForFrameReady(page) {
  await page.waitForSelector('iframe', { timeout: 8000 });
  const frameElement = await page.$('iframe');
  const frame = await frameElement.contentFrame();
  await frame.waitForSelector('button', { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 800));
  await page.evaluate(() => window.__resizeIframe());
}

async function captureScreenshots() {
  console.log('Starting local HTTP server...');
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Server running at http://localhost:${PORT}`);
  
  console.log('Launching Headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1280,800',
      '--hide-scrollbars',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

  console.log('Navigating to preview stage...');
  await page.goto(`http://localhost:${PORT}/stage`, { waitUntil: 'networkidle0' });

  await waitForFrameReady(page);

  for (let i = 0; i < SCREENSHOTS.length; i++) {
    const shot = SCREENSHOTS[i];
    console.log(`\n--- ${shot.label} ---`);

    await updateStage(page, shot);

    if (shot.setup) {
      if (shot.setup.mode) {
        await clickMode(page, shot.setup.mode);
        await new Promise((r) => setTimeout(r, 300));
      }
      if (shot.setup.value) {
        await setInputValue(page, shot.setup.value);
        await new Promise((r) => setTimeout(r, 500));
      }
    } else {
      await page.evaluate(() => {
        var iframe = document.getElementById('extension-frame');
        if (!iframe || !iframe.contentDocument) return;
        var input = iframe.contentDocument.querySelector('input[type="text"]');
        if (input) {
          var nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, '');
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await new Promise((r) => setTimeout(r, 300));
    }

    await new Promise((r) => setTimeout(r, 200));
    const h = await page.evaluate(() => window.__resizeIframe());
    await new Promise((r) => setTimeout(r, 200));

    const buffer = await page.screenshot({ type: 'png' });
    const outPath = path.join(ASSETS_DIR, shot.file);
    await sharp(buffer).resize(1280, 800).png().toFile(outPath);
    console.log(`Saved: ${outPath} (popup height: ${h}px)`);
  }

  const mainPath = path.join(ASSETS_DIR, 'store-screenshot-1280x800.png');
  const firstShot = path.join(ASSETS_DIR, SCREENSHOTS[0].file);
  fs.copyFileSync(firstShot, mainPath);
  console.log(`\nSaved Main: ${mainPath}`);

  await browser.close();
  server.close();
  console.log('\nAll 5 store screenshots captured successfully!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});

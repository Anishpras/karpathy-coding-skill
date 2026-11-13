#!/usr/bin/env node
// Render an explainer sheet.
// Wraps a content fragment in the sheet style, writes <out>.html (self-contained) and
// <out>.png, and reports layout problems: overlapping text, text outside its panel,
// clipped chart labels, charts that did not draw, text under 9px, JS errors.
//
// Usage: node render.mjs <fragment.html> <out-path-without-extension> [--width 1600] [--scale 2]
// Needs Node 22+ and Google Chrome or Chromium (set CHROME_PATH to use a different one).
// Exit code: 0 = no problems, 1 = problems found (files are still written), 2 = could not run.

import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : def; };
const width = Number(opt('--width', 1600));
const scale = Number(opt('--scale', 2));
const [fragPath, outBase] = args;
if (!fragPath || !outBase) {
  console.error('Usage: node render.mjs <fragment.html> <out-path-without-extension> [--width 1600] [--scale 2]');
  process.exit(2);
}
if (typeof WebSocket === 'undefined') { console.error('Needs Node 22 or newer (global WebSocket).'); process.exit(2); }

const chrome = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean).find(p => existsSync(p));
if (!chrome) { console.error('No Chrome or Chromium found. Set CHROME_PATH.'); process.exit(2); }

// ---- Build the self-contained HTML ----------------------------------------
const assets = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets');
const css = readFileSync(join(assets, 'sheet.css'), 'utf8').replace(/url\("fonts\/([^"]+)"\)/g,
  (_, f) => `url("data:font/woff2;base64,${readFileSync(join(assets, 'fonts', f)).toString('base64')}")`);
const js = readFileSync(join(assets, 'sheet.js'), 'utf8');
const frag = readFileSync(fragPath, 'utf8');
// The attribute value is already HTML-escaped text; only < and > can break out of <title>.
const title = ((frag.match(/<main[^>]*data-name="([^"]*)"/) || [])[1] || 'Explainer').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=${width}">
<title>${title}</title>
<style>
${css}
</style>
<script>
${js}
</script>
</head><body>
${frag}
</body></html>
`;
const outHtml = resolve(outBase + '.html');
const outPng = resolve(outBase + '.png');
mkdirSync(dirname(outHtml), { recursive: true });
writeFileSync(outHtml, html);

// ---- Checks that run inside the page ---------------------------------------
function checkPage() {
  const problems = new Set(), warnings = new Set();
  const short = s => s.replace(/\s+/g, ' ').trim().slice(0, 48);
  const where = el => { const p = el.closest('.panel'); return p ? 'panel ' + (p.dataset.letter || p.dataset.title || '?') : 'the sheet'; };
  const doc = document.documentElement;
  if (!document.querySelector('main.sheet')) problems.add('No <main class="sheet"> found in the fragment.');
  if (doc.scrollWidth > innerWidth + 1) problems.add(`Content is ${doc.scrollWidth}px wide but the page is ${innerWidth}px. Something is too wide (often a nowrap line).`);

  const boxes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    if (!n.data.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script, style, title')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fs = parseFloat(cs.fontSize);
    if (fs < 9) warnings.add(`Text smaller than 9px (${fs}px) in ${where(el)}: "${short(n.data)}"`);
    if ((/\b(TODO|TBD|FIXME|XXX)\b/.test(n.data) || /lorem ipsum|\{\{|\}\}/i.test(n.data)) && !el.closest('pre'))
      warnings.add(`Looks like placeholder text in ${where(el)}: "${short(n.data)}". Put the real value in.`);
    let rects;
    if (el.closest('svg')) rects = [(el.closest('text') || el).getBoundingClientRect()];
    else { const r = document.createRange(); r.selectNodeContents(n); rects = [...r.getClientRects()]; }
    for (const rc of rects) if (rc.width > 0 && rc.height > 0) boxes.push({ rc, n, el, text: short(n.data) });
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.n === b.n) continue;
      const w = Math.min(a.rc.right, b.rc.right) - Math.max(a.rc.left, b.rc.left);
      const h = Math.min(a.rc.bottom, b.rc.bottom) - Math.max(a.rc.top, b.rc.top);
      if (w > 2 && h > 3) problems.add(`Text overlaps in ${where(a.el)}: "${a.text}" and "${b.text}"`);
    }
  }

  for (const p of document.querySelectorAll('.panel')) {
    const pr = p.getBoundingClientRect();
    for (const b of boxes) {
      if (!p.contains(b.el)) continue;
      if (b.rc.left < pr.left - 1 || b.rc.right > pr.right + 1 || b.rc.top < pr.top - 1 || b.rc.bottom > pr.bottom + 1)
        problems.add(`Text goes outside ${where(p)}: "${b.text}"`);
    }
    for (const el of p.querySelectorAll('svg, table, pre, img, .flow, .tree, .timeline, .annot')) {
      const r = el.getBoundingClientRect();
      if (r.right > pr.right + 1 || r.left < pr.left - 1)
        problems.add(`A ${el.tagName.toLowerCase()} is wider than ${where(p)}. Give the panel more columns or shorten the content.`);
    }
  }
  for (const p of document.querySelectorAll('.panel')) {
    const body = p.querySelector(':scope > .panel-body') || p;
    const br = body.getBoundingClientRect();
    const kids = [...body.children];
    const notes = kids.filter(c => c.classList.contains('note'));
    let bottom = br.top;
    for (const c of kids) if (!notes.includes(c)) bottom = Math.max(bottom, c.getBoundingClientRect().bottom);
    const limit = notes.length ? Math.min(...notes.map(n => n.getBoundingClientRect().top)) : br.bottom;
    const empty = limit - bottom;
    if (empty > 120 && empty > 0.4 * br.height)
      warnings.add(`${where(p)} is about ${Math.round(empty / br.height * 100)}% empty space. Change the spans, or move content, so the panels in a row are about the same height.`);
  }
  for (const t of document.querySelectorAll('svg text')) {
    const s = t.ownerSVGElement.getBoundingClientRect(), r = t.getBoundingClientRect();
    if (r.left < s.left - 1 || r.right > s.right + 1 || r.top < s.top - 1 || r.bottom > s.bottom + 1)
      problems.add(`Chart label cut off in ${where(t)}: "${short(t.textContent)}"`);
  }
  for (const c of document.querySelectorAll('.gauge, .hbar, .linechart'))
    if (!c.dataset.drawn) problems.add(`A ${c.className} chart in ${where(c)} did not draw. Check its data attributes.`);
  if (!document.fonts.check('12px "IBM Plex Sans"') || !document.fonts.check('12px "IBM Plex Mono"'))
    warnings.add('The IBM Plex fonts did not load, so fallback fonts were used.');

  const height = Math.ceil(document.body.getBoundingClientRect().bottom + scrollY);
  return { problems: [...problems], warnings: [...warnings], height, panels: document.querySelectorAll('.panel').length };
}

// ---- Drive headless Chrome over the DevTools protocol ----------------------
const profile = mkdtempSync(join(tmpdir(), 'sheet-chrome-'));
const proc = spawn(chrome, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--disable-gpu',
  '--disable-extensions', '--allow-file-access-from-files', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

let exitCode = 2;
const deadline = setTimeout(() => {
  console.error('Render failed: timed out after 60 s.');
  proc.kill('SIGKILL');
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(2);
}, 60000);
try {
  const wsUrl = await new Promise((res, rej) => {
    let buf = '';
    const t = setTimeout(() => rej(new Error('Chrome did not start within 20s.')), 20000);
    proc.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]); } });
    proc.on('exit', c => rej(new Error('Chrome exited early with code ' + c)));
  });
  const ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('Could not connect to Chrome.')); });

  let nextId = 0;
  const pending = new Map(), listeners = [];
  ws.onclose = () => { for (const { rej } of pending.values()) rej(new Error('Lost the connection to Chrome.')); pending.clear(); };
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    } else listeners.forEach(fn => fn(msg));
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++nextId; pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  const jsErrors = [];
  listeners.push(m => {
    if (m.sessionId !== s) return;
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      jsErrors.push('JavaScript error: ' + ((d.exception && d.exception.description) || d.text).split('\n')[0]);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
      jsErrors.push('console.error: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  });
  await send('Runtime.enable', {}, s);
  await send('Page.enable', {}, s);
  await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: scale, mobile: false }, s);
  const loaded = new Promise(res => listeners.push(m => m.sessionId === s && m.method === 'Page.loadEventFired' && res()));
  await send('Page.navigate', { url: pathToFileURL(outHtml).href }, s);
  await loaded;

  const evaluate = async expression =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, s)).result.value;
  await evaluate(`new Promise(r => { const t0 = Date.now(); (function w() { if (window.__sheetReady || Date.now() - t0 > 8000) r(true); else setTimeout(w, 50); })(); })`);
  await evaluate('document.body.offsetHeight, document.fonts.ready.then(() => true)');
  const ready = await evaluate('!!window.__sheetReady');
  const report = await evaluate(`(${checkPage.toString()})()`);
  if (!ready) report.problems.unshift('The sheet script did not finish. See the JavaScript errors.');

  await send('Emulation.setDeviceMetricsOverride', { width, height: report.height, deviceScaleFactor: scale, mobile: false }, s);
  const { data } = await send('Page.captureScreenshot', { format: 'png' }, s);
  writeFileSync(outPng, Buffer.from(data, 'base64'));

  const problems = [...jsErrors, ...report.problems];
  console.log(`Wrote ${outHtml}`);
  console.log(`Wrote ${outPng}  (${width} x ${report.height} CSS px at ${scale}x, ${report.panels} panels)`);
  for (const p of problems) console.log('PROBLEM  ' + p);
  for (const w of report.warnings) console.log('WARN     ' + w);
  console.log(problems.length
    ? `${problems.length} problem(s). Fix them in the fragment and render again.`
    : 'No layout problems found. Now open the PNG and look at it.');
  exitCode = problems.length ? 1 : 0;
  send('Browser.close').catch(() => {});
} catch (err) {
  console.error('Render failed: ' + err.message);
} finally {
  clearTimeout(deadline);
  await new Promise(r => { if (proc.exitCode !== null) return r(); proc.once('exit', r); setTimeout(() => { proc.kill('SIGKILL'); r(); }, 3000); });
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
  process.exit(exitCode);
}

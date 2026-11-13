// Explainer sheet runtime. Builds the ruler, the lettered panel headers, and the charts
// from data attributes, then sets window.__sheetReady for scripts/render.mjs.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const SERIES = ['--s1', '--s2', '--s3', '--s4'];
  const TONES = { blue: '--s1', ochre: '--s2', plum: '--s3', teal: '--s4', red: '--red', muted: '--hair' };

  function el(tag, attrs, parent) {
    const svg = tag.startsWith('svg:');
    const e = svg ? document.createElementNS(NS, tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null) continue;
      if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function fmt(v, d) {
    const s = Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
    return (d.prefix || '') + s + (d.suffix || '');
  }

  function niceTicks(min, max, count) {
    const span = (max - min) || Math.abs(max) || 1;
    const raw = span / (count || 5);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    const step = (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
    const ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }

  function buildSheet() {
    const sheet = document.querySelector('main.sheet');
    if (!sheet) return;
    if (sheet.dataset.name) document.title = sheet.dataset.name;
    const body = el('div', { class: 'sheet-body' });
    while (sheet.firstChild) body.appendChild(sheet.firstChild);
    const cols = +(sheet.dataset.cols || 8);
    const ruler = el('div', { class: 'ruler' }, sheet);
    ruler.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
    for (let i = 1; i <= cols; i++) el('span', { text: i }, ruler);
    sheet.appendChild(body);

    let code = 65;
    for (const p of sheet.querySelectorAll('.panel')) {
      if (!p.dataset.title) continue;
      const letter = p.dataset.letter || String.fromCharCode(code++);
      p.dataset.letter = letter;
      const head = el('header', { class: 'panel-head' });
      el('b', { class: 'badge', text: letter }, head);
      el('h2', { text: p.dataset.title }, head);
      if (p.dataset.cap) el('small', { text: p.dataset.cap }, head);
      const inner = el('div', { class: 'panel-body' });
      while (p.firstChild) inner.appendChild(p.firstChild);
      p.append(head, inner);
    }
  }

  // <div class="gauge" data-label="Procedural sentence" data-value="20" data-max="30" data-step="5"
  //      data-cap="max 20 words" [data-sub="(note)"] [data-limit="20"] [data-tone="red"]></div>
  // Bad data must be loud: render.mjs reports console.error as a problem.
  function bad(kind, msg) { console.error(kind + ': ' + msg); }

  function gauge(g) {
    const d = g.dataset, v = +d.value, max = +d.max;
    if (!isFinite(v) || !(max > 0)) bad('gauge', '"' + (d.label || '') + '" needs numeric data-value and a data-max above 0');
    const step = +(d.step || niceTicks(0, max, 6)[1]);
    const head = el('div', { class: 'g-head' }, g);
    el('span', { text: d.label || '' }, head);
    const cap = el('span', { class: 'g-cap' }, head);
    if (d.sub) el('em', { text: d.sub }, cap);
    cap.appendChild(document.createTextNode(d.cap || ''));
    const track = el('div', { class: 'g-track', title: (d.label || '') + ': ' + fmt(v, d) }, g);
    const fill = el('div', { class: 'g-fill' + (d.tone === 'red' ? ' red' : '') }, track);
    fill.style.width = (Math.min(v, max) / max * 100) + '%';
    if (d.limit) el('i', { class: 'g-limit' }, track).style.left = (+d.limit / max * 100) + '%';
    const axis = el('div', { class: 'g-axis' }, g);
    for (let t = 0; t <= max + 1e-9; t += step) {
      el('span', { text: fmt(+t.toFixed(10), {}) }, axis).style.left = (t / max * 100) + '%';
    }
    g.dataset.drawn = '1';
  }

  // <div class="hbar" [data-max] [data-suffix] [data-prefix]>
  //   <div data-label="Labeling" data-value="92" [data-tone="red|muted|ochre|plum|teal"]></div> ...
  // </div>
  function hbar(c) {
    const d = c.dataset;
    const rows = [...c.children].map(r => ({ label: r.dataset.label || '', value: +r.dataset.value, tone: r.dataset.tone }));
    for (const r of rows) if (!isFinite(r.value)) bad('hbar', 'row "' + r.label + '" has no number in data-value');
    if (rows.some(r => r.value < 0)) bad('hbar', 'negative values: use a table or a diverging chart instead');
    const max = +(d.max || Math.max(...rows.map(r => r.value)));
    c.textContent = '';
    for (const r of rows) {
      el('span', { class: 'hb-label', text: r.label }, c);
      const track = el('span', { class: 'hb-track' }, c);
      const bar = el('span', { class: 'bar', title: r.label + ': ' + fmt(r.value, d) }, track);
      bar.style.width = Math.max(0.4, r.value / max * 100) + '%';
      if (r.tone) bar.style.background = 'var(' + (TONES[r.tone] || '--s1') + ')';
      el('span', { class: 'hb-value', text: fmt(r.value, d) }, c);
    }
    d.drawn = '1';
  }

  // <div class="linechart" data-x="2019,2020,2021" [data-suffix] [data-zero="false"] [style="height:240px"]>
  //   <div data-name="Opus" data-values="1,2,3"></div> ...   (1 to 4 series)
  // </div>
  function linechart(c) {
    const d = c.dataset;
    const xs = (d.x || '').split(',').map(s => s.trim());
    const series = [...c.children].map((s, i) => ({
      name: s.dataset.name || 'Series ' + (i + 1),
      values: s.dataset.values.split(',').map(Number),
      color: 'var(' + SERIES[i] + ')',
    }));
    if (series.length > 4) bad('linechart', series.length + ' series: keep at most 4 (fold the rest into "Other" or split the chart)');
    series.length = Math.min(series.length, 4);
    for (const s of series) {
      if (s.values.length !== xs.length) bad('linechart', '"' + s.name + '" has ' + s.values.length + ' values but data-x has ' + xs.length);
      if (s.values.some(v => !isFinite(v))) bad('linechart', '"' + s.name + '" has a value that is not a number');
    }
    c.textContent = '';
    if (series.length > 1) {
      const lg = el('div', { class: 'legend' }, c);
      for (const s of series) el('span', { text: s.name }, lg).style.setProperty('--c', s.color);
    }
    const svg = el('svg:svg', { class: 'chart-svg' }, c);
    const box = svg.getBoundingClientRect();
    const W = box.width || c.clientWidth, H = box.height || 200;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

    const all = series.flatMap(s => s.values);
    let lo = Math.min(...all), hi = Math.max(...all);
    if (d.zero !== 'false') { lo = Math.min(0, lo); hi = Math.max(0, hi); }
    const ticks = niceTicks(lo, hi, 4);
    lo = ticks[0]; hi = ticks[ticks.length - 1];
    const tickText = ticks.map(t => fmt(t, d));
    const left = Math.max(...tickText.map(t => t.length)) * 6 + 10;
    const right = series.length > 1 ? Math.max(...series.map(s => s.name.length)) * 6 + 18 : 14;
    const top = 8, bottom = 22;
    const pw = W - left - right, ph = H - top - bottom;
    const X = i => left + (xs.length > 1 ? i / (xs.length - 1) : 0.5) * pw;
    const Y = v => top + (1 - (v - lo) / (hi - lo || 1)) * ph;

    ticks.forEach((t, i) => {
      el('svg:line', { class: t === 0 ? 'base' : 'grid', x1: left, x2: left + pw, y1: Y(t), y2: Y(t) }, svg);
      el('svg:text', { x: left - 6, y: Y(t) + 3, 'text-anchor': 'end', text: tickText[i] }, svg);
    });
    const every = Math.max(1, Math.ceil(xs.length / Math.max(1, Math.floor(pw / 52))));
    xs.forEach((x, i) => {
      if (i % every && i !== xs.length - 1) return;
      if (i !== xs.length - 1 && xs.length - 1 - i < every) return;
      el('svg:text', { x: X(i), y: H - 6, 'text-anchor': 'middle', text: x }, svg);
    });

    const ends = [];
    for (const s of series) {
      const dpath = s.values.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
      el('svg:path', { class: 'ser', d: dpath, style: 'stroke:' + s.color }, svg);
      const li = s.values.length - 1;
      el('svg:circle', { class: 'end', cx: X(li), cy: Y(s.values[li]), r: 4, style: 'fill:' + s.color }, svg);
      s.values.forEach((v, i) => {
        const hit = el('svg:circle', { class: 'hit', cx: X(i), cy: Y(v), r: 10 }, svg);
        el('svg:title', { text: s.name + ', ' + xs[i] + ': ' + fmt(v, d) }, hit);
      });
      ends.push({ name: s.name, y: Y(s.values[li]) + 3.5, x: X(li) + 9 });
    }
    if (series.length > 1) {
      ends.sort((a, b) => a.y - b.y);
      for (let i = 1; i < ends.length; i++) ends[i].y = Math.max(ends[i].y, ends[i - 1].y + 13);
      for (const e of ends) el('svg:text', { class: 'dl', x: e.x, y: e.y, text: e.name }, svg);
    }
    d.drawn = '1';
  }

  function timeline(t) {
    const dots = t.querySelectorAll('.ev b');
    if (dots.length < 2) return;
    const tr = t.getBoundingClientRect();
    const a = dots[0].getBoundingClientRect(), z = dots[dots.length - 1].getBoundingClientRect();
    const line = el('i', { class: 'tl-line' }, t);
    line.style.left = (a.left + a.width / 2 - tr.left - 14) + 'px';
    line.style.width = (z.left + z.width / 2 - a.left - a.width / 2 + 28) + 'px';
  }

  function init() {
    buildSheet();
    document.querySelectorAll('.gauge').forEach(gauge);
    document.querySelectorAll('.hbar').forEach(hbar);
    document.querySelectorAll('.linechart').forEach(linechart);
    document.querySelectorAll('.timeline').forEach(timeline);
    window.__sheetReady = true;
  }

  // Load every face before building, so measurements and the screenshot use the real fonts.
  const FACES = ['400 12px "IBM Plex Sans"', '500 12px "IBM Plex Sans"', '600 12px "IBM Plex Sans"',
    '400 12px "IBM Plex Mono"', '500 12px "IBM Plex Mono"'];
  document.addEventListener('DOMContentLoaded', () => {
    Promise.all(FACES.map(f => document.fonts.load(f).catch(() => null)))
      .then(() => document.fonts.ready).then(init, init);
  });
})();

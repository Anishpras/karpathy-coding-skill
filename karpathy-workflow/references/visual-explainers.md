# Visual explainers

- [When to make one](#when-to-make-one)
- [The look](#the-look)
- [Plan the panels](#plan-the-panels)
- [Layout](#layout)
- [Components](#components)
- [Chart rules](#chart-rules)
- [Render and check](#render-and-check)
- [Save and send](#save-and-send)

## When to make one

Make one every time the user asks you to explain something: code, a system, a concept, a result, data, or a decision. Skip it only for a one-fact answer, or when the user asks for text only.

## The look

The sheet looks like a technical drawing. `assets/examples/ste100.png` is the reference look. `assets/examples/hackertube.png` shows the same style with a flow diagram, stat numbers, and a bar chart.

- A paper-gray sheet on a dark background, with a column ruler (1 to 8) across the top. The ruler is decoration, as on a real drawing sheet. It doesn't line up with the 12-column grid.
- Lettered panels (A, B, C, ...), each with a black letter badge, a title, and a small monospace caption on the right.
- Two typefaces: IBM Plex Sans for words, and IBM Plex Mono for data, code, examples, and captions.
- Ink-colored text and lines, one blue accent, and red only for "not allowed", "over the limit", or "error".
- Thin lines, square corners, and flat fills. No shadows, gradients, rounded cards, emoji, or icons other than ✓ and ✕.
- A title block in the bottom-right corner, like an engineering drawing.

`assets/sheet.css` already does all of this. Your job is the content and the layout, not the styling. Don't add a `<style>` block unless no component can do the job. If you must add one, use the tokens (`var(--ink)`, `var(--blue)`, `var(--red)`, `var(--rule)`, ...).

## Plan the panels

List the 3 to 7 questions the user must answer to understand the thing. The title block doesn't count toward that number. Each question becomes a panel. Choose the component that matches the question:

| The panel answers | Component |
|---|---|
| What are the parts, and how are they grouped? | `tree` |
| What happens, and in what order? | `flow` (left to right) or `flow v` (top to bottom) |
| What does this code do, line by line? | `pre.code` with highlighted lines, plus a `table.spec` or `list` |
| In what order are the calls or commands made? | `pre.code` as a summary or pseudo-code. Say "summary" in the caption so no one reads it as the real code. |
| Which part of this sentence, command, or line means what? | `annot` |
| What is allowed, and what is not? How do the options compare? | `table.spec` with `ok` / `no` |
| How big is each item? | `hbar` |
| How does it change over time? | `linechart` |
| How close is this to a limit? | `gauge` |
| What is the headline number? | `stats` |
| When did things happen? | `timeline` |
| What is this sheet, and where does it come from? | `titleblock` |

Panel A gives the whole picture, usually the structure or the flow. The title block goes last. Use real names and real data from the user's project, not placeholders.

Write the words in the plain style from `references/explaining.md`. Panel titles are 2 to 5 words. The caption on the right gives the source, the unit, or the section.

## Layout

- The sheet is a 12-column grid. Set each panel's width with `style="--span:N"`. In each row, the spans add up to 12.
- Common rows: 4+5+3, 6+3+3, 4+4+4, 8+4, and 12 (for example, a full-width flow).
- To stack panels in one column, put them in `<div class="stack" style="--span:3">`. The title block usually goes last in a stack, and it sits at the bottom of the column. If it would be alone, put a small panel above it so the column isn't empty.
- Monospace text that can't wrap (`annot`) takes about 7px per character at 11.5px. An 80-character line needs a span of 5 or more.
- A table with 4 or more columns needs a span of 6 or more.
- Balance each row. A panel that is mostly empty next to a tall one looks wrong, and the renderer warns about it. Change the spans or move content.
- One sheet holds about 7 panels. If you need more, make a second sheet ("Sheet 2 of 2") instead of crowding the first.

## Components

The skeleton of a sheet:

```html
<main class="sheet" data-name="Sheet title">
  <section class="panel" style="--span:4" data-title="Panel title" data-cap="source or unit">
    <!-- components -->
    <p class="note">Optional footnote, pinned to the bottom of the panel.</p>
  </section>
</main>
```

Panels get the letters A, B, C, ... in order. A panel with no `data-title` has no header.

**Tree**
```html
<div class="tree">
  <div class="node root">ASD-STE100<small>Simplified Technical English</small></div>
  <div class="branches">
    <div class="branch">
      <div class="node">Part 1: Writing rules</div>
      <ul class="leaves"><li><code>Section 1</code>Words</li><li>Approved words<small>one meaning</small></li></ul>
    </div>
    <div class="branch"><div class="node hl">Part 2: Dictionary</div></div>
  </div>
</div>
```

**Flow.** Add `class="flow v"` for top to bottom. A step can be `hl` (blue fill) or `warn` (red border). `.n` holds a key number.
```html
<div class="flow">
  <div class="step">Code filter<small>Has a YouTube link</small><span class="n">~43M → 1.2M</span></div>
  <div class="step hl">Model labels<small>5 labels</small></div>
</div>
```

**Table.** Use `td.m` for monospace cells, `ok` and `no` for status, `tr.hl` for a highlighted row, and `blue` or `red` for cell text.
```html
<table class="spec">
  <tr><th>Form</th><th>Example</th><th>Status</th></tr>
  <tr><td>Simple present</td><td class="m">The valve closes.</td><td><span class="ok">Approved</span></td></tr>
  <tr><td>Perfect</td><td class="m">The valve has closed.</td><td><span class="no">Not approved</span></td></tr>
</table>
```

**Annotated line.** Each `.m` gets an under-bracket and a label (`i`). The modifiers are:
- `r2`: puts the label on a second, lower row so it doesn't collide with its neighbors
- `l` and `rt`: align the label left or right, for marks near the panel edges
- `red`: a red bracket and label, for problems

Use `annot two` when any mark uses `r2`. The `.dim` line above is optional.
```html
<div class="annot-wrap">
  <div class="dim">13 words, limit 20</div>
  <div class="annot two"><span class="m l">Make sure<i>Approved verb</i></span> that the <span class="m r2">reservoir<i>Technical name</i></span> is full.</div>
</div>
```

**Code.** Use `.hl` for a highlighted line, `.del` for a removed or wrong line, and `.c` for a comment.
```html
<pre class="code"><span class="c">// retry once on timeout</span>
<span class="hl">const res = await fetchWithRetry(url, 1);</span></pre>
```

**Bar chart.** It draws one measure in one unit. Each row can take `data-tone="muted"` for a context bar, or `"red"` for a problem.
```html
<div class="hbar" data-suffix="M">
  <div data-label="Input" data-value="504"></div>
  <div data-label="Output" data-value="7.6"></div>
</div>
```

**Line chart.** It takes 1 to 4 series, and each one needs a value for every x. `data-zero="false"` lets the y-axis start above 0. Set the height inline.
```html
<div class="linechart" data-x="Jan,Feb,Mar,Apr" data-suffix=" ms" style="height:220px">
  <div data-name="p50" data-values="120,118,110,96"></div>
  <div data-name="p99" data-values="910,880,700,610"></div>
</div>
```

**Gauge.** It shows a value against a scale. `data-limit` draws a red limit line, and `data-tone="red"` colors a value that is over the limit.
```html
<div class="gauge" data-label="Procedural sentence" data-value="20" data-max="30" data-step="5" data-cap="max 20 words"></div>
```

**Stats, timeline, title block**
```html
<div class="stats"><div class="stat"><b>6,454</b><span>videos</span><small>2007 to 2026</small></div></div>

<div class="timeline">
  <div class="ev"><b>1979</b><small>Work starts</small></div>
  <div class="ev"><b>Now</b><small>Free download</small></div>
</div>

<div class="titleblock">
  <div class="wide"><label>Title</label><span>How the cache works</span></div>
  <div><label>Source</label><span>src/cache.ts</span></div>
  <div><label>Sheet</label><span>1 of 1</span></div>
</div>
```

**Text helpers**

| Class | Use |
|---|---|
| `p` | paragraph |
| `sub` | small heading |
| `cap` | monospace caption |
| `note` | italic footnote |
| `ex` | monospace example |
| `list` | square-bullet list |
| `box` | gray callout |
| `row` | puts items side by side |
| `blue`, `red`, `muted` | text colors |
| `mono` | monospace text |
| `nowrap` | keeps text on one line |

## Chart rules

These rules come from the dataviz skill and apply to every chart on a sheet.

- **Values and units.** Bars start at zero, and one chart shows one measure in one unit.
- **Axes.** Never use two y-axes. Two measures on different scales go in two charts.
- **Series colors.** Colors come in a fixed order (blue, ochre, plum, teal) and stay with their series, whatever the ranking. If there are more than 4 series, fold the rest into "Other" or split the chart.
- **Legends.** A single series has no legend, because the panel title names it. For 2 or more series, the legend and the end labels are drawn for you.
- **Red.** Red is reserved for status: not allowed, over the limit, failing. Never use it as just another series color.
- **Labels.** Don't put a number on every point. Bar values are fine, and line charts get end labels only.
- **Real numbers.** Every number on the sheet comes from real data. If a panel uses made-up numbers to illustrate an idea, say so in its caption.
- **New colors.** If you add colors outside the tokens, run them through the dataviz skill's palette validator first.

## Render and check

Write the fragment to `<name>.src.html`, then run:

```
node <skill-dir>/scripts/render.mjs <name>.src.html <out-dir>/<name>
```

This writes `<name>.html`, a self-contained page with fonts inlined and chart tooltips, and `<name>.png` at 2x. Then it checks the page and reports these problems:
- overlapping text
- text outside its panel
- cut-off chart labels
- charts with bad data, such as a missing number, a series of the wrong length, or more than 4 series
- JavaScript errors
- warnings, not problems: text smaller than 9px, a panel that is mostly empty, leftover placeholder text (TODO, TBD, XXX, lorem ipsum), and fonts that didn't load

It needs Node 22+ and Chrome or Chromium. Set `CHROME_PATH` if Chrome isn't in a standard place.

If it exits with code 1, fix every PROBLEM and render again. Treat each WARN as a problem unless you have a reason to keep it. When it passes, open the PNG with the Read tool and look at it. The Read tool shrinks large images, so crop any dense panel and look at it at full size; on macOS, `sips -c <height> <width> --cropOffset <y> <x> in.png --out crop.png` does this. The script checks the layout, not whether the sheet explains things well. Check these yourself:

- Does panel A give the big picture at a glance?
- Is any panel cramped, oddly wrapped, or nearly empty? If so, change the spans.
- Do the charts show what the words claim?
- Does red appear only where something is wrong or not allowed?
- Is every number and name real? Look especially for values you meant to fill in later.
- Would the user understand the sheet without your chat message?

## Save and send

Keep `<name>.src.html`, `<name>.html`, and `<name>.png` together, in the place the user keeps reports (check their CLAUDE.md). If they haven't said where, use `<project>-reports/explainers/` next to the project, outside the repo. Reply with a short plain answer, a few short sentences with one idea each, then the full path to the PNG. Don't upload or publish anything.

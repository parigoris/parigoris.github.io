/* Context pile: why long chats cost more.
   12 messages about 3 tasks (4 messages each). Each block is one message and its reply.
   Every new message makes the AI re-read all the blocks in the chat so far.
   Colour has one job: the accent marks blocks from FINISHED tasks, which the AI re-reads for nothing.
   Grey marks blocks from the task you are working on (emphasis pattern: one hue plus grey).
   The same drawing code runs in Node to make the static picture for readers without JavaScript. */
(function () {
  var TOTAL = 12, PER_TASK = 4;
  var X0 = 30, BAR_W = 22, STEP = 30, BLOCK_H = 12, GAP = 2, BASE = 218, MAX = 12;
  // Text sizes in viewBox units: ticks 14, band labels and axis title 15 (style.css). The chart is drawn 392 wide, so the text stays readable on a phone.
  var W = X0 + TOTAL * STEP - (STEP - BAR_W) + 10, H = BASE + 52;

  function taskOf(i) { return Math.floor(i / PER_TASK); }

  // For message m (0-based): how many blocks it re-reads, and how many of those are from finished tasks.
  function count(mode, m) {
    var all = mode === 'fresh' ? (m % PER_TASK) + 1 : m + 1;
    var waste = mode === 'fresh' ? 0 : taskOf(m) * PER_TASK;
    return { all: all, waste: waste };
  }

  function totals(mode, n) {
    var t = { all: 0, waste: 0 };
    for (var m = 0; m < n; m++) { var c = count(mode, m); t.all += c.all; t.waste += c.waste; }
    return t;
  }

  function y(k) { return BASE - k * (BLOCK_H + GAP); }

  function svg(mode, n) {
    var o = [];
    o.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="pile-svg" role="img" aria-label="' + label(mode, n) + '">');
    // Gridlines and y-axis ticks (blocks re-read)
    for (var v = 0; v <= MAX; v += 4) {
      var gy = (v === 0 ? BASE : y(v) + GAP) + 0.5;
      o.push('<line class="' + (v === 0 ? 'pile-base' : 'pile-grid-line') + '" x1="' + X0 + '" y1="' + gy + '" x2="' + (W - 8) + '" y2="' + gy + '"/>');
      o.push('<text class="pile-tick" x="' + (X0 - 6) + '" y="' + (gy + 5) + '" text-anchor="end">' + v + '</text>');
    }
    // Task bands: label above, divider between tasks
    for (var t = 0; t < TOTAL / PER_TASK; t++) {
      var bx = X0 + t * PER_TASK * STEP;
      if (t > 0) {
        var dx = bx - (STEP - BAR_W) / 2;
        o.push('<line class="pile-divider' + (mode === 'fresh' ? ' fresh' : '') + '" x1="' + dx + '" y1="4" x2="' + dx + '" y2="' + BASE + '"/>');
      }
      // Two short lines instead of one long one, so the label fits its band at 15 units
      o.push('<text class="pile-band" x="' + (bx + 2) + '" y="16">Task ' + (t + 1) + '</text>');
      if (t > 0) o.push('<text class="pile-band-sub" x="' + (bx + 2) + '" y="34">' + (mode === 'fresh' ? 'new chat' : 'same chat') + '</text>');
    }
    // Bars: one block per message re-read. Waste blocks (finished tasks) sit at the bottom, in the accent.
    for (var m = 0; m < n; m++) {
      var c = count(mode, m), x = X0 + m * STEP;
      o.push('<g class="pile-bar"><title>Message ' + (m + 1) + ': re-reads ' + c.all + ' blocks' + (c.waste ? ', ' + c.waste + ' of them from finished tasks' : '') + '</title>');
      for (var k = 0; k < c.all; k++) {
        o.push('<rect class="pile-blk ' + (k < c.waste ? 'waste' : 'current') + '" x="' + x + '" y="' + (y(k + 1) + GAP) + '" width="' + BAR_W + '" height="' + BLOCK_H + '" rx="2"/>');
      }
      o.push('</g>');
    }
    // X-axis ticks (message number) and axis titles
    for (var i = 0; i < TOTAL; i++) {
      o.push('<text class="pile-tick" x="' + (X0 + i * STEP + BAR_W / 2) + '" y="' + (BASE + 20) + '" text-anchor="middle">' + (i + 1) + '</text>');
    }
    o.push('<text class="pile-axis" x="' + (X0 + 6 * STEP - STEP / 2 + BAR_W / 2) + '" y="' + (BASE + 44) + '" text-anchor="middle">Message number</text>');
    o.push('</svg>');
    return o.join('');
  }

  function label(mode, n) {
    var t = totals(mode, n);
    return (mode === 'fresh' ? 'A fresh chat per task' : 'One long chat') + ': after ' + n + ' messages, ' + t.all + ' blocks re-read, ' + t.waste + ' from finished tasks.';
  }

  var api = { svg: svg, totals: totals, count: count, TOTAL: TOTAL };
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }

  function setup(root) {
    var n = TOTAL;
    var charts = root.querySelectorAll('[data-pile-mode]');
    var button = root.querySelector('[data-pile-step]');
    var status = root.querySelector('[data-pile-status]');

    function render() {
      for (var i = 0; i < charts.length; i++) {
        var mode = charts[i].getAttribute('data-pile-mode'), t = totals(mode, n);
        charts[i].querySelector('.pile-chart').innerHTML = svg(mode, n);
        charts[i].querySelector('[data-pile-total]').textContent = t.all;
        charts[i].querySelector('[data-pile-waste]').textContent = t.waste;
      }
      button.textContent = n >= TOTAL ? 'Replay, one message at a time' : 'Send message ' + (n + 1) + ' of ' + TOTAL;
      status.textContent = n === 0 ? 'Nothing sent yet.' : 'Message ' + n + ' of ' + TOTAL + ' sent.';
    }

    button.addEventListener('click', function () { n = n >= TOTAL ? 0 : n + 1; render(); });
    root.classList.add('is-live');
    render();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var roots = document.querySelectorAll('[data-context-pile]');
    for (var i = 0; i < roots.length; i++) setup(roots[i]);
  });
})();

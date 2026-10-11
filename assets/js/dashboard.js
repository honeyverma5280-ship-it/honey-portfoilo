/* Cricket dashboard: live version of the Excel workbook (reads assets/data/cricket.js) */
(function () {
  'use strict';
  var DATA = window.CRICKET || [];
  if (!DATA.length) return;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var fmt = function (n) { return Number(n).toLocaleString('en-IN'); };
  var one = function (n) { return (Math.round(n * 10) / 10).toFixed(1); };
  var PALETTE = ['#138A7B', '#E9A93B', '#E4573D', '#5B6C9D'];

  function uniq(k) { return Array.from(new Set(DATA.map(function (r) { return r[k]; }))).sort(); }
  function fill(sel, label, values) {
    sel.innerHTML = '<option value="All">All ' + label + '</option>' + values.map(function (v) { return '<option>' + v + '</option>'; }).join('');
  }
  var fC = $('#fCountry'), fF = $('#fFormat'), fR = $('#fRole');
  fill(fC, 'countries', uniq('country')); fill(fF, 'formats', uniq('format')); fill(fR, 'roles', uniq('role'));

  function filtered() {
    return DATA.filter(function (r) {
      return (fC.value === 'All' || r.country === fC.value) && (fF.value === 'All' || r.format === fF.value) && (fR.value === 'All' || r.role === fR.value);
    });
  }
  function group(rows, key, agg) {
    var m = {};
    rows.forEach(function (r) { (m[r[key]] = m[r[key]] || []).push(r); });
    return Object.keys(m).map(function (k) { return agg(k, m[k]); });
  }
  var sum = function (rows, k) { return rows.reduce(function (a, r) { return a + r[k]; }, 0); };
  var mean = function (rows, k) { return rows.length ? sum(rows, k) / rows.length : 0; };
  var players = function (rows) { return new Set(rows.map(function (r) { return r.player; })).size; };

  function bars(el, items, valFmt) {
    if (!items.length) { el.innerHTML = '<p class="empty">No records match these filters.</p>'; return; }
    var max = Math.max.apply(null, items.map(function (i) { return i.v; })) || 1;
    el.innerHTML = items.map(function (i) {
      return '<div class="hb"><span class="lab" title="' + i.l + '">' + i.l + '</span><span class="track"><span class="fill" style="width:' + (i.v / max * 100) + '%"></span></span><span class="val">' + (valFmt ? valFmt(i.v) : fmt(i.v)) + '</span></div>';
    }).join('');
  }

  function table(title, head, rows) {
    return '<div class="card"><h3>' + title + '</h3><div class="table-scroll"><table class="data"><thead><tr>' +
      head.map(function (h, i) { return '<th' + (i ? ' class="num"' : '') + '>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td' + (i ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + head.length + '" class="empty">No records match these filters.</td></tr>') +
      '</tbody></table></div></div>';
  }

  function render() {
    var rows = filtered();

    // KPI cards
    var kp = [['Players', players(rows)], ['Matches', fmt(sum(rows, 'matches'))], ['Runs', fmt(sum(rows, 'runs'))], ['Wickets', fmt(sum(rows, 'wickets'))], ['Avg performance', rows.length ? one(mean(rows, 'score')) : '0.0']];
    $('#kpis').innerHTML = kp.map(function (k) { return '<div class="kpi"><b>' + k[1] + '</b><span>' + k[0] + '</span></div>'; }).join('');

    // Charts
    var byCountry = group(rows, 'country', function (k, g) { return { l: k, v: sum(g, 'runs') }; }).sort(function (a, b) { return b.v - a.v; });
    bars($('#chCountry'), byCountry);

    var byFormat = group(rows, 'format', function (k, g) { return { l: k, v: sum(g, 'runs') }; }).sort(function (a, b) { return b.v - a.v; });
    var tot = byFormat.reduce(function (a, i) { return a + i.v; }, 0);
    if (!tot) { $('#chFormat').innerHTML = '<p class="empty">No records match these filters.</p>'; }
    else {
      var acc = 0, stops = byFormat.map(function (i, idx) { var s = acc / tot * 100; acc += i.v; return PALETTE[idx % 4] + ' ' + s + '% ' + (acc / tot * 100) + '%'; });
      $('#chFormat').innerHTML = '<div class="donut" role="img" aria-label="Share of runs by format" style="background:conic-gradient(' + stops.join(',') + ')"></div><ul class="legend">' +
        byFormat.map(function (i, idx) { return '<li><i style="background:' + PALETTE[idx % 4] + '"></i>' + i.l + ': <b>' + fmt(i.v) + '</b> (' + Math.round(i.v / tot * 100) + '%)</li>'; }).join('') + '</ul>';
    }

    var byRole = group(rows, 'role', function (k, g) { return { l: k, v: sum(g, 'wickets') }; }).sort(function (a, b) { return b.v - a.v; });
    bars($('#chRole'), byRole);

    var top = group(rows, 'player', function (k, g) { return { l: k, v: mean(g, 'score') }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 10);
    bars($('#chTop'), top, one);

    // Pivot tables (same six as the Excel workbook)
    var P = [];
    var c1 = group(rows, 'country', function (k, g) { return [k, players(g), fmt(sum(g, 'matches')), fmt(sum(g, 'runs')), fmt(sum(g, 'wickets')), one(mean(g, 'score'))]; }).sort(function (a, b) { return Number(b[3].replace(/,/g, '')) - Number(a[3].replace(/,/g, '')); });
    P.push(table('Pivot 1: Country performance', ['Country', 'Players', 'Matches', 'Runs', 'Wickets', 'Avg score'], c1));
    var c2 = group(rows, 'format', function (k, g) { return [k, fmt(sum(g, 'matches')), fmt(sum(g, 'runs')), fmt(sum(g, 'wickets')), one(mean(g, 'avg')), one(mean(g, 'sr'))]; });
    P.push(table('Pivot 2: Format performance', ['Format', 'Matches', 'Runs', 'Wickets', 'Avg batting', 'Avg strike rate'], c2));
    var c3 = group(rows, 'role', function (k, g) { return [k, players(g), fmt(sum(g, 'runs')), fmt(sum(g, 'wickets')), fmt(sum(g, 'catches')), one(mean(g, 'score'))]; });
    P.push(table('Pivot 3: Role performance', ['Role', 'Players', 'Runs', 'Wickets', 'Catches', 'Avg score'], c3));
    var c4 = group(rows, 'player', function (k, g) { return { k: k, m: sum(g, 'matches'), r: sum(g, 'runs'), w: sum(g, 'wickets'), c: sum(g, 'catches'), s: mean(g, 'score') }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 10).map(function (o) { return [o.k, o.m, fmt(o.r), o.w, o.c, one(o.s)]; });
    P.push(table('Pivot 4: Top 10 players by performance score', ['Player', 'Matches', 'Runs', 'Wickets', 'Catches', 'Score'], c4));
    var fmts = ['ODI', 'T20', 'Test'];
    var c5 = group(rows, 'country', function (k, g) { return [k].concat(fmts.map(function (f) { return fmt(sum(g.filter(function (r) { return r.format === f; }), 'runs')); })); });
    P.push(table('Pivot 5: Runs by country and format', ['Country'].concat(fmts), c5));
    var c6 = group(rows, 'country', function (k, g) { return [k, fmt(sum(g, 'runs')), fmt(sum(g, 'wickets')), one(mean(g, 'sr')), one(mean(g, 'avg'))]; });
    P.push(table('Pivot 6: Batting vs bowling by country', ['Country', 'Total runs', 'Total wickets', 'Avg strike rate', 'Avg batting avg'], c6));
    $('#pivotArea').innerHTML = P.join('');

    renderRecords();
  }

  /* Records table with search and sort */
  var sortKey = 'score', sortDir = -1;
  function renderRecords() {
    var q = $('#recSearch').value.trim().toLowerCase();
    var rows = filtered().filter(function (r) { return !q || r.player.toLowerCase().indexOf(q) > -1; });
    rows.sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir;
    });
    $('#recTable tbody').innerHTML = rows.map(function (r) {
      return '<tr><td>' + r.player + '</td><td>' + r.country + '</td><td>' + r.role + '</td><td>' + r.format + '</td><td class="num">' + r.matches + '</td><td class="num">' + fmt(r.runs) + '</td><td class="num">' + r.avg + '</td><td class="num">' + r.sr + '</td><td class="num">' + r.wickets + '</td><td class="num">' + r.catches + '</td><td class="num">' + r.score + '</td></tr>';
    }).join('') || '<tr><td colspan="11" class="empty">No records match.</td></tr>';
    $('#recCount').textContent = rows.length + ' of ' + DATA.length + ' records';
  }
  $$('#recTable th').forEach(function (th) {
    th.addEventListener('click', function () {
      var k = th.getAttribute('data-k');
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = (k === 'player' || k === 'country' || k === 'role' || k === 'format') ? 1 : -1; }
      renderRecords();
    });
  });
  $('#recSearch').addEventListener('input', renderRecords);

  [fC, fF, fR].forEach(function (s) { s.addEventListener('change', render); });
  $('#fReset').addEventListener('click', function () { fC.value = fF.value = fR.value = 'All'; $('#recSearch').value = ''; render(); });

  /* Tabs */
  $$('.tab').forEach(function (t) {
    t.addEventListener('click', function () {
      $$('.tab').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
      $$('.tabpane').forEach(function (p) { p.classList.remove('on'); });
      t.classList.add('on'); t.setAttribute('aria-selected', 'true');
      $('#pane-' + t.getAttribute('data-tab')).classList.add('on');
    });
  });

  render();
})();

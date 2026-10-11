/* Honey Verma portfolio: site behaviour */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  $('#themeBtn').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('hv-theme', next); } catch (e) {}
    document.dispatchEvent(new Event('themechange'));
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  menuBtn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
  $('#scrim').addEventListener('click', function () { setMenu(false); });
  $$('.sidebar nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Scroll spy ---------- */
  var links = {};
  $$('.sidebar nav a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          $$('.sidebar nav a').forEach(function (a) { a.classList.remove('active'); });
          links[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section').forEach(function (s) { io.observe(s); });
  }

  /* ---------- Project filter ---------- */
  $$('.filters .chip').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.filters .chip').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
      var f = btn.getAttribute('data-f');
      $$('#projGrid .proj').forEach(function (p) {
        var cats = (p.getAttribute('data-cat') || '').split(' ');
        p.hidden = !(f === 'all' || cats.indexOf(f) > -1);
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $('#lightbox');
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () {
      $('#lbImg').src = b.getAttribute('data-open');
      var cap = b.getAttribute('data-cap') || '';
      $('#lbImg').alt = cap;
      $('#lbCap').textContent = cap;
      if (lb.showModal) lb.showModal(); else lb.setAttribute('open', '');
    });
  });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });

  /* ---------- Contact form (opens the visitor's email app) ---------- */
  $('#contactForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, note = $('#formNote');
    var name = f.name.value.trim(), email = f.email.value.trim(), msg = f.msg.value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || !msg) {
      note.textContent = 'Please fill in your name, a valid email address and a message.';
      return;
    }
    var subject = encodeURIComponent('Portfolio message from ' + name);
    var body = encodeURIComponent(msg + '\n\nFrom: ' + name + ' (' + email + ')');
    window.location.href = 'mailto:honeyverma5280@gmail.com?subject=' + subject + '&body=' + body;
    note.textContent = 'Your email app should open now. If it did not, write to honeyverma5280@gmail.com.';
  });

  $('#yr').textContent = new Date().getFullYear();

  /* ---------- Hero: clickable BFS network ---------- */
  var canvas = $('#net'), ctx = canvas.getContext('2d');
  var N = 46, nodes = [], adj = [], W = 0, H = 0, dpr = 1;
  var state = { src: -1, tgt: -1, dist: [], parent: [], shown: -1, path: [], visited: 0 };
  var timer = null;

  function rng(seed) { return function () { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }

  function build() {
    var r = rng(42);
    nodes = []; adj = [];
    for (var i = 0; i < N; i++) { nodes.push({ x: 0.04 + r() * 0.92, y: 0.08 + r() * 0.84 }); adj.push([]); }
    function link(a, b) { if (a !== b && adj[a].indexOf(b) < 0) { adj[a].push(b); adj[b].push(a); } }
    function d2(a, b) { var dx = (nodes[a].x - nodes[b].x) * 2, dy = nodes[a].y - nodes[b].y; return dx * dx + dy * dy; }
    for (i = 0; i < N; i++) {
      var order = nodes.map(function (_, j) { return j; }).filter(function (j) { return j !== i; })
        .sort(function (a, b) { return d2(i, a) - d2(i, b); });
      for (var k = 0; k < 3; k++) link(i, order[k]);
    }
    // make sure the graph is connected
    var comp = new Array(N).fill(-1), c = 0;
    for (i = 0; i < N; i++) if (comp[i] < 0) {
      var st = [i]; comp[i] = c;
      while (st.length) { var u = st.pop(); adj[u].forEach(function (v) { if (comp[v] < 0) { comp[v] = c; st.push(v); } }); }
      c++;
    }
    while (c > 1) {
      var best = null;
      for (var a = 0; a < N; a++) for (var b = 0; b < N; b++) if (comp[a] === 0 && comp[b] !== 0) {
        var d = d2(a, b); if (!best || d < best.d) best = { a: a, b: b, d: d };
      }
      link(best.a, best.b);
      var old = comp[best.b];
      for (i = 0; i < N; i++) if (comp[i] === old) comp[i] = 0;
      c = new Set(comp).size;
    }
  }

  function bfs(src) {
    var dist = new Array(N).fill(-1), parent = new Array(N).fill(-1), q = [src], h = 0;
    dist[src] = 0;
    while (h < q.length) {
      var u = q[h++];
      adj[u].forEach(function (v) { if (dist[v] < 0) { dist[v] = dist[u] + 1; parent[v] = u; q.push(v); } });
    }
    return { dist: dist, parent: parent };
  }

  function colors() {
    var cs = getComputedStyle(root);
    return { ink: cs.getPropertyValue('--ink').trim(), line: cs.getPropertyValue('--line').trim(), teal: cs.getPropertyValue('--teal').trim(),
      coral: cs.getPropertyValue('--coral').trim(), gold: cs.getPropertyValue('--gold').trim(), card: cs.getPropertyValue('--card').trim(), muted: cs.getPropertyValue('--muted').trim() };
  }

  function px(n) { return { x: nodes[n].x * W, y: nodes[n].y * H }; }

  function draw() {
    var C = colors();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var onPath = {};
    for (var i = 1; i < state.path.length; i++) onPath[state.path[i - 1] + '-' + state.path[i]] = onPath[state.path[i] + '-' + state.path[i - 1]] = true;
    // edges
    ctx.lineWidth = 1.2;
    for (var a = 0; a < N; a++) adj[a].forEach(function (b) {
      if (b < a) return;
      var p = px(a), q = px(b);
      var reached = state.dist[a] >= 0 && state.dist[b] >= 0 && state.dist[a] <= state.shown && state.dist[b] <= state.shown;
      var hot = onPath[a + '-' + b];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = hot ? C.coral : (reached ? C.teal : C.line);
      ctx.globalAlpha = hot ? 1 : (reached ? .55 : .9);
      ctx.lineWidth = hot ? 3.4 : 1.2;
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    // nodes
    for (var n = 0; n < N; n++) {
      var p2 = px(n), d = state.dist[n], seen = d >= 0 && d <= state.shown;
      var r = n === state.src || n === state.tgt ? 9 : 6;
      ctx.beginPath(); ctx.arc(p2.x, p2.y, r, 0, 6.2832);
      if (n === state.src) ctx.fillStyle = C.coral;
      else if (n === state.tgt) ctx.fillStyle = C.gold;
      else if (seen) { ctx.fillStyle = C.teal; ctx.globalAlpha = Math.max(.35, 1 - d * 0.13); }
      else ctx.fillStyle = C.muted;
      if (!seen && n !== state.src && n !== state.tgt) ctx.globalAlpha = .55;
      ctx.fill(); ctx.globalAlpha = 1;
      if (n === state.src || n === state.tgt) { ctx.lineWidth = 3; ctx.strokeStyle = C.card; ctx.stroke(); }
    }
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    var r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    draw();
  }

  function msg(t) { $('#netMsg').textContent = t; }

  function maxDist() { return Math.max.apply(null, state.dist); }

  function setSource(n, quiet) {
    clearInterval(timer);
    var res = bfs(n);
    state.src = n; state.tgt = -1; state.dist = res.dist; state.parent = res.parent; state.path = []; state.shown = -1;
    var last = maxDist();
    function step() {
      state.shown++;
      draw();
      if (state.shown >= last) {
        clearInterval(timer);
        msg('Search finished: every dot reached within ' + last + ' hops. Now click a second dot to see the shortest chain.');
      }
    }
    if (reduce) { state.shown = last; draw(); msg('Search finished: every dot reached within ' + last + ' hops. Now click a second dot to see the shortest chain.'); return; }
    msg('Searching, one hop at a time…');
    step();
    timer = setInterval(step, 260);
  }

  function setTarget(n) {
    if (n === state.src) return;
    clearInterval(timer);
    state.shown = maxDist();
    state.tgt = n;
    var p = [], c = n;
    while (c !== -1) { p.push(c); c = state.parent[c]; }
    state.path = p.reverse();
    var visited = state.dist.filter(function (d) { return d >= 0 && d <= state.dist[n]; }).length;
    draw();
    msg('Shortest chain: ' + (state.path.length - 1) + ' hops, through ' + (state.path.length - 2) + ' dot' + (state.path.length - 2 === 1 ? '' : 's') + ' in between. Click anywhere to start again.');
  }

  function nearest(ev) {
    var r = canvas.getBoundingClientRect();
    var t = ev.touches ? ev.touches[0] : ev;
    var x = t.clientX - r.left, y = t.clientY - r.top, best = -1, bd = 26 * 26;
    for (var i = 0; i < N; i++) {
      var p = px(i), d = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  canvas.addEventListener('click', function (e) {
    var n = nearest(e);
    if (n < 0) return;
    if (state.src < 0 || state.tgt >= 0 || state.shown < maxDist()) setSource(n);
    else setTarget(n);
  });

  $('#netClear').addEventListener('click', function () { setSource(centerNode()); });
  $('#netRandom').addEventListener('click', function () {
    var a = Math.floor(Math.random() * N), b = Math.floor(Math.random() * N);
    while (b === a) b = Math.floor(Math.random() * N);
    clearInterval(timer);
    var res = bfs(a);
    state.src = a; state.dist = res.dist; state.parent = res.parent; state.shown = maxDist();
    setTarget(b);
  });

  function centerNode() {
    var best = 0, bd = 9;
    for (var i = 0; i < N; i++) { var d = Math.pow(nodes[i].x - .5, 2) + Math.pow(nodes[i].y - .5, 2); if (d < bd) { bd = d; best = i; } }
    return best;
  }

  build();
  window.addEventListener('resize', resize);
  document.addEventListener('themechange', draw);
  resize();
  setSource(centerNode());
})();

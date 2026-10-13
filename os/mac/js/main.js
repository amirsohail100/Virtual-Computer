/* ===== macOS — OS core: windows, menu bar, Dock, Launchpad, Spotlight, Control Center ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const svg = (p, s = 16, f = 'none') => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="${f}" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  apple: '<svg viewBox="0 0 24 24" width="17" height="17"><defs><mask id="apb"><rect width="24" height="24" fill="#fff"/><circle cx="19.6" cy="10.6" r="2.7" fill="#000"/></mask></defs><g mask="url(#apb)"><path fill="currentColor" d="M12 8.3C10.8 7.1 8.7 6.7 7.2 7.5 4.7 8.9 4.4 12.7 6.2 15.9 7.3 17.9 8.9 20.2 10.4 20.2c.8 0 1.2-.5 1.6-.5s.8.5 1.6.5c1.5 0 3.1-2.3 4.2-4.3 1.8-3.2 1.5-7-1-8.4-1.5-.8-3.6-.4-4.8.8z"/></g><path fill="currentColor" d="M12.1 7.7C11.7 5.700 12.700 3.900 14.700 3.200 15 5.100 14 6.900 12.100 7.700z"/></svg>',
  wifi: svg('<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5.500 12.800a10 10 0 0 1 13 0"/><path d="M9 16.400a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>'),
  wifiOff: svg('<path d="M2 9a15 15 0 0 1 20 0" opacity=".4"/><path d="M5.500 12.800a10 10 0 0 1 13 0" opacity=".4"/><path d="M3 3l18 18"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  cc: svg('<rect x="3" y="5" width="18" height="5" rx="2.500"/><circle cx="8" cy="7.500" r="1.400" fill="currentColor"/><rect x="3" y="14" width="18" height="5" rx="2.500"/><circle cx="16" cy="16.500" r="1.400" fill="currentColor"/>')
};
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULLD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], FULLM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LAUNCHPAD = { name: 'Launchpad', cls: 'i-launchpad', icon: '🚀' };

const OS = (() => {
  const wins = new Map(); let z = 10, counter = 0, front = 'finder', focused = null;
  const running = new Set(['finder']);
  let dockPinned = jget('m_dock2', ['finder', 'launchpad', 'safari', 'messages', 'mail', 'maps', 'photos', 'music', 'calendar', 'notes', 'reminders', 'appstore', 'settings']);
  let settings = { dark: false, wall: 'm1', fit: 'fill', accent: '#0a84ff', brightness: 100, dockSize: 52, magnify: true, hide: false, ...jget('m_settings1', {}) };
  const sys = { wifi: true, bt: true, airdrop: true, dnd: false, night: false, vol: 70 };
  const notifs = [{ id: 1, app: 'System Settings', title: 'Welcome to macOS (Virtual)', text: 'Click the clock to open Notification Center.' }]; let nid = 10;

  const appOf = id => id === 'launchpad' ? LAUNCHPAD : APPS[id];
  const iconInner = id => { const a = appOf(id); return typeof a.html === 'function' ? a.html() : (a.html || a.icon); };

  function apply() {
    document.body.classList.toggle('dark', settings.dark);
    document.documentElement.style.setProperty('--acc', settings.accent);
    document.documentElement.style.setProperty('--dock', settings.dockSize + 'px');
    applyWall($('#desktop'), settings.wall, settings.fit); applyWall($('#lock'), settings.wall, settings.fit);
    $('#dim').style.background = `rgba(0,0,0,${(100 - settings.brightness) / 140})`;
    $('#dockWrap').style.transform = settings.hide ? 'translateY(120%)' : '';
  }
  function set(p) { Object.assign(settings, p); jset('m_settings1', settings); apply(); renderDock(); }
  function toggleNight() { sys.night = !sys.night; $('#night').style.display = sys.night ? 'block' : 'none'; }

  /* ---------- windows ---------- */
  function open(id, arg) {
    const app = APPS[id]; if (!app) return;
    running.add(id);
    if (app.single) for (const w of wins.values()) if (w.app === id) { focus(w); return w; }
    const n = counter++, el = document.createElement('div');
    el.className = 'win' + (app.plain ? ' plain' : '');
    const w = { id: 'w' + n, app: id, el, min: false, max: false, title: app.name };
    el.style.width = Math.min(app.w || 640, innerWidth - 20) + 'px'; el.style.height = Math.min(app.h || 420, innerHeight - 110) + 'px';
    el.style.left = Math.max(0, Math.min(90 + (n % 8) * 30, innerWidth - 300)) + 'px'; el.style.top = (20 + (n % 8) * 30) + 'px';
    el.innerHTML = `<div class="tb"><div class="lights"><button class="r" title="Close"></button><button class="y" title="Minimize"></button><button class="g" title="Zoom"></button></div><span class="tt">${app.name}</span></div><div class="wb"></div><div class="rz"></div>`;
    w.setTitle = t => { w.title = t; $('.tt', el).textContent = t; };
    $('#windows').appendChild(el); wins.set(w.id, w);
    el.addEventListener('pointerdown', () => { if (!w.el.classList.contains('active')) focus(w); }, true);
    $('.r', el).onclick = () => close(w.id); $('.y', el).onclick = () => minimize(w); $('.g', el).onclick = () => toggleMax(w);
    $('.tb', el).ondblclick = e => { if (!e.target.closest('.lights')) toggleMax(w); };
    drag(w); resize(w);
    app.render($('.wb', el), w, arg);
    focus(w); return w;
  }
  function focus(w) {
    if (w.min) { w.min = false; w.el.style.display = ''; }
    w.el.style.zIndex = ++z; focused = w.id; front = w.app; running.add(w.app);
    wins.forEach(o => o.el.classList.toggle('active', o === w)); closeOverlays(); renderDock(); renderMenubar();
  }
  function minimize(w) {
    w.min = true; w.el.style.display = 'none';
    const next = [...wins.values()].filter(o => !o.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    focused = next ? next.id : null; if (next) front = next.app; wins.forEach(o => o.el.classList.toggle('active', o === next)); renderDock(); renderMenubar();
  }
  const toggleMax = w => { w.max = !w.max; w.el.classList.toggle('max', w.max); };
  function close(id) {
    const w = wins.get(id); if (!w) return; if (w.onclose) w.onclose();
    w.el.remove(); wins.delete(id);
    const next = [...wins.values()].filter(o => !o.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    focused = next ? next.id : null; if (next) { front = next.app; wins.forEach(o => o.el.classList.toggle('active', o === next)); }
    renderDock(); renderMenubar();
  }
  function quit(id) {
    if (id === 'finder') return;
    [...wins.values()].filter(w => w.app === id).forEach(w => close(w.id));
    running.delete(id); if (front === id) front = 'finder'; renderDock(); renderMenubar();
  }
  function drag(w) {
    const tb = $('.tb', w.el);
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.lights')) return;
      const sx = e.clientX, sy = e.clientY;
      if (w.max) { toggleMax(w); w.el.style.left = (e.clientX - w.el.offsetWidth / 2) + 'px'; w.el.style.top = '0px'; }
      const ox = parseFloat(w.el.style.left) || 0, oy = parseFloat(w.el.style.top) || 0; tb.setPointerCapture(e.pointerId);
      const mv = ev => { w.el.style.left = (ox + ev.clientX - sx) + 'px'; w.el.style.top = Math.max(0, oy + ev.clientY - sy) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
    });
  }
  function resize(w) {
    const h = $('.rz', w.el);
    h.addEventListener('pointerdown', e => {
      e.stopPropagation(); h.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight;
      const mv = ev => { w.el.style.width = Math.max(240, ow + ev.clientX - sx) + 'px'; w.el.style.height = Math.max(140, oh + ev.clientY - sy) + 'px'; };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    });
  }

  /* ---------- context menu (used by apps too) ---------- */
  let ctxItems = [];
  function showCtx(x, y, items) {
    closeOverlays(); ctxItems = items; const c = $('#ctx');
    c.innerHTML = items.map((i, n) => i === '-' ? '<hr>' : `<div data-n="${n}">${i[0]}</div>`).join(''); c.classList.remove('hidden');
    c.style.left = Math.max(4, Math.min(x, innerWidth - c.offsetWidth - 6)) + 'px'; c.style.top = Math.max(26, Math.min(y, innerHeight - c.offsetHeight - 6)) + 'px';
  }
  $('#ctx').addEventListener('click', e => { const d = e.target.closest('[data-n]'); if (!d) return; const it = ctxItems[+d.dataset.n]; closeOverlays(); if (it && it[1]) it[1](); });

  /* ---------- menu bar ---------- */
  let menuOpenFor = null;
  const fw = () => wins.get(focused);
  function menusFor() {
    const a = appOf(front) || APPS.finder, nm = a.name, w = fw();
    const doc = c => () => document.execCommand(c);
    return {
      [nm]: [[`About ${nm}`, () => notify(nm, 'About ' + nm, 'Virtual macOS app (educational demo).')], '-', front === 'settings' ? null : ['Settings…', () => open('settings')], '-', [`Hide ${nm}`, () => [...wins.values()].filter(x => x.app === front).forEach(minimize), '⌘H'], front === 'finder' ? null : [`Quit ${nm}`, () => quit(front), '⌘Q']].filter(Boolean),
      File: [['New Window', () => open(front), '⌘N'], front === 'finder' ? ['New Folder', () => w && w.api && w.api.newFolder && w.api.newFolder(), '⇧⌘N'] : null, '-', ['Close Window', () => w && close(w.id), '⌘W']].filter(Boolean),
      Edit: [['Undo', doc('undo'), '⌘Z'], ['Redo', doc('redo'), '⇧⌘Z'], '-', ['Cut', doc('cut'), '⌘X'], ['Copy', doc('copy'), '⌘C'], ['Paste', doc('paste'), '⌘V'], ['Select All', doc('selectAll'), '⌘A']],
      View: [['Enter Full Screen', () => w && toggleMax(w), '⌃⌘F'], ['Toggle Dark Mode', () => set({ dark: !settings.dark })]],
      Window: [['Minimize', () => w && minimize(w), '⌘M'], ['Minimize All', () => [...wins.values()].forEach(minimize), '⇧⌘M'], ['Zoom', () => w && toggleMax(w), '⌃⌘F'], '-', ['Move Window to Left Half', () => w && snap(w, 'left'), '⌃⌘←'], ['Move Window to Right Half', () => w && snap(w, 'right'), '⌃⌘→'], ['Center Window', () => w && snap(w, 'center'), '⌃⌘C'], '-', ['Mission Control', openMC, '⌃↑'], ['Bring All to Front', () => wins.forEach(x => focus(x))]],
      Help: [['Keyboard Shortcuts', () => open('shortcuts')], ['macOS Help', () => notify('Help', 'macOS Help', 'Try Spotlight (Ctrl+Space), Launchpad (F4) and Mission Control (F3).')]]
    };
  }
  const appleMenu = () => [['About This Mac', () => { const x = open('settings'); x && x.api && x.api.pane('About This Mac'); }], '-', ['System Settings…', () => open('settings')], ['App Store…', () => open('appstore')], '-', ['Force Quit…', () => open('activity'), '⌥⌘⎋'], '-',
    ['Sleep', () => { $('#off').classList.remove('hidden'); }], ['Restart…', () => location.reload()], ['Shut Down…', () => $('#off').classList.remove('hidden')], '-', ['Lock Screen', () => $('#lock').classList.remove('up'), '⌃⌘Q'], ['Log Out Student…', () => $('#lock').classList.remove('up')], '-', ['Switch OS…', () => { location.href = '../../index.html'; }]];
  function renderMenubar() {
    const a = appOf(front) || APPS.finder, m = menusFor();
    $('#mbLeft').innerHTML = `<button class="mb-btn mb-apple" data-m="__apple">${IC.apple}</button><button class="mb-btn app" data-m="${a.name}">${a.name}</button>` + ['File', 'Edit', 'View', 'Window', 'Help'].map(k => `<button class="mb-btn" data-m="${k}">${k}</button>`).join('');
    $('#mbWifi').innerHTML = sys.wifi ? IC.wifi : IC.wifiOff; $('#mbSearch').innerHTML = IC.search; $('#mbCC').innerHTML = IC.cc;
  }
  function showMenu(btn, key) {
    const items = key === '__apple' ? appleMenu() : menusFor()[key]; if (!items) return;
    const mn = $('#menu'); closeOverlays(); menuOpenFor = key;
    mn.innerHTML = items.map((i, n) => i === '-' ? '<hr>' : `<div class="mi" data-n="${n}"><span>${i[0]}</span><small>${i[2] || ''}</small></div>`).join(''); mn.classList.remove('hidden');
    mn._items = items; mn.style.left = btn.getBoundingClientRect().left + 'px'; $$('.mb-btn').forEach(b => b.classList.toggle('open', b === btn));
  }
  $('#menu').addEventListener('mousedown', e => e.preventDefault());
  $('#menu').addEventListener('click', e => { const d = e.target.closest('[data-n]'); if (!d) return; const it = $('#menu')._items[+d.dataset.n]; closeOverlays(); if (it && it[1]) it[1](); });
  $('#mbLeft').addEventListener('mousedown', e => e.preventDefault());
  $('#mbLeft').addEventListener('click', e => { const b = e.target.closest('.mb-btn'); if (!b) return; if (menuOpenFor === b.dataset.m) return closeOverlays(); showMenu(b, b.dataset.m); });
  $('#mbLeft').addEventListener('mouseover', e => { const b = e.target.closest('.mb-btn'); if (b && menuOpenFor && menuOpenFor !== b.dataset.m) showMenu(b, b.dataset.m); });

  /* ---------- Dock ---------- */
  const dkHTML = (id, extra = '') => { const a = appOf(id); return `<div class="dk ${running.has(id) ? 'run' : ''} ${extra}" data-app="${id}"><span class="tip">${a.name}</span><div class="ic ${a.cls}">${iconInner(id)}</div><i class="dot"></i></div>`; };
  function renderDock() {
    const ids = [...dockPinned]; running.forEach(id => { if (!ids.includes(id)) ids.push(id); });
    const minis = [...wins.values()].filter(w => w.min).map(w => `<div class="dk mini" data-win="${w.id}"><span class="tip">${escH(w.title)}</span><div class="ic ${APPS[w.app].cls}">${iconInner(w.app)}</div></div>`).join('');
    $('#dock').innerHTML = ids.map(id => dkHTML(id)).join('') + '<i class="dsep"></i>' + minis + `<div class="dk" data-trash><span class="tip">Trash</span><div class="ic i-trash">🗑️</div></div>`;
  }
  function launch(id, el) {
    if (id === 'launchpad') return toggleLaunchpad();
    const mine = [...wins.values()].filter(w => w.app === id);
    if (mine.length) { const vis = mine.filter(w => !w.min); return focus((vis.length ? vis : mine).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]); }
    if (running.has(id)) return open(id);
    if (el) el.classList.add('bounce'); setTimeout(() => open(id), 380);
  }
  $('#dock').addEventListener('click', e => {
    const d = e.target.closest('.dk'); if (!d) return;
    if (d.dataset.trash !== undefined) return open('finder', { path: ['@trash'] });
    if (d.dataset.win) { const w = wins.get(d.dataset.win); return w && focus(w); }
    launch(d.dataset.app, d);
  });
  $('#dock').addEventListener('contextmenu', e => {
    e.preventDefault(); e.stopPropagation(); const d = e.target.closest('.dk'); if (!d || !d.dataset.app) return;
    const id = d.dataset.app, kept = dockPinned.includes(id), run = running.has(id) && id !== 'finder' && id !== 'launchpad';
    const items = [[running.has(id) ? 'Open New Window' : 'Open', () => id === 'launchpad' ? toggleLaunchpad() : open(id)], '-', [kept ? 'Remove from Dock' : 'Keep in Dock', () => { dockPinned = kept ? dockPinned.filter(x => x !== id) : [...dockPinned, id]; jset('m_dock2', dockPinned); renderDock(); }]];
    if (run) items.push('-', ['Quit', () => quit(id)]);
    const r = d.getBoundingClientRect(); showCtx(r.left, r.top - items.length * 26 - 14, items);
  });
  /* magnification */
  $('#dock').addEventListener('mousemove', e => {
    if (!settings.magnify) return; $('#dock').classList.remove('snap');
    $$('.dk', $('#dock')).forEach(d => { const r = d.getBoundingClientRect(), dist = Math.abs(e.clientX - (r.left + r.width / 2)), k = Math.max(0, 1 - dist / 120), s = 1 + 0.65 * k * k; d.style.setProperty('--sz', (settings.dockSize * s) + 'px'); });
  });
  $('#dock').addEventListener('mouseleave', () => { $('#dock').classList.add('snap'); $$('.dk', $('#dock')).forEach(d => d.style.removeProperty('--sz')); });
  document.addEventListener('mousemove', e => { if (settings.hide) $('#dockWrap').style.transform = e.clientY > innerHeight - 8 || $('#dockWrap').matches(':hover') ? 'translateY(0)' : 'translateY(120%)'; });

  /* ---------- Launchpad ---------- */
  function toggleLaunchpad() {
    const lp = $('#launchpad'); if (!lp.classList.contains('hidden')) return lp.classList.add('hidden');
    closeOverlays(); lp.classList.remove('hidden'); $('#lpInput').value = ''; fillLP(''); $('#lpInput').focus();
  }
  const fillLP = q => { $('#lpGrid').innerHTML = Object.keys(APPS).filter(id => APPS[id].name.toLowerCase().includes(q)).map(id => `<button class="lp-app" data-app="${id}"><div class="ic ${APPS[id].cls}">${iconInner(id)}</div>${APPS[id].name}</button>`).join(''); };
  $('#lpInput').addEventListener('input', e => fillLP(e.target.value.toLowerCase()));
  $('#launchpad').addEventListener('click', e => { const a = e.target.closest('[data-app]'); if (a) { $('#launchpad').classList.add('hidden'); open(a.dataset.app); } else if (!e.target.closest('input')) $('#launchpad').classList.add('hidden'); });

  /* ---------- Spotlight ---------- */
  let spSel = 0;
  function openSpot() { closeOverlays(); $('#spot').classList.remove('hidden'); const i = $('#spInput'); i.value = ''; updSpot(''); i.focus(); }
  function updSpot(q) {
    const r = $('#spRes'); q = q.trim(); if (!q) { r.innerHTML = ''; return; }
    const ql = q.toLowerCase(), apps = Object.keys(APPS).filter(id => APPS[id].name.toLowerCase().includes(ql)), files = FS.find(ql).filter(x => !x.isDir).slice(0, 5);
    let h = '';
    if (/^[0-9+\-*/().%\s]+$/.test(q) && /[+\-*/%]/.test(q)) { try { const v = Function('"use strict";return (' + q.replace(/%/g, '/100') + ')')(); if (isFinite(v)) h += `<div class="sp-h">Calculator</div><div class="sp-it" data-calc><span class="ic" style="background:#555">🧮</span>${escH(q)} = ${+v.toPrecision(12)}</div>`; } catch (e) {} }
    if (apps.length) h += '<div class="sp-h">Applications</div>' + apps.map(id => `<div class="sp-it" data-app="${id}"><span class="ic ${APPS[id].cls}">${iconInner(id)}</span>${APPS[id].name}</div>`).join('');
    if (files.length) h += '<div class="sp-h">Documents</div>' + files.map(f => `<div class="sp-it" data-file="${escH(f.name)}" data-path='${JSON.stringify(f.path)}'><span class="ic" style="background:#8e8e93">📄</span>${escH(f.name)}</div>`).join('');
    h += `<div class="sp-h">Search the web</div><div class="sp-it" data-web="${escH(q)}"><span class="ic i-safari">🧭</span>Search the web for “${escH(q)}”</div>`;
    r.innerHTML = h; spSel = 0; const first = $('.sp-it', r); first && first.classList.add('sel');
  }
  function runSpot(el) {
    if (!el) return; const d = el.dataset; $('#spot').classList.add('hidden');
    if (d.app) open(d.app); if (d.file) { const p = JSON.parse(d.path), c = FS.get(p)[d.file]; RECENT.add(d.file, p); open('textedit', { name: d.file, path: p, content: c }); }
    if (d.web) open('safari', { url: d.web });
  }
  $('#spInput').addEventListener('input', e => updSpot(e.target.value));
  $('#spInput').addEventListener('keydown', e => {
    const its = $$('#spRes .sp-it'); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!its.length) return; its[spSel].classList.remove('sel'); spSel = (spSel + (e.key === 'ArrowDown' ? 1 : -1) + its.length) % its.length; its[spSel].classList.add('sel'); }
    if (e.key === 'Enter') runSpot(its[spSel]);
  });
  $('#spRes').addEventListener('click', e => runSpot(e.target.closest('.sp-it')));
  $('#spot').addEventListener('mousedown', e => { if (!e.target.closest('.sp-box')) $('#spot').classList.add('hidden'); });
  $('#mbSearch').onclick = e => { e.stopPropagation(); openSpot(); };

  /* ---------- Control Center ---------- */
  function renderCC() {
    const row = (k, ico, t, sub, on) => `<button class="cc-row ${on ? 'on' : ''}" data-k="${k}"><span class="cc-ico">${ico}</span><span><b>${t}</b><small>${sub}</small></span></button>`;
    $('#cc').innerHTML = `<div class="cc-card cc-conn">${row('wifi', IC.wifi, 'Wi-Fi', sys.wifi ? 'Virtual-WiFi' : 'Off', sys.wifi)}${row('bt', '🔵', 'Bluetooth', sys.bt ? 'On' : 'Off', sys.bt)}${row('airdrop', '📡', 'AirDrop', sys.airdrop ? 'Contacts Only' : 'Off', sys.airdrop)}</div>
      <button class="cc-card cc-small ${sys.dnd ? 'on' : ''}" data-k="dnd"><span class="cc-ico">🌙</span>Do Not Disturb</button>
      <button class="cc-card cc-small ${settings.dark ? 'on' : ''}" data-k="dark"><span class="cc-ico">◐</span>Dark Mode</button>
      <div class="cc-card cc-full"><b>Display</b><div class="cc-sl">☀️<input type="range" id="ccBr" min="30" max="100" value="${settings.brightness}"></div></div>
      <div class="cc-card cc-full"><b>Sound</b><div class="cc-sl">🔊<input type="range" id="ccVol" min="0" max="100" value="${sys.vol}"></div></div>
      <button class="cc-card cc-small ${sys.night ? 'on' : ''}" data-k="night"><span class="cc-ico">🌅</span>Night Shift</button>
      <button class="cc-card cc-small" data-k="settings"><span class="cc-ico">⚙️</span>Settings…</button>`;
  }
  $('#cc').addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return; const k = b.dataset.k;
    if (k === 'settings') { closeOverlays(); return open('settings'); }
    if (k === 'dark') set({ dark: !settings.dark }); else if (k === 'night') toggleNight(); else sys[k] = !sys[k];
    renderCC(); renderMenubar();
  });
  $('#cc').addEventListener('input', e => { if (e.target.id === 'ccBr') set({ brightness: +e.target.value }); if (e.target.id === 'ccVol') sys.vol = +e.target.value; });
  $('#mbCC').onclick = e => { e.stopPropagation(); const was = $('#cc').classList.contains('hidden'); closeOverlays(); if (was) { renderCC(); $('#cc').classList.remove('hidden'); } };
  $('#mbWifi').onclick = $('#mbCC').onclick;

  /* ---------- Notifications ---------- */
  function renderNC() {
    const now = new Date(), v = new Date(now.getFullYear(), now.getMonth(), 1), start = new Date(v); start.setDate(1 - v.getDay());
    let cal = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span class="d">${d}</span>`).join('');
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); cal += `<span class="${d.toDateString() === now.toDateString() ? 't' : ''}" style="${d.getMonth() !== v.getMonth() ? 'opacity:.3' : ''}">${d.getDate()}</span>`; }
    $('#ncPanel').innerHTML = `<div class="nc-h">Notifications <button data-clear>Clear</button></div>` +
      (notifs.length ? notifs.map(n => `<div class="ncn"><small>${escH(n.app)}</small><b>${escH(n.title)}</b>${escH(n.text)}<button class="x" data-x="${n.id}">✕</button></div>`).join('') : '<div class="empty" style="padding:18px">No Notifications</div>') +
      `<div class="wid" style="margin-top:12px"><h4>${FULLD[now.getDay()]} · ${FULLM[now.getMonth()]} ${now.getFullYear()}</h4><div class="wcal">${cal}</div></div><div class="wid"><h4>Weather</h4><div class="wwx"><span>New Delhi<br>⛅ Partly cloudy</span><b>29°</b></div></div>`;
  }
  $('#ncPanel').addEventListener('click', e => { if (e.target.closest('[data-clear]')) notifs.length = 0; const x = e.target.dataset.x; if (x) { const i = notifs.findIndex(n => n.id == x); if (i > -1) notifs.splice(i, 1); } renderNC(); });
  $('#nc').addEventListener('mousedown', e => { if (!e.target.closest('#ncPanel')) $('#nc').classList.add('hidden'); });
  $('#mbClock').onclick = e => { e.stopPropagation(); const was = $('#nc').classList.contains('hidden'); closeOverlays(); if (was) { renderNC(); $('#nc').classList.remove('hidden'); } };
  function notify(app, title, text) {
    notifs.unshift({ id: nid++, app, title, text }); if (sys.dnd) return;
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<small>${escH(app)}</small><b>${escH(title)}</b>${escH(text)}`; $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4500);
  }

  /* ---------- window snapping, Mission Control, app switcher, Quick Look ---------- */
  function snap(w, side) {
    if (w.max) toggleMax(w); const W = innerWidth, H = innerHeight - 24 - settings.dockSize - 28;
    if (side === 'center') Object.assign(w.el.style, { width: Math.min(W * .6, 900) + 'px', height: H * .8 + 'px', left: W * .2 + 'px', top: H * .1 + 'px' });
    else Object.assign(w.el.style, { left: side === 'left' ? '0px' : (W / 2) + 'px', top: '0px', width: (W / 2) + 'px', height: H + 'px' });
    focus(w);
  }
  function openMC() {
    closeOverlays(); const mc = $('#mc'), ws = [...wins.values()];
    mc.innerHTML = `<div class="mc-bar">Desktop 1</div><div class="mc-grid">${ws.length ? ws.map(w => `<div class="mc-c" data-w="${w.id}"><div class="mc-t">${escH(w.title)}</div><div class="mc-p"><div class="ic ${APPS[w.app].cls}">${iconInner(w.app)}</div></div><button class="mc-x" data-x="${w.id}" title="Close">✕</button></div>`).join('') : '<div class="mc-e">No open windows</div>'}</div>`;
    mc.classList.remove('hidden');
  }
  $('#mc').addEventListener('click', e => {
    const x = e.target.closest('[data-x]'); if (x) { close(x.dataset.x); return openMC(); }
    const c = e.target.closest('[data-w]'); $('#mc').classList.add('hidden'); if (c) { const w = wins.get(c.dataset.w); w && focus(w); }
  });
  const sw = { open: false, idx: 0, list: [] };
  function stepSwitcher(dir) {
    if (!sw.open) { sw.list = [...running]; sw.idx = sw.list.indexOf(front); if (sw.idx < 0) sw.idx = 0; sw.open = true; }
    sw.idx = (sw.idx + dir + sw.list.length) % sw.list.length;
    $('#sw').innerHTML = sw.list.map((id, i) => `<div class="sw-i ${i === sw.idx ? 'on' : ''}"><div class="ic ${appOf(id).cls}">${iconInner(id)}</div><span>${appOf(id).name}</span></div>`).join(''); $('#sw').classList.remove('hidden');
  }
  function commitSwitcher() { if (!sw.open) return; sw.open = false; $('#sw').classList.add('hidden'); const id = sw.list[sw.idx]; if (id) launch(id); }
  function quickLook(title, html) { $('#ql').innerHTML = `<div class="ql-box"><div class="ql-t">${escH(title)}<button data-q>✕</button></div><div class="ql-b">${html}</div></div>`; $('#ql').classList.remove('hidden'); }
  $('#ql').addEventListener('click', e => { if (e.target.id === 'ql' || e.target.closest('[data-q]')) $('#ql').classList.add('hidden'); });

  /* ---------- keyboard shortcuts ( ⌘ = Alt on a Windows keyboard, or the real ⌘ key on a Mac ) ---------- */
  const typing = e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
  const api = (fn, ...a) => { const w = fw(); return w && w.api && w.api[fn] ? (w.api[fn](...a), true) : false; };
  const finderOn = () => front === 'finder' && fw() && fw().app === 'finder';
  const SC = [
    { g: 'General', sym: '⌃Space', keys: 'Ctrl+Space', desc: 'Spotlight search', sig: 'C', code: 'Space', run: () => $('#spot').classList.contains('hidden') ? openSpot() : closeOverlays() },
    { g: 'General', sym: '⌘Space', keys: 'Alt+Space', desc: 'Spotlight search', sig: 'A', code: 'Space', hide: true, run: () => $('#spot').classList.contains('hidden') ? openSpot() : closeOverlays() },
    { g: 'General', sym: 'F4', keys: 'F4', desc: 'Launchpad', sig: '', code: 'F4', run: toggleLaunchpad },
    { g: 'General', sym: 'F3 / ⌃↑', keys: 'F3 or Ctrl+↑', desc: 'Mission Control (see all windows)', sig: '', code: 'F3', run: openMC },
    { g: 'General', sym: '⌃↑', keys: 'Ctrl+↑', desc: 'Mission Control', sig: 'C', code: 'ArrowUp', hide: true, run: openMC },
    { g: 'General', sym: '⌘Tab', keys: 'Alt+J (hold Alt, tap J)', desc: 'Switch between apps', sig: 'A', code: 'KeyJ', hide: true, run: () => stepSwitcher(1) },
    { g: 'General', sym: '⌥⌘⎋', keys: 'Ctrl+Alt+Esc', desc: 'Force Quit (Activity Monitor)', sig: 'CA', code: 'Escape', run: () => open('activity') },
    { g: 'General', sym: '⌃⌘Q', keys: 'Ctrl+Alt+L', desc: 'Lock screen', sig: 'CA', code: 'KeyL', run: () => $('#lock').classList.remove('up') },
    { g: 'General', sym: '⌥⌘D', keys: 'Ctrl+Alt+D', desc: 'Show / hide the Dock', sig: 'CA', code: 'KeyD', run: () => set({ hide: !settings.hide }) },
    { g: 'App', sym: '⌘N', keys: 'Alt+N', desc: 'New window (or new note in Notes)', sig: 'A', code: 'KeyN', run: () => { if (!api('new')) open(front); } },
    { g: 'App', sym: '⌘W', keys: 'Alt+W', desc: 'Close window', sig: 'A', code: 'KeyW', run: () => focused && close(focused) },
    { g: 'App', sym: '⌘M', keys: 'Alt+M', desc: 'Minimize window', sig: 'A', code: 'KeyM', run: () => fw() && minimize(fw()) },
    { g: 'App', sym: '⇧⌘M', keys: 'Alt+Shift+M', desc: 'Minimize all windows', sig: 'AS', code: 'KeyM', run: () => [...wins.values()].forEach(minimize) },
    { g: 'App', sym: '⌘H', keys: 'Alt+H', desc: 'Hide the current app', sig: 'A', code: 'KeyH', run: () => [...wins.values()].filter(x => x.app === front).forEach(minimize) },
    { g: 'App', sym: '⌘Q', keys: 'Alt+Q', desc: 'Quit the current app', sig: 'A', code: 'KeyQ', run: () => quit(front) },
    { g: 'App', sym: '⌘,', keys: 'Alt+,', desc: 'Open System Settings', sig: 'A', code: 'Comma', run: () => open('settings') },
    { g: 'App', sym: '⌘`', keys: 'Alt+`', desc: 'Cycle windows of the same app', sig: 'A', code: 'Backquote', run: () => { const l = [...wins.values()].filter(x => x.app === front); if (l.length > 1) { const i = l.findIndex(x => x.id === focused); focus(l[(i + 1) % l.length]); } } },
    { g: 'Windows', sym: '⌃⌘F', keys: 'Ctrl+Alt+F', desc: 'Zoom window (full size)', sig: 'CA', code: 'KeyF', run: () => fw() && toggleMax(fw()) },
    { g: 'Windows', sym: '⌃⌘←', keys: 'Ctrl+Alt+←', desc: 'Move window to the left half', sig: 'CA', code: 'ArrowLeft', run: () => fw() && snap(fw(), 'left') },
    { g: 'Windows', sym: '⌃⌘→', keys: 'Ctrl+Alt+→', desc: 'Move window to the right half', sig: 'CA', code: 'ArrowRight', run: () => fw() && snap(fw(), 'right') },
    { g: 'Windows', sym: '⌃⌘C', keys: 'Ctrl+Alt+C', desc: 'Center the window', sig: 'CA', code: 'KeyC', run: () => fw() && snap(fw(), 'center') },
    { g: 'Finder', sym: '⇧⌘N', keys: 'Alt+Shift+N', desc: 'New folder', sig: 'AS', code: 'KeyN', when: finderOn, run: () => api('newFolder') },
    { g: 'Finder', sym: '⌘⌫', keys: 'Alt+Backspace', desc: 'Move to Trash', sig: 'A', code: 'Backspace', when: finderOn, run: () => api('trash') },
    { g: 'Finder', sym: 'Space', keys: 'Space', desc: 'Quick Look the selected file', sig: '', code: 'Space', when: finderOn, noType: true, run: () => api('quicklook') },
    { g: 'Finder', sym: '⌘1 / ⌘2', keys: 'Alt+1 / Alt+2', desc: 'View as icons / as list', sig: 'A', code: 'Digit1', when: finderOn, run: () => api('view', 'icons') },
    { g: 'Finder', sym: '⌘2', keys: 'Alt+2', desc: 'View as list', sig: 'A', code: 'Digit2', hide: true, when: finderOn, run: () => api('view', 'list') },
    { g: 'Finder', sym: '⌘[ / ⌘]', keys: 'Alt+[ / Alt+]', desc: 'Back / forward', sig: 'A', code: 'BracketLeft', when: finderOn, run: () => api('back') },
    { g: 'Finder', sym: '⌘]', keys: 'Alt+]', desc: 'Forward', sig: 'A', code: 'BracketRight', hide: true, when: finderOn, run: () => api('fwd') },
    { g: 'Finder', sym: '⌘↑', keys: 'Alt+↑', desc: 'Go to the enclosing folder', sig: 'A', code: 'ArrowUp', when: finderOn, run: () => api('up') },
    { g: 'Finder', sym: '⌘O', keys: 'Alt+O', desc: 'Open the selected item', sig: 'A', code: 'KeyO', when: finderOn, run: () => api('open') },
    { g: 'Finder', sym: '⇧⌘D', keys: 'Alt+Shift+D', desc: 'Duplicate', sig: 'AS', code: 'KeyD', when: finderOn, run: () => api('duplicate') },
    { g: 'Finder', sym: '⇧⌘F', keys: 'Alt+Shift+F', desc: 'Search in Finder', sig: 'AS', code: 'KeyF', when: finderOn, run: () => api('search') },
    { g: 'Finder', sym: '⏎', keys: 'Enter', desc: 'Rename the selected item', sig: '', code: 'Enter', hide: true, when: () => false, run: () => {} },
    { g: 'Safari', sym: '⌘L', keys: 'Alt+L', desc: 'Go to the address bar', sig: 'A', code: 'KeyL', when: () => front === 'safari', run: () => api('focus') },
    { g: 'Safari', sym: '⌘R', keys: 'Alt+R', desc: 'Reload the page', sig: 'A', code: 'KeyR', when: () => front === 'safari', run: () => api('reload') },
    { g: 'Safari', sym: '⌘[ / ⌘]', keys: 'Alt+[ / Alt+]', desc: 'Back / forward', sig: 'A', code: 'BracketLeft', when: () => front === 'safari', run: () => api('back') },
    { g: 'Safari', sym: '⌘]', keys: 'Alt+]', desc: 'Forward', sig: 'A', code: 'BracketRight', hide: true, when: () => front === 'safari', run: () => api('fwd') },
    { g: 'TextEdit', sym: '⌘S', keys: 'Alt+S (or Ctrl+S)', desc: 'Save the document', sig: 'A', code: 'KeyS', when: () => front === 'textedit', run: () => api('save') },
    { g: 'Calculator', sym: '0–9 + − × ÷ ⏎', keys: 'type on the keyboard', desc: 'Calculate with the keyboard', sig: '', code: 'None', when: () => false, run: () => {} }
  ];
  document.addEventListener('keydown', e => {
    if (!$('#lock').classList.contains('up')) return;
    if ((e.altKey && !e.ctrlKey && e.code === 'KeyJ') || (e.metaKey && e.code === 'Tab')) { e.preventDefault(); return stepSwitcher(e.shiftKey ? -1 : 1); }
    const sig = (e.ctrlKey ? 'C' : '') + ((e.altKey || e.metaKey) ? 'A' : '') + (e.shiftKey ? 'S' : '');
    const s = SC.find(x => x.code === e.code && x.sig === sig && (!x.when || x.when()));
    if (s && !(s.noType && typing(e))) { e.preventDefault(); s.run(e); }
  });
  document.addEventListener('keyup', e => { if (sw.open && (e.key === 'Alt' || e.key === 'Meta')) commitSwitcher(); });

  function closeOverlays() {
    $('#menu').classList.add('hidden'); menuOpenFor = null; $$('.mb-btn').forEach(b => b.classList.remove('open'));
    ['#cc', '#nc', '#launchpad', '#spot', '#ctx', '#mc', '#ql'].forEach(s => $(s).classList.add('hidden'));
  }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#menu,#menubar,#cc,#ncPanel,#ctx,#launchpad,#spot,#dock')) closeOverlays(); });

  /* ---------- Desktop ---------- */
  function refreshDesktop() {
    const d = FS.get([...HOME, 'Desktop']) || {};
    $('#dIcons').innerHTML = `<div class="di" data-hd>${MI.drive(54)}<span class="n">Macintosh HD</span></div>` +
      Object.entries(d).map(([k, v]) => `<div class="di" data-n="${escH(k)}">${typeof v === 'object' ? MI.folder(54) : MI.file(k, 54)}<span class="n">${escH(k)}</span></div>`).join('');
  }
  $('#dIcons').addEventListener('click', e => { $$('.di').forEach(x => x.classList.remove('sel')); const d = e.target.closest('.di'); if (d) d.classList.add('sel'); });
  $('#dIcons').addEventListener('dblclick', e => {
    const d = e.target.closest('.di'); if (!d) return;
    if (d.dataset.hd !== undefined) return open('finder', { path: ['Macintosh HD'] });
    const p = [...HOME, 'Desktop'], n = d.dataset.n, v = FS.get(p)[n];
    typeof v === 'object' ? open('finder', { path: [...p, n] }) : (RECENT.add(n, p), open('textedit', { name: n, path: p, content: v }));
  });
  $('#desktop').addEventListener('pointerdown', e => { if (e.target.id === 'desktop') { $$('.di').forEach(x => x.classList.remove('sel')); focused = null; front = 'finder'; wins.forEach(o => o.el.classList.remove('active')); renderMenubar(); } });
  $('#screen').addEventListener('dragover', e => e.preventDefault());
  $('#screen').addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return; addCustomWall(f, (id, err) => id ? (set({ wall: id }), notify('Desktop', 'Desktop picture changed', f.name)) : notify('Desktop', 'Could not change picture', err)); });
  document.addEventListener('contextmenu', e => {
    e.preventDefault(); if (e.target.closest('.win,#dock,#menubar,.panel,#ncPanel,#launchpad,#spot')) return;
    showCtx(e.clientX, e.clientY, [['New Folder', () => { const p = [...HOME, 'Desktop'], d = FS.get(p); let n = 'untitled folder', i = 2; while (n in d) n = 'untitled folder ' + i++; FS.set(p, n, {}); refreshDesktop(); }], '-',
      ['Change Desktop Background…', () => { const w = open('settings'); w && w.api && w.api.pane('Wallpaper'); }], [settings.dark ? 'Use Light Mode' : 'Use Dark Mode', () => set({ dark: !settings.dark })], '-', ['Open Terminal', () => open('terminal')]]);
  });

  /* ---------- clock, lock, power, keyboard ---------- */
  function tick() {
    const d = new Date(), h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, '0'), ap = d.getHours() >= 12 ? 'PM' : 'AM';
    $('#mbClock').textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}  ${h}:${m} ${ap}`;
    $('#lTime').textContent = `${h}:${m}`; $('#lDate').textContent = `${FULLD[d.getDay()]}, ${d.getDate()} ${FULLM[d.getMonth()]}`;
  }
  const unlock = () => { $('#lock').classList.add('up'); $('#lPass').value = ''; };
  $('#lGo').onclick = unlock; $('#lPass').addEventListener('keydown', e => { if (e.key === 'Enter') unlock(); });
  $('#lock').addEventListener('click', e => { if (!e.target.closest('.l-user,.l-foot')) $('#lPass').focus(); });
  $('.l-foot').addEventListener('click', e => { const a = e.target.dataset.pw; if (a === 'restart') location.reload(); if (a === 'shutdown' || a === 'sleep') $('#off').classList.remove('hidden'); if (a === 'home') location.href = '../../index.html'; });
  $('#powerOn').onclick = () => $('#off').classList.add('hidden');
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeOverlays(); $('#sw').classList.add('hidden'); sw.open = false; }
  });

  /* ---------- boot ---------- */
  apply(); renderDock(); renderMenubar(); refreshDesktop(); tick(); setInterval(tick, 1000);
  setTimeout(() => $('#lPass').focus(), 100);
  return { open, close, quit, notify, showCtx, quickLook, shortcuts: SC.map(({ g, sym, keys, desc, hide }) => ({ g, sym, keys, desc, hide })), iconInner, refreshDesktop, toggleNight, sys, runningApps: () => [...running], get settings() { return settings; }, set };
})();

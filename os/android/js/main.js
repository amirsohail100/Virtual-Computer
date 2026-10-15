/* ===== Android (Virtual) — OS core: phone frame, rotation, home, apps, recents, shade ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SI = {
  signal: '<svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor"><rect x="0" y="8" width="2.5" height="4" rx=".6"/><rect x="3.8" y="5.5" width="2.5" height="6.5" rx=".6"/><rect x="7.6" y="3" width="2.5" height="9" rx=".6"/><rect x="11.4" y="0" width="2.5" height="12" rx=".6"/></svg>',
  wifi: '<svg width="14" height="12" viewBox="0 0 24 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M2 7a15 15 0 0 1 20 0"/><path d="M5.500 11a10 10 0 0 1 13 0"/><path d="M9 15a5 5 0 0 1 6 0"/><circle cx="12" cy="18.500" r="1" fill="currentColor"/></svg>',
  bat: (l, saver) => `<svg width="20" height="11" viewBox="0 0 22 12"><rect x=".5" y=".5" width="18" height="11" rx="3" fill="none" stroke="currentColor" opacity=".7"/><rect x="2" y="2" width="${Math.max(1, 15 * l / 100)}" height="8" rx="1.8" fill="${saver ? '#f9ab00' : 'currentColor'}"/><rect x="19.500" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".7"/></svg>`
};

const OS = (() => {
  const tasks = []; let seq = 0, cur = null, land = false, locked = true, off = false, imm = false, panel = null, bat = { l: 100, c: false };
  let settings = { dark: false, wall: 'a1', fit: 'fill', brightness: 100, wifi: true, bt: true, dnd: false, plane: false, saver: false, flash: false, vol: 60, ...jget('a_settings1', {}) };
  const notifs = [{ id: 1, app: 'Settings', title: 'Welcome to Android (Virtual)', text: 'Click the status bar to open quick settings. Press R to rotate the phone.', icon: '⚙️' }]; let nid = 10;
  const iconHTML = id => { const a = APPS[id]; return typeof a.html === 'function' ? a.html() : (a.html || a.icon); };
  const curTask = () => tasks.find(x => x.id === cur);
  const idByName = n => Object.keys(APPS).find(k => APPS[k].name === n);

  /* ---------- settings, bars, scale ---------- */
  function bars() {
    let light = true;
    if (locked || off || panel === 'recents') light = true;
    else if (panel === 'shade' || panel === 'drawer') light = settings.dark;
    else if (cur) { const t = curTask(); light = !!(t && APPS[t.app].dark) || settings.dark; }
    else light = !$('#screen').classList.contains('lightwall');
    const s = $('#screen'); s.classList.toggle('barlight', light); s.classList.toggle('bardark', !light);
  }
  function renderStatus() {
    const s = settings; let h = '';
    if (s.dnd) h += '<span title="Do Not Disturb">⛔</span>';
    if (s.plane) h += '<span>✈</span>'; else { if (s.bt) h += '<span style="font-size:11px">ᛒ</span>'; if (s.wifi) h += SI.wifi; h += SI.signal; }
    h += `<span style="display:flex;align-items:center;gap:3px">${SI.bat(bat.l, s.saver)}<span style="font-size:11px">${bat.l}%</span></span>`; $('#stIcons').innerHTML = h;
  }
  const LW = { a1: true, a2: false, a3: false };
  function wallLight(id, cb) {
    if (id in LW) return cb(LW[id]); const w = CUSTOM_WALLS.find(x => x.id === id); if (!w) return cb(false);
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]; LW[id] = s / (d.length / 4) > 150; cb(LW[id]); }; img.onerror = () => cb(false); img.src = w.data;
  }
  function apply() {
    $('#screen').classList.toggle('dark', settings.dark); applyWall($('#wall'), settings.wall, settings.fit); wallLight(settings.wall, l => { $('#screen').classList.toggle('lightwall', l); bars(); });
    $('#dim').style.background = `rgba(0,0,0,${(100 - settings.brightness) / 130})`; bars(); renderStatus();
  }
  function set(p) { Object.assign(settings, p); jset('a_settings1', settings); apply(); if (panel === 'shade') buildShade(); }
  function fit() { const W = land ? 808 : 388, H = land ? 388 : 808; $('#phoneWrap').style.setProperty('--k', Math.max(.3, Math.min(1, (innerWidth - 110) / W, (innerHeight - 26) / H))); }
  function rotate() { land = !land; $('#phone').classList.toggle('land', land); $('#tRot').classList.toggle('on', land); fit(); if (panel === 'shade') buildShade(); }
  function setImmersive(b) { imm = !!b && cur !== null; $('#screen').classList.toggle('imm', imm); }

  /* ---------- clock + battery ---------- */
  function tick() {
    const d = new Date(), h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, '0');
    $('#stTime').textContent = `${h}:${m}`; $('#lkTime').textContent = `${h}:${m}`; $('#lkDate').textContent = `${DAYS[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
    $('#glance').innerHTML = `<b>${DAYS[d.getDay()].slice(0, 3)}, ${MON[d.getMonth()].slice(0, 3)} ${d.getDate()}</b><span>☀️ 29°C · New Delhi</span>`;
  }
  if (navigator.getBattery) navigator.getBattery().then(b => { const u = () => { bat = { l: Math.round(b.level * 100), c: b.charging }; renderStatus(); }; u(); b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); }).catch(() => {});

  /* ---------- home screen + drawer ---------- */
  const tile = (id, label = true) => `<button class="app" data-app="${id}"><div class="ic" style="background:${APPS[id].bg}">${iconHTML(id)}</div>${label ? `<span>${APPS[id].name}</span>` : ''}</button>`;
  const HOME_APPS = ['youtube', 'gallery', 'calendar', 'notes', 'clock', 'calculator', 'settings'], DOCK = ['phone', 'messages', 'chrome', 'camera'];
  const buildHome = () => { $('#hgrid').innerHTML = HOME_APPS.map(id => tile(id)).join(''); $('#dock').innerHTML = DOCK.map(id => tile(id, false)).join(''); };
  function buildDrawer() {
    const ids = Object.keys(APPS).sort((a, b) => APPS[a].name.localeCompare(APPS[b].name));
    $('#drawer').innerHTML = `<input placeholder="Search apps" autocomplete="off"><div class="dgrid">${ids.map(id => tile(id)).join('')}</div>`;
    $('#drawer input').oninput = e => { const q = e.target.value.toLowerCase(); $$('#drawer .app').forEach(a => a.style.display = APPS[a.dataset.app].name.toLowerCase().includes(q) ? '' : 'none'); };
  }

  /* ---------- tasks (apps) ---------- */
  function open(id, arg) {
    const app = APPS[id]; if (!app) return; if (locked || off) return; closePanels(true);
    let t = tasks.find(x => x.app === id);
    if (!t) { const el = document.createElement('div'); el.className = 'task'; if (app.bgc) el.style.background = app.bgc; el.innerHTML = '<div class="task-body"></div>'; $('#tasks').appendChild(el); t = { id: 't' + (++seq), app: id, el, api: {}, onclose: null }; tasks.push(t); app.render($('.task-body', el), t, arg); }
    else if (arg && t.api && t.api.open) t.api.open(arg);
    show(t); return t;
  }
  function show(t) {
    tasks.forEach(x => x.el.style.display = x === t ? 'flex' : 'none'); cur = t.id; tasks.splice(tasks.indexOf(t), 1); tasks.push(t);
    closePanels(true); setImmersive(!!t.el.querySelector('.yt.full')); bars();
  }
  function goHome() { if (locked || off) return; closePanels(true); tasks.forEach(x => x.el.style.display = 'none'); cur = null; setImmersive(false); bars(); }
  function closeTask(id) {
    const t = tasks.find(x => x.id === id); if (!t) return; if (t.onclose) t.onclose(); t.el.remove(); tasks.splice(tasks.indexOf(t), 1);
    if (cur === id) { cur = null; setImmersive(false); } bars(); if (panel === 'recents') buildRecents();
  }
  function back() {
    if (locked || off) return; if (panel) return closePanels();
    const t = curTask(); if (!t) return; if (t.api && t.api.back && t.api.back()) return; if (imm) return setImmersive(false); closeTask(t.id);
  }

  /* ---------- panels: drawer, recents, shade ---------- */
  function closePanels(silent) { ['drawer', 'recents', 'shade'].forEach(p => $('#' + p).classList.add('hidden')); panel = null; if (!silent) bars(); }
  function openPanel(p) {
    if (locked || off) return; if (panel === p) return closePanels(); closePanels(true); $('#' + p).classList.remove('hidden'); panel = p;
    if (p === 'drawer') { if (cur) { tasks.forEach(x => x.el.style.display = 'none'); cur = null; setImmersive(false); } buildDrawer(); } if (p === 'recents') buildRecents(); if (p === 'shade') buildShade(); bars();
  }
  function buildRecents() {
    const l = [...tasks].reverse();
    $('#recents').innerHTML = l.length ? `<div class="rc-row">${l.map(t => `<div class="rc" data-t="${t.id}"><div class="rc-h"><div class="ic" style="background:${APPS[t.app].bg}">${iconHTML(t.app)}</div>${APPS[t.app].name}</div><div class="rc-b"><div class="ic" style="background:${APPS[t.app].bg}">${iconHTML(t.app)}</div></div><button class="rc-x" data-x="${t.id}">✕</button></div>`).join('')}</div><button class="rc-clear" data-clear>Clear all</button>` : '<div class="rc-empty">No recent items</div>';
  }
  const TILES = [['wifi', '📶', 'Internet', s => s.wifi && !s.plane, s => s.wifi && !s.plane ? 'Virtual-WiFi' : 'Off'], ['bt', '🔵', 'Bluetooth', s => s.bt && !s.plane, s => s.bt && !s.plane ? 'On' : 'Off'], ['flash', '🔦', 'Flashlight', s => s.flash, s => s.flash ? 'On (demo)' : 'Off'],
    ['dnd', '🌙', 'Do Not Disturb', s => s.dnd, s => s.dnd ? 'On' : 'Off'], ['plane', '✈️', 'Airplane mode', s => s.plane, s => s.plane ? 'On' : 'Off'], ['dark', '🌓', 'Dark theme', s => s.dark, s => s.dark ? 'On' : 'Off'],
    ['saver', '🔋', 'Battery Saver', s => s.saver, s => s.saver ? 'On' : 'Off'], ['land', '🔄', 'Landscape', () => land, () => land ? 'On' : 'Off']];
  function buildShade() {
    const d = new Date(), h = d.getHours() % 12 || 12;
    $('#shade').innerHTML = `<div class="sh-p"><div class="sh-t"><b>${h}:${String(d.getMinutes()).padStart(2, '0')}</b><span>${DAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MON[d.getMonth()].slice(0, 3)}</span></div>
      <div class="qs">${TILES.map(t => `<button class="qt ${t[3](settings) ? 'on' : ''}" data-q="${t[0]}"><span>${t[1]}</span><span>${t[2]}<small>${t[4](settings)}</small></span></button>`).join('')}</div>
      <div class="sh-sl">☀️<input type="range" id="shBr" min="30" max="100" value="${settings.brightness}"></div>
      ${notifs.map(n => `<div class="nf" data-n="${n.id}"><small>${n.icon || '🔔'} ${escH(n.app)}</small><b>${escH(n.title)}</b>${escH(n.text)}<button class="x" data-nx="${n.id}">✕</button></div>`).join('') || '<div class="empty" style="padding:16px">No notifications</div>'}
      <div class="sh-ft"><span class="hint">${notifs.length} notification${notifs.length === 1 ? '' : 's'}</span><button class="btn" data-clear>Clear all</button></div></div>`;
  }

  /* panel events */
  $('#shade').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'), nx = e.target.closest('[data-nx]'), n = e.target.closest('[data-n]');
    if (q) { const k = q.dataset.q; if (k === 'land') rotate(); else if ((k === 'wifi' || k === 'bt') && settings.plane) set({ plane: false, [k]: true }); else set({ [k]: !settings[k] }); return buildShade(); }
    if (nx) { const i = notifs.findIndex(x => x.id == nx.dataset.nx); if (i > -1) notifs.splice(i, 1); return buildShade(); }
    if (e.target.closest('[data-clear]')) { notifs.length = 0; return buildShade(); }
    if (n) { const x = notifs.find(y => y.id == n.dataset.n), id = x && idByName(x.app); if (x) notifs.splice(notifs.indexOf(x), 1); closePanels(); if (id) open(id); return; }
    if (!e.target.closest('.sh-p')) closePanels();
  });
  $('#shade').addEventListener('input', e => { if (e.target.id === 'shBr') set({ brightness: +e.target.value }); });
  $('#recents').addEventListener('click', e => {
    const x = e.target.closest('[data-x]'), c = e.target.closest('[data-t]');
    if (x) return closeTask(x.dataset.x); if (e.target.closest('[data-clear]')) { [...tasks].forEach(t => closeTask(t.id)); return buildRecents(); }
    if (c) { const t = tasks.find(y => y.id === c.dataset.t); if (t) show(t); return; } closePanels();
  });
  document.addEventListener('click', e => { const a = e.target.closest('#home [data-app], #drawer [data-app]'); if (a) open(a.dataset.app); });
  $('#drawerBtn').onclick = () => openPanel('drawer'); $('#hsearch').onclick = () => open('chrome', { focus: true }); $('#glance').onclick = () => open('calendar');
  $('#nav').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (!b) return; const n = b.dataset.n; if (n === 'back') back(); if (n === 'home') goHome(); if (n === 'recents') openPanel('recents'); });
  $('#status').addEventListener('click', () => openPanel('shade'));
  /* drag gestures: up on the home screen = app drawer, down on the status bar = quick settings */
  let g = null;
  $('#home').addEventListener('pointerdown', e => { g = { y: e.clientY }; }); $('#home').addEventListener('pointerup', e => { if (g && g.y - e.clientY > 60) openPanel('drawer'); g = null; });
  $('#status').addEventListener('pointerdown', e => { g = { y: e.clientY, s: 1 }; }); document.addEventListener('pointerup', e => { if (g && g.s && e.clientY - g.y > 30) openPanel('shade'); if (g && g.s) g = null; });

  /* ---------- notifications ---------- */
  function notify(app, title, text, icon) {
    notifs.unshift({ id: nid++, app, title, text, icon }); renderLockNotifs(); if (panel === 'shade') buildShade();
    if (settings.dnd || locked || off) return; const b = document.createElement('div'); b.className = 'bn'; b.innerHTML = `<small>${icon || '🔔'} ${escH(app)}</small><b>${escH(title)}</b>${escH(text)}`;
    b.onclick = () => { b.remove(); const id = idByName(app); if (id) open(id); }; $('#banners').appendChild(b); setTimeout(() => b.remove(), 4200);
  }
  const renderLockNotifs = () => { $('#lkNotif').innerHTML = notifs.slice(0, 2).map(n => `<div><b>${escH(n.app)}</b> · ${escH(n.title)}</div>`).join(''); };

  /* ---------- lock + power ---------- */
  const unlock = () => { if (off) return; $('#lock').classList.add('up'); locked = false; bars(); };
  const power = () => { if (!off) { off = true; locked = true; closePanels(true); $('#off').classList.remove('hidden'); $('#lock').classList.remove('up'); } else { off = false; $('#off').classList.add('hidden'); } bars(); };
  $('#lock').addEventListener('click', unlock);
  let lg = null; $('#lock').addEventListener('pointerdown', e => { lg = e.clientY; }); $('#lock').addEventListener('pointerup', e => { if (lg !== null && lg - e.clientY > 50) unlock(); lg = null; });
  $('#wake').onclick = power; $('#tPwr').onclick = power; $('#sPwr').onclick = power;

  /* ---------- tools, keyboard, resize ---------- */
  $('#tHome').onclick = () => { location.href = '../../index.html'; }; $('#tRot').onclick = rotate;
  $('#tFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); };
  document.addEventListener('fullscreenchange', () => $('#tFull').classList.toggle('on', !!document.fullscreenElement));
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.key === 'Escape') { if (!locked && !off) back(); return; } if (typing) return;
    if (locked && !off && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp')) { e.preventDefault(); return unlock(); }
    const k = e.key.toLowerCase(); if (k === 'r') rotate(); else if (k === 'h') goHome(); else if (k === 'n') openPanel('shade');
  });
  addEventListener('resize', fit);

  /* ---------- boot ---------- */
  buildHome(); apply(); fit(); tick(); renderLockNotifs(); setInterval(tick, 1000);
  return { open, notify, rotate, setImmersive, set, goHome, back, get settings() { return settings; }, get land() { return land; } };
})();

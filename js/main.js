/* ===== Windows 11 Web — OS core: windows, taskbar, start menu, tray panels ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- Small line icons (SVG) ---------- */
const svg = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICON = {
  wifi: svg('<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5.5 12.8a10 10 0 0 1 13 0"/><path d="M9 16.4a5 5 0 0 1 6 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/>', 17),
  wifiOff: svg('<path d="M2 9a15 15 0 0 1 20 0" opacity=".4"/><path d="M5.5 12.8a10 10 0 0 1 13 0" opacity=".4"/><path d="M9 16.4a5 5 0 0 1 6 0" opacity=".4"/><path d="M3 3l18 18"/>', 17),
  vol: svg('<path d="M3 9v6h4l5 4V5L7 9z"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M19 6a9 9 0 0 1 0 12"/>', 17),
  mute: svg('<path d="M3 9v6h4l5 4V5L7 9z"/><path d="M17 9l5 6M22 9l-5 6"/>', 17),
  chevU: svg('<path d="M5 15l7-7 7 7"/>', 14), chevD: svg('<path d="M5 9l7 7 7-7"/>', 12),
  chevR: svg('<path d="M9 5l7 7-7 7"/>', 14), back: svg('<path d="M15 5l-7 7 7 7"/>', 16),
  gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>', 18),
  pencil: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', 17),
  plane: svg('<path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>', 20),
  hotspot: svg('<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19 5a10 10 0 0 1 0 14M5 19A10 10 0 0 1 5 5"/>', 20),
  moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', 18),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 20),
  access: svg('<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8.5l7 1.5 7-1.5M12 10v5l-3.5 6M12 15l3.5 6"/>', 20),
  shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', 16)
};
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');

const OS = (() => {
  const wins = new Map();
  let z = 10, counter = 0, focused = null;
  /* Taskbar me sirf Start + jo apps khule hain wo dikhte hain. Kuch pin karna ho to yahan id likho, e.g. ['explorer'] */
  const pinned = [];
  const desktopIcons = [['🗑️', 'Recycle Bin', null], ['🖥️', 'This PC', 'explorer', { path: [] }], ['📁', 'Documents', 'explorer', null],
                        ['🌐', 'Microsoft Edge', 'edge'], ['📝', 'Notepad', 'notepad'], ['⬛', 'Terminal', 'terminal']];

  /* ---------- Persistent settings ---------- */
  let settings = { dark: true, wall: '1', accent: '#0067c0', brightness: 100 };
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem('w11_settings_v2')) }; } catch (e) {}
  function apply() {
    document.body.classList.toggle('dark', settings.dark);
    document.documentElement.style.setProperty('--accent', settings.accent);
    $('#desktop').style.background = WALLS[settings.wall];
    $('#lock').style.background = WALLS[settings.wall];
    $('#dim').style.background = `rgba(0,0,0,${(100 - settings.brightness) / 140})`;
  }
  function set(patch) { Object.assign(settings, patch); localStorage.setItem('w11_settings_v2', JSON.stringify(settings)); apply(); }

  /* ---------- System state (tray / quick settings) ---------- */
  const sys = { wifi: true, airplane: false, hotspot: false, night: false, focus: false, volume: 70, net: 'WEB-WiFi', lang: 0, qview: 'main', calOff: 0, calOpen: true };
  const LANGS = [{ n: 'English (United States)', s: 'English (India)' }, { n: 'English (India)', s: 'English (India)' }];
  const NETS = [['WEB-WiFi', 'Secured'], ['Home_5G', 'Secured'], ['Guest_Network', 'Open'], ['Cafe_Free_WiFi', 'Open']];
  const notifs = [
    { id: 1, app: 'Windows Security', icon: ICON.shield, title: 'Update virus protection', text: 'Virus protection is out of date. Tap or click to update Microsoft Defender Antivirus.' },
    { id: 2, app: 'Tips', icon: '💡', title: 'Welcome to Windows 11 Web', text: 'Right-click on the desktop to change wallpaper or switch dark/light mode.' }
  ];
  let nid = 10;

  /* ---------- Window manager ---------- */
  function open(id, arg) {
    const app = APPS[id]; if (!app) return;
    if (app.single) for (const w of wins.values()) if (w.app === id) { focus(w); return w; }
    const n = counter++, el = document.createElement('div');
    el.className = 'win';
    const w = { id: 'w' + n, app: id, el, min: false, max: false, title: app.name };
    el.style.width = Math.min(app.w || 640, innerWidth - 16) + 'px';
    el.style.height = Math.min(app.h || 420, innerHeight - 70) + 'px';
    el.style.left = Math.max(0, Math.min(60 + (n % 8) * 28, innerWidth - 300)) + 'px';
    el.style.top = (24 + (n % 8) * 28) + 'px';
    el.innerHTML = `<div class="tb"><span class="ti">${app.icon}</span><span class="tt">${app.name}</span><div class="tc"><button class="mn" title="Minimize">—</button><button class="mx" title="Maximize">▢</button><button class="cl" title="Close">✕</button></div></div><div class="wb"></div><div class="rz"></div>`;
    w.setTitle = t => { w.title = t; $('.tt', el).textContent = t; renderTaskbar(); };
    $('#windows').appendChild(el);
    wins.set(w.id, w);
    el.addEventListener('pointerdown', () => focus(w), true);
    $('.mn', el).onclick = () => minimize(w);
    $('.mx', el).onclick = () => toggleMax(w);
    $('.cl', el).onclick = () => close(w.id);
    $('.tb', el).ondblclick = e => { if (!e.target.closest('.tc')) toggleMax(w); };
    dragify(w); resizify(w);
    app.render($('.wb', el), w, arg);
    focus(w); renderTaskbar();
    return w;
  }
  function focus(w) {
    if (w.min) { w.min = false; w.el.style.display = ''; }
    w.el.style.zIndex = ++z; focused = w.id;
    wins.forEach(o => o.el.classList.toggle('active', o === w));
    renderTaskbar();
  }
  function minimize(w) {
    w.min = true; w.el.style.display = 'none';
    const next = [...wins.values()].filter(o => !o.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    focused = next ? next.id : null; wins.forEach(o => o.el.classList.toggle('active', o === next)); renderTaskbar();
  }
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); $('.mx', w.el).textContent = w.max ? '❐' : '▢'; }
  function close(id) {
    const w = wins.get(id); if (!w) return;
    if (w.onclose) w.onclose();
    w.el.remove(); wins.delete(id); if (focused === id) focused = null; renderTaskbar();
  }
  function dragify(w) {
    const tb = $('.tb', w.el);
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.tc')) return;
      const sx = e.clientX, sy = e.clientY;
      if (w.max) { toggleMax(w); w.el.style.left = (e.clientX - w.el.offsetWidth / 2) + 'px'; w.el.style.top = '0px'; }
      const ox = parseFloat(w.el.style.left) || 0, oy = parseFloat(w.el.style.top) || 0;
      tb.setPointerCapture(e.pointerId);
      const mv = ev => { w.el.style.left = (ox + ev.clientX - sx) + 'px'; w.el.style.top = Math.max(0, oy + ev.clientY - sy) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
    });
  }
  function resizify(w) {
    const h = $('.rz', w.el);
    h.addEventListener('pointerdown', e => {
      e.stopPropagation(); focus(w); h.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight;
      const mv = ev => { w.el.style.width = Math.max(260, ow + ev.clientX - sx) + 'px'; w.el.style.height = Math.max(160, oh + ev.clientY - sy) + 'px'; };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    });
  }

  /* ---------- Taskbar (sirf khule hue apps) ---------- */
  function renderTaskbar() {
    const ids = [...pinned];
    wins.forEach(w => { if (!ids.includes(w.app)) ids.push(w.app); });
    $('#taskApps').innerHTML = ids.map(id => {
      const ws = [...wins.values()].filter(w => w.app === id);
      const cls = ws.length ? ' open' + (ws.some(w => w.id === focused && !w.min) ? ' focus' : '') : '';
      return `<button class="tapp${cls}" data-app="${id}" title="${APPS[id].name}">${APPS[id].icon}</button>`;
    }).join('');
  }
  $('#taskApps').addEventListener('click', e => {
    const b = e.target.closest('.tapp'); if (!b) return;
    const id = b.dataset.app, ws = [...wins.values()].filter(w => w.app === id);
    closeFlyouts();
    if (!ws.length) return open(id);
    const top = ws.sort((a, c) => c.el.style.zIndex - a.el.style.zIndex)[0];
    (top.id === focused && !top.min) ? minimize(top) : focus(top);
  });

  /* ---------- Flyout handling ---------- */
  const flyouts = ['#start', '#quick', '#overflow', '#lang', '#notifCenter'];
  function closeFlyouts(except) { flyouts.forEach(f => { if (f !== except) $(f).classList.add('hidden'); }); $('#ctx').classList.add('hidden'); }
  function toggle(sel) { const el = $(sel), was = el.classList.contains('hidden'); closeFlyouts(); el.classList.toggle('hidden', !was); return was; }
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.flyout,#notifCenter,#taskbar,#ctx')) closeFlyouts(); });

  /* ---------- Start menu ---------- */
  function buildStart() {
    $('#pinnedGrid').innerHTML = Object.entries(APPS).map(([id, a]) => `<button class="gitem" data-app="${id}"><span class="em">${a.icon}</span>${a.name}</button>`).join('');
    $('#recList').innerHTML = ['readme.txt', 'todo.txt'].map(n => `<button class="recitem" data-file="${n}"><span class="em">📄</span>${n}</button>`).join('');
  }
  $('#start').addEventListener('click', e => {
    const g = e.target.closest('[data-app]'), f = e.target.closest('[data-file]');
    if (g) { open(g.dataset.app); closeFlyouts(); }
    if (f) { const p = [...HOME, 'Documents'], n = f.dataset.file; open('notepad', { name: n, path: p, content: FS.get(p)[n] }); closeFlyouts(); }
  });
  $('#startSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#pinnedGrid .gitem').forEach(b => b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
  $('#startSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = $$('#pinnedGrid .gitem').find(b => b.style.display !== 'none'); if (v) { open(v.dataset.app); closeFlyouts(); } }
  });
  $('#startBtn').onclick = e => { e.stopPropagation(); if (toggle('#start')) { const s = $('#startSearch'); s.value = ''; s.dispatchEvent(new Event('input')); s.focus(); } };
  $('#btnLock').onclick = () => { closeFlyouts(); $('#lock').classList.remove('up'); };
  $('#btnRestart').onclick = () => location.reload();
  $('#btnShutdown').onclick = () => { closeFlyouts(); $('#off').classList.remove('hidden'); };
  $('#powerOn').onclick = () => { $('#off').classList.add('hidden'); $('#lock').classList.remove('up'); };

  /* ---------- Tray: ^ hidden icons ---------- */
  const hiddenIcons = [['✦', 'Copilot'], ['🛡️', 'Windows Security'], ['🖧', 'Network'], ['🔷', 'Bluetooth devices'], ['🔌', 'Safely Remove Hardware'], ['🔄', 'Sync'], ['📊', 'Audio Meter'], ['🌀', 'Microsoft Edge Update']];
  $('#overflow').innerHTML = hiddenIcons.map(h => `<button title="${h[1]}">${h[0]}</button>`).join('');
  $('#overflow').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; closeFlyouts(); if (b.title === 'Windows Security') openNotifs(); });
  $('#trayOverflow').onclick = e => {
    e.stopPropagation();
    if (toggle('#overflow')) {
      const el = $('#overflow'), r = $('#trayOverflow').getBoundingClientRect();
      el.style.left = Math.max(8, Math.min(innerWidth - el.offsetWidth - 8, r.left + r.width / 2 - el.offsetWidth / 2)) + 'px';
    }
  };

  /* ---------- Tray: keyboard layout ---------- */
  function renderLang() {
    $('#lang').innerHTML = `<div class="kb-head">Keyboard layout <span class="chip">⊞</span><span class="chip">Spacebar</span></div>` +
      LANGS.map((l, i) => `<div class="kb-item ${i === sys.lang ? 'on' : ''}" data-l="${i}"><span class="kb-code">ENG</span><div>${l.n}<small>${l.s}</small></div></div>`).join('') +
      `<div class="kb-foot" data-more>More keyboard settings</div>`;
  }
  $('#lang').addEventListener('click', e => {
    const l = e.target.closest('[data-l]');
    if (l) { sys.lang = +l.dataset.l; renderLang(); setTimeout(closeFlyouts, 150); }
    if (e.target.closest('[data-more]')) { closeFlyouts(); open('settings'); }
  });
  $('#trayLang').onclick = e => { e.stopPropagation(); if (toggle('#lang')) renderLang(); };

  /* ---------- Tray: quick settings (Wi-Fi / volume) ---------- */
  const tile = (k, ico, label, on, chev) => `<div class="qt"><div class="qbtn ${on ? 'on' : ''}">
      <button data-q="${k}">${ICON[ico]}${k === 'access' ? ICON.chevR : ''}</button>${chev ? `<button class="qchev" data-qc="${k}">${ICON.chevR}</button>` : ''}</div><span>${label}</span></div>`;
  function renderQuick() {
    const q = $('#quick');
    if (sys.qview === 'wifi') {
      q.innerHTML = `<div class="q-head"><button data-qback>${ICON.back}</button>Wi-Fi</div>` +
        (sys.wifi && !sys.airplane ? NETS.map(n => `<div class="net ${n[0] === sys.net ? 'on' : ''}" data-net="${n[0]}">${ICON.wifi}<div>${n[0]}<small>${n[0] === sys.net ? 'Connected, secured' : n[1]}</small></div></div>`).join('')
          : `<div class="n-empty">Wi-Fi is off</div>`) +
        `<div class="net-link" data-act="settings">More Wi-Fi settings</div>`;
      return;
    }
    q.innerHTML = `<div class="q-body"><div class="q-grid">
      ${tile('wifi', sys.wifi && !sys.airplane ? 'wifi' : 'wifiOff', sys.wifi && !sys.airplane ? sys.net : 'Wi-Fi', sys.wifi && !sys.airplane, true)}
      ${tile('airplane', 'plane', 'Airplane mode', sys.airplane)}
      ${tile('night', 'sun', 'Night light', sys.night)}
      ${tile('hotspot', 'hotspot', 'Mobile hotspot', sys.hotspot)}
      ${tile('focus', 'moon', 'Focus assist', sys.focus)}
      ${tile('access', 'access', 'Accessibility', false)}
    </div>
    <div class="q-vol"><button data-q="mute" title="Mute">${sys.volume ? ICON.vol : ICON.mute}</button><input type="range" id="vol" min="0" max="100" value="${sys.volume}"></div></div>
    <div class="q-foot"><button data-act="edit" title="Edit quick settings">${ICON.pencil}</button><button data-act="settings" title="All settings">${ICON.gear}</button></div>`;
  }
  $('#quick').addEventListener('click', e => {
    const t = e.target.closest('[data-q],[data-qc],[data-qback],[data-net],[data-act]'); if (!t) return;
    const d = t.dataset;
    if (d.qback !== undefined) sys.qview = 'main';
    if (d.qc === 'wifi') sys.qview = 'wifi';
    if (d.net) { sys.net = d.net; sys.wifi = true; notify('Network', 'Connected', 'Connected to ' + d.net); }
    if (d.act === 'settings') { closeFlyouts(); open('settings'); return; }
    if (d.act === 'edit') notify('Quick settings', 'Edit mode', 'Editing quick settings is coming in a future version.');
    if (d.q === 'wifi') { if (sys.airplane) sys.airplane = false; sys.wifi = !sys.wifi; }
    if (d.q === 'airplane') { sys.airplane = !sys.airplane; if (sys.airplane) sys.hotspot = false; }
    if (d.q === 'night') { sys.night = !sys.night; $('#night').style.display = sys.night ? 'block' : 'none'; }
    if (d.q === 'hotspot' && !sys.airplane && sys.wifi) sys.hotspot = !sys.hotspot;
    if (d.q === 'focus') sys.focus = !sys.focus;
    if (d.q === 'access') { closeFlyouts(); open('settings'); return; }
    if (d.q === 'mute') sys.volume = sys.volume ? 0 : 70;
    renderQuick(); renderTray();
  });
  $('#quick').addEventListener('input', e => { if (e.target.id === 'vol') { sys.volume = +e.target.value; renderTray(); const b = $('[data-q=mute]', $('#quick')); if (b) b.innerHTML = sys.volume ? ICON.vol : ICON.mute; } });
  $('#trayQuick').onclick = e => { e.stopPropagation(); if (toggle('#quick')) { sys.qview = 'main'; renderQuick(); } };
  function renderTray() {
    $('#icoWifi').innerHTML = sys.airplane ? ICON.plane.replace(/width="20" height="20"/, 'width="16" height="16"') : (sys.wifi ? ICON.wifi : ICON.wifiOff);
    $('#icoVol').innerHTML = sys.volume ? ICON.vol : ICON.mute;
  }

  /* ---------- Notifications + calendar (date/time button) ---------- */
  function renderNotifs() {
    const groups = {};
    notifs.forEach(n => (groups[n.app] = groups[n.app] || []).push(n));
    $('#notifPanel').innerHTML = `<div class="n-head">Notifications <button data-clear>Clear all</button></div>
      <div class="n-focus" data-focus>${ICON.moon} Focus assist settings</div>
      <div id="notifList">${notifs.length ? Object.entries(groups).map(([app, list]) => `<div class="n-group">${list[0].icon} ${app}</div>` +
        list.map(n => `<div class="nc" data-n="${n.id}"><b>${n.title}</b><span>${n.text}</span><button class="x" data-x="${n.id}" title="Dismiss">✕</button></div>`).join('')).join('')
        : '<div class="n-empty">No new notifications</div>'}</div>`;
    const b = $('#badge'); b.textContent = notifs.length || '';
  }
  $('#notifPanel').addEventListener('click', e => {
    if (e.target.closest('[data-clear]')) { notifs.length = 0; }
    else if (e.target.closest('[data-focus]')) { sys.focus = !sys.focus; $('[data-focus]').lastChild.textContent = sys.focus ? ' Focus assist: ON (toasts muted)' : ' Focus assist: OFF'; return; }
    else if (e.target.dataset.x) { const i = notifs.findIndex(n => n.id == e.target.dataset.x); if (i > -1) notifs.splice(i, 1); }
    else if (e.target.closest('.nc')) { const n = notifs.find(n => n.id == e.target.closest('.nc').dataset.n); if (n) { notifs.splice(notifs.indexOf(n), 1); if (n.app === 'Windows Security') notify('Windows Security', 'Virus protection updated', 'Microsoft Defender Antivirus is up to date.'); } }
    renderNotifs();
  });
  function notify(app, title, text) {
    const icon = app === 'Windows Security' ? ICON.shield : app === 'Notepad' ? '📝' : app === 'Network' ? ICON.wifi.replace(/width="17" height="17"/, 'width="16" height="16"') : '🔔';
    notifs.unshift({ id: nid++, app, icon, title, text }); renderNotifs();
    if (sys.focus) return;
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<small>${app}</small><b>${title}</b>${text}`;
    $('#toasts').appendChild(t); setTimeout(() => t.remove(), 4200);
  }
  function renderCal() {
    const now = new Date(), v = new Date(now.getFullYear(), now.getMonth() + sys.calOff, 1);
    const start = new Date(v); start.setDate(1 - v.getDay());
    let cells = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => `<span class="dh">${x}</span>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const today = d.toDateString() === now.toDateString();
      cells += `<span class="${d.getMonth() !== v.getMonth() ? 'dim' : ''} ${today ? 'today' : ''}">${d.getDate()}</span>`;
    }
    $('#calPanel').innerHTML = `<div class="cal-head"><span>${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}</span><button data-cal="toggle">${sys.calOpen ? ICON.chevD : ICON.chevU}</button></div>` +
      (sys.calOpen ? `<div class="cal-nav"><b>${MONTHS[v.getMonth()]}, ${v.getFullYear()}</b><button data-cal="prev">▲</button><button data-cal="next">▼</button></div><div class="cal-grid">${cells}</div>` : '');
  }
  $('#calPanel').addEventListener('click', e => {
    const c = e.target.closest('[data-cal]'); if (!c) return;
    if (c.dataset.cal === 'prev') sys.calOff--;
    if (c.dataset.cal === 'next') sys.calOff++;
    if (c.dataset.cal === 'toggle') sys.calOpen = !sys.calOpen;
    renderCal();
  });
  function openNotifs() { closeFlyouts(); sys.calOff = 0; renderNotifs(); renderCal(); $('#notifCenter').classList.remove('hidden'); }
  $('#trayClock').onclick = e => { e.stopPropagation(); if ($('#notifCenter').classList.contains('hidden')) openNotifs(); else closeFlyouts(); };

  /* ---------- Clock ---------- */
  function tick() {
    const d = new Date(), h = d.getHours() % 12 || 12, ap = d.getHours() >= 12 ? 'PM' : 'AM';
    $('#tbTime').textContent = `${pad(h)}:${pad(d.getMinutes())} ${ap}`;
    $('#tbDate').textContent = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
    $('#lockTime').textContent = `${h}:${pad(d.getMinutes())}`;
    $('#lockDate').textContent = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  }

  /* ---------- Desktop ---------- */
  function buildDesktop() {
    $('#icons').innerHTML = desktopIcons.map((d, i) => `<div class="dicon" data-i="${i}"><span class="em">${d[0]}</span>${d[1]}</div>`).join('');
  }
  $('#icons').addEventListener('click', e => { $$('.dicon').forEach(x => x.classList.remove('sel')); const d = e.target.closest('.dicon'); if (d) d.classList.add('sel'); });
  $('#icons').addEventListener('dblclick', e => {
    const d = e.target.closest('.dicon'); if (!d) return;
    const [, name, app, arg] = desktopIcons[d.dataset.i];
    if (!app) return notify('File Explorer', name, name + ' is empty.');
    open(app, arg === undefined ? null : arg);
  });
  $('#desktop').addEventListener('pointerdown', e => { if (e.target.id === 'desktop' || e.target.id === 'icons') $$('.dicon').forEach(x => x.classList.remove('sel')); });

  /* ---------- Right-click menus ---------- */
  function showCtx(x, y, items) {
    const c = $('#ctx');
    c.innerHTML = items.map(i => i === '-' ? '<hr>' : `<div data-c="${i[2]}"><span class="ci">${i[0]}</span>${i[1]}</div>`).join('');
    c.classList.remove('hidden');
    c.style.left = Math.max(4, Math.min(x, innerWidth - c.offsetWidth - 6)) + 'px';
    c.style.top = Math.max(4, Math.min(y, innerHeight - c.offsetHeight - 6)) + 'px';
  }
  document.addEventListener('contextmenu', e => {
    e.preventDefault(); closeFlyouts();
    if (e.target.closest('.win,.flyout,#notifCenter,#start')) return;
    if (e.target.closest('#taskbar')) {
      const app = e.target.closest('.tapp');
      return showCtx(e.clientX, e.clientY - 90, app ? [['✕', 'Close all windows of this app', 'closeapp:' + app.dataset.app]] : [['📊', 'Task Manager', 'tm'], ['⚙️', 'Taskbar settings', 'pers']]);
    }
    showCtx(e.clientX, e.clientY, [['🔄', 'Refresh', 'refresh'], ['🖼️', 'Next wallpaper', 'wall'], ['🌓', 'Switch dark / light mode', 'dark'], '-',
      ['⬛', 'Open in Terminal', 'term'], ['🖥️', 'Display settings', 'pers'], ['🎨', 'Personalize', 'pers']]);
  });
  $('#ctx').addEventListener('click', e => {
    const a = (e.target.closest('[data-c]') || {}).dataset; if (!a) return;
    const c = a.c;
    if (c === 'refresh') { $('#icons').style.opacity = 0; setTimeout(() => $('#icons').style.opacity = 1, 140); }
    if (c === 'wall') set({ wall: String(settings.wall % 4 + 1) });
    if (c === 'dark') set({ dark: !settings.dark });
    if (c === 'term') open('terminal');
    if (c === 'pers') open('settings');
    if (c === 'tm') open('taskmgr');
    if (c.startsWith('closeapp:')) [...wins.values()].filter(w => w.app === c.split(':')[1]).forEach(w => close(w.id));
    closeFlyouts();
  });

  /* ---------- Keyboard & lock screen ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFlyouts();
    if (e.key === 'Meta') { e.preventDefault(); $('#startBtn').click(); }
  });
  const unlock = () => $('#lock').classList.add('up');
  $('#lock').addEventListener('click', unlock);
  document.addEventListener('keydown', () => { if (!$('#lock').classList.contains('up')) unlock(); });

  /* ---------- Boot ---------- */
  $$('[data-ico]').forEach(el => el.innerHTML = ICON[el.dataset.ico]);
  buildDesktop(); buildStart(); renderTaskbar(); renderTray(); renderNotifs(); apply(); tick(); setInterval(tick, 1000);

  return { open, close, notify, list: () => [...wins.values()], get settings() { return settings; }, set };
})();

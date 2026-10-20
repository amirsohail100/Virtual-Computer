/* ===== iOS (Virtual) — OS core: phone frame, rotation, home, app tasks, switcher, control center, dynamic island ===== */
const SI = {
  signal: '<svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect y="7" width="3" height="4" rx=".8"/><rect x="4.7" y="5" width="3" height="6" rx=".8"/><rect x="9.4" y="2.5" width="3" height="8.5" rx=".8"/><rect x="14" width="3" height="11" rx=".8"/></svg>',
  wifi: (w = 16, h = 12) => `<svg width="${w}" height="${h}" viewBox="0 0 24 18" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M2 6.5a14 14 0 0 1 20 0"/><path d="M6 11a8.5 8.5 0 0 1 12 0"/><circle cx="12" cy="15.5" r="1.2" fill="currentColor"/></svg>`,
  bat: (l, c) => `<svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="${Math.max(1, 18 * l / 100)}" height="8" rx="2" fill="${l <= 20 ? '#ff453a' : c ? '#30d158' : 'currentColor'}"/><rect x="22.5" y="4" width="1.6" height="4" rx=".8" fill="currentColor" opacity=".5"/></svg>`
};
const NOTES = [['Messages', 'Aarav', 'Are you free tonight? 🎉', '💬'], ['Calendar', 'Reminder', 'Team meeting in 10 minutes', '📅'], ['Weather', 'Rain expected', 'Light showers around 6 PM', '⛅'], ['Clock', 'Timer', 'Your timer has ended', '🕒'], ['Notes', 'Reminder', 'Buy groceries', '📝']];

const OS = (() => {
  const tasks = [], notifs = []; let seq = 0, cur = null, land = false, locked = true, off = false, panel = null, playing = false, rotating = false, isT = 0, bat = { l: 87, c: false }, g = null, ds = null;
  const S = { wall: 'w1', dark: false, wifi: true, bt: true, cell: true, plane: false, hot: false, dnd: false, flash: false, rot: false, brightness: 100, vol: 60, ...jget('i_settings1', {}) };
  const curTask = () => tasks.find(t => t.id === cur), idByName = n => Object.keys(APPS).find(k => APPS[k].name === n);
  const dockIds = ['phone', 'safari', 'messages', 'notes'];

  /* ---------- settings, bars, scale ---------- */
  function bars() {
    const t = curTask(); let light = true;
    if (!(locked || off || panel)) light = t ? !!APPS[t.app].dark || S.dark : !$('#screen').classList.contains('lightwall');
    const s = $('#screen'); s.classList.toggle('barlight', light); s.classList.toggle('bardark', !light);
  }
  function renderStatus() {
    let h = ''; if (S.dnd) h += '<span>🌙</span>';
    if (S.plane) h += '<span>✈</span>'; else { if (S.cell) h += SI.signal; if (S.wifi) h += SI.wifi(); if (S.hot) h += '<span title="Hotspot">🔗</span>'; }
    $('#stIcons').innerHTML = h + `<span style="display:flex;gap:3px;align-items:center">${SI.bat(bat.l, bat.c)}</span>`;
  }
  /* wallpaper: built-in SVG or a photo from the device storage ("u:<id>") */
  let wallKey = null, wallUrl = null;
  const lum = url => new Promise(r => { const i = new Image(); i.onload = () => { try { const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'); x.drawImage(i, 0, 0, 8, 8); const d = x.getImageData(0, 0, 8, 8).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += .299 * d[k] + .587 * d[k + 1] + .114 * d[k + 2]; r(s / 64 > 165); } catch (e) { r(false); } }; i.onerror = () => r(false); i.src = url; });
  async function applyWall() {
    if (wallKey === S.wall) return; wallKey = S.wall; let url = null, light = false;
    if (S.wall.startsWith('u:')) { try { const f = await FS.get(S.wall.slice(2)); if (f) url = URL.createObjectURL(f.blob); } catch (e) {} }
    if (url) { if (wallUrl) URL.revokeObjectURL(wallUrl); wallUrl = url; light = await lum(url); }
    else { const w = WALLS.find(x => x.id === S.wall) || WALLS[0]; url = w.img; light = w.light; wallKey = S.wall = w.id; }
    $('#wall').style.backgroundImage = `url("${url}")`; $('#screen').classList.toggle('lightwall', light); bars();
  }
  function apply() {
    $('#screen').classList.toggle('dark', S.dark); $('#dim').style.background = `rgba(0,0,0,${(100 - S.brightness) / 130})`;
    $$('#lock .lb[data-lb=flash]').forEach(x => x.classList.toggle('on', S.flash)); bars(); renderStatus(); applyWall();
  }
  function set(p, quiet) { Object.assign(S, p); jset('i_settings1', S); apply(); tasks.forEach(t => t.api.sync && t.api.sync()); if (panel === 'cc' && !quiet) buildCC(); }
  function fit(l = land, turning = false) { const W = l ? 808 : 388, H = l ? 388 : 808, lim = turning ? (Math.min(innerWidth - 110, innerHeight - 26) - 16) / 896 : 9;
    $('#phoneWrap').style.setProperty('--k', Math.max(.3, Math.min(1, lim, (innerWidth - 110) / W, (innerHeight - 26) / H))); }
  /* Rotate like a real phone: the whole phone turns 90 degrees, then the screen switches to the landscape layout */
  function rotate() {
    if (rotating) return; rotating = true;
    const toLand = !land, ph = $('#phone'), sc = $('#screen'); let finished = false;
    $('#phoneWrap').style.transition = 'transform .22s ease-out'; fit(toLand, true);
    ph.style.transition = 'transform .6s cubic-bezier(.45,0,.2,1)'; ph.style.transform = `rotate(${toLand ? -90 : 90}deg)`;
    const done = () => {
      if (finished) return; finished = true; ph.removeEventListener('transitionend', onEnd);
      ph.style.transition = 'none'; ph.style.transform = ''; land = toLand; ph.classList.toggle('land', land);
      $('#tRot').classList.toggle('on', land); void ph.offsetWidth; ph.style.transition = ''; $('#phoneWrap').style.transition = ''; fit();
      sc.classList.remove('settle'); void sc.offsetWidth; sc.classList.add('settle'); setTimeout(() => { sc.classList.remove('settle'); rotating = false; }, 340);
    };
    const onEnd = e => { if (e.target === ph && e.propertyName === 'transform') done(); }; ph.addEventListener('transitionend', onEnd); setTimeout(done, 800);
  }

  /* ---------- clock + battery ---------- */
  function tick() {
    const d = new Date(), h = d.getHours() % 12 || 12, m = String(d.getMinutes()).padStart(2, '0');
    $('#stTime').textContent = `${h}:${m}`; $('#lkTime').textContent = `${h}:${m}`; $('#lkDate').textContent = `${DAYS[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
  }
  if (navigator.getBattery) navigator.getBattery().then(b => { const u = () => { bat = { l: Math.round(b.level * 100), c: b.charging }; renderStatus(); }; u(); b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); }).catch(() => {});

  /* ---------- dynamic island: battery + notifications at random times ---------- */
  function island(html, cls, fn) {
    if (land || off) return; const i = $('#island'); clearTimeout(isT); i.innerHTML = html; i.className = 'on ' + (cls || ''); i.onclick = fn || null;
    isT = setTimeout(() => { i.className = ''; i.onclick = null; isT = setTimeout(() => { i.innerHTML = ''; }, 380); }, 3800);
  }
  function showBattery() { const l = bat.l; island(`<span style="color:${l <= 20 ? '#ff453a' : bat.c ? '#30d158' : '#fff'}">${SI.bat(l, bat.c)}</span><b>${bat.c ? 'Charging · ' : l <= 20 ? 'Low Battery · ' : ''}${l}%</b>`, 'sm'); }
  function notify(app, title, text, icon) {
    notifs.unshift({ app, title, text, icon }); renderLockNotifs(); if (S.dnd) return; const id = idByName(app);
    island(`<span class="ni" style="background:${id ? APPS[id].bg : '#555'}">${icon || '🔔'}</span><span class="nt"><b>${escH(title)}</b><small>${escH(text)}</small></span>`, '', () => { if (id && !locked) open(id); });
  }
  const renderLockNotifs = () => { $('#lkNotif').innerHTML = notifs.slice(0, 2).map(n => `<div><b>${escH(n.app)}</b> · ${escH(n.title)}<br>${escH(n.text)}</div>`).join(''); };
  function randomEvent() {
    if (!off) { if (Math.random() < .4) { if (!navigator.getBattery) { bat.l = Math.max(5, bat.l - 1); renderStatus(); } showBattery(); } else notify(...NOTES[Math.random() * NOTES.length | 0]); }
    setTimeout(randomEvent, 10000 + Math.random() * 15000);
  }

  /* ---------- home + app tasks ---------- */
  const iconHTML = id => { const a = APPS[id]; return `<div class="ic" data-app="${id}"><i style="background:${a.bg}">${typeof a.html === 'function' ? a.html() : (a.html || a.icon)}</i><span>${a.name}</span></div>`; };
  function buildHome() { $('#hgrid').innerHTML = Object.keys(APPS).filter(k => !dockIds.includes(k)).map(iconHTML).join(''); $('#dock').innerHTML = dockIds.map(iconHTML).join(''); }
  function open(id, arg, from) {
    if (locked || off) return; const a = APPS[id]; let t = tasks.find(x => x.app === id);
    if (!t) { const el = document.createElement('div'); el.className = 'app' + (a.dark ? ' dk' : ''); el.innerHTML = '<div class="abody"></div>'; $('#apps').appendChild(el); t = { id: ++seq, app: id, el, api: {} }; tasks.push(t); a.render($('.abody', el), t, arg); }
    if (from) { const r = from.getBoundingClientRect(), s = $('#screen').getBoundingClientRect(); t.el.style.transformOrigin = `${(r.left + r.width / 2 - s.left) / s.width * 100}% ${(r.top + r.height / 2 - s.top) / s.height * 100}%`; }
    closePanels(true); show(t);
  }
  function show(t) { const p = curTask(); if (p && p !== t && p.api.hide) p.api.hide(); cur = t.id; tasks.forEach(x => x.el.classList.toggle('show', x === t)); $('#home').classList.add('away'); t.api.show && t.api.show(); bars(); }
  function goHome() { const t = curTask(); if (t) { t.el.classList.remove('show'); t.api.hide && t.api.hide(); } cur = null; $('#home').classList.remove('away'); closePanels(); }
  function back() { if (panel) return closePanels(); const t = curTask(); if (t && t.api.back && t.api.back() === true) return; goHome(); }
  function closeTask(id) { const i = tasks.findIndex(t => t.id === id); if (i < 0) return; const t = tasks[i]; t.api.close && t.api.close(); t.el.remove(); tasks.splice(i, 1); if (cur === id) { cur = null; $('#home').classList.remove('away'); } }
  function closePanels(q) { panel = null; $('#cc').classList.remove('open'); $('#switcher').classList.remove('open'); if (!q) bars(); }
  function openPanel(p) {
    if (off || (locked && p !== 'cc')) return; if (panel === p) return closePanels(); closePanels(true); panel = p;
    if (p === 'cc') { buildCC(); $('#cc').classList.add('open'); } else { buildSwitcher(); $('#switcher').classList.add('open'); } bars();
  }
  function buildSwitcher() {
    $('#switcher').innerHTML = tasks.length ? tasks.map(t => { const a = APPS[t.app]; return `<div class="sw" data-t="${t.id}"><div class="swh"><i style="background:${a.bg}">${a.icon}</i>${a.name}<b data-x="${t.id}">✕</b></div><div class="swb" style="background:${a.bg}">${a.icon}</div></div>`; }).join('') : '<p class="empty">No recent apps</p>';
  }

  /* ---------- Control Center ---------- */
  function buildCC() {
    const on = k => !S.plane && S[k] ? ' on' : '', tl = (k, e) => `<div class="tile${S[k] ? ' on' : ''}" data-k="${k}">${e}</div>`;
    $('#cc').innerHTML = `<div class="ccg">
      <div class="blk conn"><i class="cb pl${S.plane ? ' on' : ''}" data-k="plane">✈️</i><i class="cb g${on('cell')}" data-k="cell">📶</i><i class="cb${on('wifi')}" data-k="wifi">${SI.wifi(26, 20)}</i><i class="cb${on('bt')}" data-k="bt"><b style="font-size:22px">ᛒ</b></i></div>
      <div class="blk media"><small>${playing ? 'Now Playing' : 'Not Playing'}</small><b>${playing ? 'Lo‑fi Beats' : '—'}</b><div class="mc"><span data-m="prev">⏮</span><span data-m="play">${playing ? '⏸' : '▶️'}</span><span data-m="next">⏭</span></div></div>
      ${tl('hot', '🔗')}${tl('dnd', '🌙')}${tl('flash', '🔦')}${tl('rot', '🔒')}
      <div class="vs" data-s="brightness"><i style="height:${S.brightness}%"></i><span>☀️</span></div><div class="vs" data-s="vol"><i style="height:${S.vol}%"></i><span>🔊</span></div>
      <div class="blk mini"><i data-open="clock">🕒</i><i data-open="calendar">📅</i><i data-open="calculator">🧮</i><i data-open="camera">📷</i></div></div>`;
  }
  $('#cc').addEventListener('click', e => {
    const k = e.target.closest('[data-k]'), o = e.target.closest('[data-open]'), m = e.target.closest('[data-m]');
    if (k) { const x = k.dataset.k; if (x === 'plane') set({ plane: !S.plane }); else if (['cell', 'wifi', 'bt'].includes(x)) { if (!S.plane) set({ [x]: !S[x] }); } else set({ [x]: !S[x] }); }
    else if (m) { if (m.dataset.m === 'play') { playing = !playing; buildCC(); } }
    else if (o) { closePanels(); if (!locked) open(o.dataset.open); }
    else if (e.target.id === 'cc' || e.target.classList.contains('ccg')) closePanels();
  });
  const slide = e => { const r = ds.getBoundingClientRect(), p = Math.round(Math.min(1, Math.max(0, (r.bottom - e.clientY) / r.height)) * 100), k = ds.dataset.s, v = k === 'brightness' ? Math.max(30, p) : p; ds.firstChild.style.height = v + '%'; set({ [k]: v }, 1); };
  $('#cc').addEventListener('pointerdown', e => { const v = e.target.closest('.vs'); if (v) { ds = v; slide(e); } });
  document.addEventListener('pointermove', e => { if (ds) slide(e); }); document.addEventListener('pointerup', () => { ds = null; });

  /* ---------- gestures: real drags (no text selection) ---------- */
  const scr = $('#screen');
  scr.addEventListener('selectstart', e => { if (!(e.target.parentElement || e.target).closest('input,textarea')) e.preventDefault(); });
  scr.addEventListener('dragstart', e => e.preventDefault());
  scr.addEventListener('pointerdown', e => {
    if (off || rotating || e.target.closest('.lb,.vs')) return; const r = scr.getBoundingClientRect(), k = r.width / (land ? 780 : 360), y = (e.clientY - r.top) / k, x = (e.clientX - r.left) / k, H = r.height / k, W = r.width / k; let z = null;
    if (panel === 'cc') z = 'cc'; else if (locked) z = y < 46 && x > W * .55 ? 'top' : 'lock'; else if (y > H - 30) z = 'bot'; else if (y < 46 && x > W * .55) z = 'top';
    g = z && { z, x: e.clientX, y: e.clientY, k, t: Date.now() };
  });
  document.addEventListener('pointerup', e => {
    if (!g) return; const dy = (e.clientY - g.y) / g.k, dx = (e.clientX - g.x) / g.k, z = g.z, dt = Date.now() - g.t, tap = Math.abs(dy) < 6 && Math.abs(dx) < 6; g = null;
    if (z === 'top' && dy > 25) openPanel('cc');
    else if (z === 'top' && tap) openPanel('cc');
    else if (z === 'lock' && (dy < -50 || tap)) unlock();
    else if (z === 'cc' && dy < -50) closePanels();
    else if (z === 'bot') { if (dy < -40) { if (panel === 'sw') goHome(); else if (cur && dy < -120 && dt > 300) openPanel('sw'); else goHome(); } else if (tap) { if (panel === 'sw') closePanels(); else if (cur) goHome(); } }
  });
  $('#bar').addEventListener('dblclick', () => openPanel('sw'));
  $('#switcher').addEventListener('click', e => {
    const x = e.target.closest('[data-x]'), c = e.target.closest('[data-t]');
    if (x) { closeTask(+x.dataset.x); return buildSwitcher(); } if (c) { const t = tasks.find(y => y.id == c.dataset.t); if (t) { closePanels(true); show(t); } return; } closePanels();
  });
  document.addEventListener('click', e => { const a = e.target.closest('#home [data-app]'); if (a) open(a.dataset.app, null, a.querySelector('i')); });
  $('#island').addEventListener('click', () => {});

  /* ---------- lock + power ---------- */
  const unlock = () => { if (off) return; $('#lock').classList.add('up'); locked = false; bars(); };
  const power = () => { if (!off) { off = true; locked = true; closePanels(true); goHome(); $('#off').classList.remove('hidden'); $('#lock').classList.remove('up'); $('#island').className = ''; } else { off = false; $('#off').classList.add('hidden'); } bars(); };
  $('#lock').addEventListener('click', e => { const l = e.target.closest('.lb'); if (!l) return; if (l.dataset.lb === 'flash') set({ flash: !S.flash }); else { unlock(); open('camera'); } });
  $('#wake').onclick = power; $('#tPwr').onclick = power; $('#sPwr').onclick = power;

  /* ---------- tools, keyboard, resize ---------- */
  $('#tHome').onclick = () => { location.href = '../../index.html'; }; $('#tRot').onclick = rotate;
  $('#tFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(() => {}); };
  document.addEventListener('fullscreenchange', () => $('#tFull').classList.toggle('on', !!document.fullscreenElement));
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.altKey || e.metaKey) return; const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if (e.key === 'Escape') { if (!locked && !off) back(); return; } if (typing) return;
    if (locked && !off && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp')) { e.preventDefault(); return unlock(); }
    const k = e.key.toLowerCase(); if (k === 'r') rotate(); else if (k === 'h') goHome(); else if (k === 'c') openPanel('cc'); else if (k === 's') openPanel('sw');
  });
  addEventListener('resize', () => fit());

  /* drop files anywhere on the page: images -> Photos, others -> Files */
  ['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) FS.import(e.dataTransfer.files); }));

  /* ---------- boot ---------- */
  buildHome(); apply(); fit(); tick(); renderLockNotifs(); setInterval(tick, 1000); setTimeout(randomEvent, 6000);
  return { sync: () => tasks.forEach(t => t.api.sync && t.api.sync()), open, notify, rotate, set, goHome, back, get settings() { return S; }, get land() { return land; } };
})();

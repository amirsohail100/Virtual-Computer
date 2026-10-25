/* ===== Ubuntu (Virtual) — OS core: boot, login, desktop, windows, top bar, dock, activities ===== */
const OS = (() => {
  const S = { wall: 'u1', fit: 'zoom', dark: false, accent: 'orange', brightness: 100, vol: 60, net: true, bt: true, plane: false, dnd: false, night: false, ...jget('ubuntu_settings', {}) }, wins = [], notifs = [], scr = $('#screen');
  let z = 10, seq = 0, cur = null, wallKey = null, wallUrl = null, authed = false, bat = '🔌 AC power';
  const FAVS = ['files', 'browser', 'terminal', 'editor', 'software', 'settings'];

  /* ---------- settings: wallpaper, theme, accent, brightness, night light ---------- */
  async function applyWall() {
    const key = S.wall + '|' + S.fit; if (wallKey === key) return; wallKey = key; let url = '';
    if (S.wall.startsWith('u:')) { try { const f = await FS.get(S.wall.slice(2)); if (f) { url = URL.createObjectURL(f.blob); wallUrl && URL.revokeObjectURL(wallUrl); wallUrl = url; } } catch (e) {} if (!url) { S.wall = 'u1'; url = WALLS[0].img; } }
    else { const w = WALLS.find(x => x.id === S.wall) || WALLS[0]; url = w.img; }
    const d = $('#desktop'), f = S.fit; d.style.backgroundImage = `url("${url}")`; d.style.backgroundSize = f === 'zoom' ? 'cover' : f === 'stretch' ? '100% 100%' : 'auto'; d.style.backgroundRepeat = f === 'tile' ? 'repeat' : 'no-repeat'; d.style.backgroundPosition = 'center';
    $('#login').style.background = `linear-gradient(#140010cc,#140010cc),url("${url}") center/cover`;
  }
  function apply() { scr.classList.toggle('dk', S.dark); ACCENTS.forEach(a => scr.classList.toggle('ac-' + a[0], S.accent === a[0])); $('#dim').style.background = `rgba(0,0,0,${(100 - S.brightness) / 110})`; $('#warm').style.background = S.night ? 'rgba(255,170,90,.9)' : 'rgba(255,255,255,0)'; renderTray(); applyWall(); }
  function set(p) { Object.assign(S, p); jset('ubuntu_settings', S); apply(); wins.forEach(w => w.api.sync && w.api.sync()); if (!$('#popup').classList.contains('hidden') && $('#popup').dataset.k === 'qs') buildQS(); }
  function renderTray() { $('#trNet').textContent = S.plane ? '✈' : S.net ? '🖧' : '⛔'; $('#trVol').textContent = S.vol === 0 ? '🔇' : '🔊'; }
  if (navigator.getBattery) navigator.getBattery().then(b => { const u = () => { bat = (b.charging ? '⚡ Charging ' : '🔋 ') + Math.round(b.level * 100) + '%'; $('#trBat').textContent = bat.split(' ').pop(); }; u(); b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); }).catch(() => {});

  /* ---------- windows ---------- */
  function open(id, arg) {
    const a = APPS[id]; if (!a) return; closeOv(); let w = a.single && wins.find(x => x.id === id);
    if (w) { w.api.arg && arg !== undefined && w.api.arg(arg); restore(w); return focus(w); }
    const el = document.createElement('div'), W = Math.min(a.w || 600, innerWidth - 100), H = Math.min(a.h || 420, innerHeight - 60), n = seq++ % 8;
    el.className = 'win'; el.style.cssText = `left:${Math.max(70, Math.min(110 + n * 28, innerWidth - W - 10))}px;top:${Math.max(0, 24 + n * 28)}px;width:${W}px;height:${H}px`;
    el.innerHTML = `<div class="tbar"><span class="ti">${a.icon}</span><span class="tt">${escH(a.name)}</span><b class="bn mn">—</b>${a.fixed ? '' : '<b class="bn mx">▢</b>'}<b class="bn cl">✕</b></div><div class="wbody"></div>` + (a.fixed ? '' : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="rz" data-d="${d}"></i>`).join(''));
    w = { id, app: a, el, body: $('.wbody', el), api: {}, min: false, max: false, setTitle: t => { $('.tt', el).textContent = t; renderDock(); }, close: () => close(w) };
    wins.push(w); $('#windows').appendChild(el); a.render(w.body, w, arg); bind(w); focus(w);
  }
  function bind(w) {
    const el = w.el, bar = $('.tbar', el); el.addEventListener('pointerdown', () => focus(w), true);
    $('.mn', el).onclick = () => minimize(w); $('.cl', el).onclick = () => close(w); const mx = $('.mx', el); if (mx) { mx.onclick = () => toggleMax(w); bar.ondblclick = e => { if (!e.target.closest('.bn')) toggleMax(w); }; }
    bar.onpointerdown = e => { if (e.target.closest('.bn') || w.max) return; const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop; scr.classList.add('drag');
      const mv = ev => { el.style.left = Math.min(innerWidth - 80, Math.max(80 - el.offsetWidth, ev.clientX - sx)) + 'px'; el.style.top = Math.min(innerHeight - 70, Math.max(0, ev.clientY - sy)) + 'px'; }, up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); };
    $$('.rz', el).forEach(h => h.onpointerdown = e => { if (w.max) return; e.preventDefault(); const d = h.dataset.d, r = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }, sx = e.clientX, sy = e.clientY; scr.classList.add('drag');
      const mv = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; let { x, y, w: ww, h: hh } = r; if (d.includes('e')) ww = Math.max(260, r.w + dx); if (d.includes('s')) hh = Math.max(140, r.h + dy); if (d.includes('w')) { ww = Math.max(260, r.w - dx); x = r.x + r.w - ww; } if (d.includes('n')) { hh = Math.max(140, r.h - dy); y = r.y + r.h - hh; } Object.assign(el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); },
        up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  }
  const top = () => wins.filter(x => !x.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  function focus(w) { cur = w; z++; w.el.style.zIndex = z; wins.forEach(x => x.el.classList.toggle('act', x === w)); renderDock(); }
  function minimize(w) { w.min = true; w.el.classList.add('min'); if (cur === w) { const t = top(); t ? focus(t) : (cur = null, wins.forEach(x => x.el.classList.remove('act'))); } renderDock(); }
  function restore(w) { w.min = false; w.el.classList.remove('min'); }
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); $('.mx', w.el).textContent = w.max ? '❐' : '▢'; }
  function close(w) { w.api.close && w.api.close(); w.el.remove(); wins.splice(wins.indexOf(w), 1); if (cur === w) { cur = null; const t = top(); t && focus(t); } renderDock(); if (!$('#overview').classList.contains('hidden')) buildOv(); }

  /* ---------- dock + top bar ---------- */
  function renderDock() {
    const ids = [...FAVS, ...[...new Set(wins.map(w => w.id))].filter(id => !FAVS.includes(id))];
    $('#dockApps').innerHTML = ids.map(id => { const a = APPS[id], ws = wins.filter(w => w.id === id); return `<button class="di${ws.length ? ' run' : ''}${cur && cur.id === id && !cur.min ? ' act' : ''}" data-d="${id}" title="${escH(a.name)}">${a.icon}</button>`; }).join('') + '<button class="di" data-trash title="Trash">🗑️</button>';
    $('#appName').textContent = cur && !cur.min ? cur.app.name : '';
  }
  $('#dockApps').onclick = e => { const d = e.target.closest('[data-d]'); if (e.target.closest('[data-trash]')) return open('files', { loc: 'trash' }); if (!d) return; const id = d.dataset.d, ws = wins.filter(w => w.id === id); if (!ws.length) return open(id);
    const w = ws[ws.length - 1]; if (w.min) { restore(w); focus(w); } else if (cur === w) minimize(w); else focus(w); };
  $('#dockApps').oncontextmenu = e => { const d = e.target.closest('[data-d]'); if (!d) return; e.preventDefault(); const id = d.dataset.d, ws = wins.filter(w => w.id === id); menu(e.clientX, e.clientY, [['New Window', () => { const a = APPS[id]; if (a.single && ws[0]) focus(ws[0]); else open(id); }], ...(ws.length ? [['Quit', () => ws.forEach(close)]] : [])]); };

  /* ---------- menus, dialogs, notifications, popups ---------- */
  function menu(x, y, items) { const m = $('#ctx'); m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<div class="ci${it[2] ? ' dis' : ''}" data-i="${i}">${it[0]}</div>`).join(''); m.classList.remove('hidden'); m.style.left = Math.min(x, innerWidth - m.offsetWidth - 4) + 'px'; m.style.top = Math.min(y, innerHeight - m.offsetHeight - 4) + 'px'; m.onclick = e => { const c = e.target.closest('[data-i]'); m.classList.add('hidden'); if (c) items[+c.dataset.i][1](); }; }
  function dialog({ title, html, buttons = [['OK']], w = 360 }) {
    const m = $('#modal'); m.className = ''; m.innerHTML = `<div class="dlg" style="width:${w}px"><div class="tbar"><span class="tt">${escH(title)}</span><b class="bn cl" data-i="-1">✕</b></div><div class="dbody">${html}</div><div class="dbtn">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div></div>`;
    const done = i => { const b = buttons[i]; if (b && b[1]) b[1](m); m.className = 'hidden'; m.innerHTML = ''; }; m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) done(+b.dataset.i); }; m.onkeydown = e => { if (e.key === 'Enter') done(0); if (e.key === 'Escape') done(-1); }; const f = $('input', m) || $('button', m); f && f.focus(); }
  function notify(title, text) { notifs.unshift({ title, text, t: new Date() }); if (S.dnd) return; const n = document.createElement('div'); n.className = 'nt'; n.innerHTML = `<b>${escH(title)}</b>${escH(text)}`; $('#notify').appendChild(n); const rm = () => n.remove(); n.onclick = rm; setTimeout(rm, 4500); }
  function popup(k, html, side) { const p = $('#popup'); if (!p.classList.contains('hidden') && p.dataset.k === k) { p.classList.add('hidden'); setBtn(); return false; } p.dataset.k = k; p.innerHTML = html; p.style.left = side === 'c' ? '50%' : 'auto'; p.style.right = side === 'c' ? 'auto' : '8px'; p.style.transform = side === 'c' ? 'translateX(-50%)' : ''; p.classList.remove('hidden'); setBtn(k); return true; }
  const setBtn = k => { $('#clockBtn').classList.toggle('on', k === 'cal'); $('#sysBtn').classList.toggle('on', k === 'qs'); };
  $('#clockBtn').onclick = e => { e.stopPropagation(); const d = new Date(), f = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); let h = DAYS.map(x => `<b style="color:#aaa;font-size:11px">${x}</b>`).join('') + '<i></i>'.repeat(f);
    for (let i = 1; i <= n; i++) h += `<span style="padding:6px 0;border-radius:50%;${i === d.getDate() ? 'background:var(--ac);color:#fff' : ''}">${i}</span>`;
    popup('cal', `<div class="cp"><div class="nl">${notifs.slice(0, 5).map(x => `<div class="n"><b>${escH(x.title)}</b><br>${escH(x.text)}</div>`).join('') || '<div style="text-align:center;margin-top:70px">No Notifications</div>'}</div><div class="cl"><div style="font-size:15px;font-weight:700;margin-bottom:8px">${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px;font-size:13px">${h}</div></div></div>`, 'c'); };
  function buildQS() { const p = $('#popup'), tq = (k, ic, t, on) => `<div class="qt${on ? ' on' : ''}" data-q="${k}">${ic} ${t}</div>`;
    p.innerHTML = `<div class="qs">${tq('net', '🖧', 'Wired', S.net && !S.plane)}${tq('bt', '🔵', 'Bluetooth', S.bt && !S.plane)}${tq('dark', '🌙', 'Dark Style', S.dark)}${tq('night', '🔆', 'Night Light', S.night)}${tq('plane', '✈', 'Airplane', S.plane)}${tq('dnd', '🔕', 'Do Not Disturb', S.dnd)}<div class="qr">🔊<input type="range" id="qv" min="0" max="100" value="${S.vol}"></div><div class="qr">☀️<input type="range" id="qb" min="30" max="100" value="${S.brightness}"></div><div class="qb"><button data-q="settings" title="Settings">⚙</button><button data-q="lock" title="Lock">🔒</button><button data-q="power" title="Power Off / Switch OS">⏻</button></div></div>`; $('#qv', p).oninput = e => set({ vol: +e.target.value }); $('#qb', p).oninput = e => set({ brightness: +e.target.value }); }
  $('#sysBtn').onclick = e => { e.stopPropagation(); if (popup('qs', '', 'r')) buildQS(); };
  $('#popup').onclick = e => { const q = e.target.closest('[data-q]'); if (!q) return; const k = q.dataset.q; if (k === 'settings') { $('#popup').classList.add('hidden'); setBtn(); open('settings'); } else if (k === 'lock') { $('#popup').classList.add('hidden'); setBtn(); lock(); } else if (k === 'power') { $('#popup').classList.add('hidden'); setBtn(); power(); } else set({ [k]: !S[k] }); };

  /* ---------- activities overview + application grid ---------- */
  const ovOpen = () => !$('#overview').classList.contains('hidden');
  const allApps = () => Object.keys(APPS).map(id => ({ id, n: APPS[id].name, i: APPS[id].icon }));
  function buildOv(q) {
    const ow = $('#ovwins'), oa = $('#ovapps'); if (q) { ow.classList.add('hidden'); oa.classList.remove('hidden'); const L = allApps().filter(a => a.n.toLowerCase().includes(q.toLowerCase())); oa.innerHTML = L.map(a => `<div class="ap" data-a="${a.id}"><i>${a.i}</i>${escH(a.n)}</div>`).join('') || '<div class="empty">No results</div>'; return; }
    if (showGrid) { ow.classList.add('hidden'); oa.classList.remove('hidden'); oa.innerHTML = allApps().map(a => `<div class="ap" data-a="${a.id}"><i>${a.i}</i>${escH(a.n)}</div>`).join(''); return; }
    oa.classList.add('hidden'); ow.classList.remove('hidden'); ow.innerHTML = wins.map((w, i) => `<div class="ow" data-w="${i}"><div class="oh">${w.app.icon} ${escH($('.tt', w.el).textContent)}</div><div class="ob">${w.app.icon}</div></div>`).join('') || '<div class="empty">No windows open — click an app in the dock, or press “Show Applications”.</div>';
  }
  let showGrid = false;
  function openOv(grid) { showGrid = !!grid; $('#popup').classList.add('hidden'); setBtn(); $('#overview').classList.remove('hidden'); $('#actBtn').classList.add('on'); $('#osearch').value = ''; buildOv(); $('#osearch').focus(); }
  function closeOv() { $('#overview').classList.add('hidden'); $('#actBtn').classList.remove('on'); showGrid = false; }
  $('#actBtn').onclick = () => ovOpen() ? closeOv() : openOv(); $('#showApps').onclick = () => ovOpen() && showGrid ? closeOv() : openOv(true); $('#osearch').oninput = e => buildOv(e.target.value.trim());
  $('#osearch').onkeydown = e => { if (e.key === 'Enter') { const a = allApps().find(x => x.n.toLowerCase().includes(e.target.value.trim().toLowerCase())); if (a) open(a.id); } };
  $('#overview').onclick = e => { const a = e.target.closest('[data-a]'), w = e.target.closest('[data-w]'); if (a) open(a.dataset.a); else if (w) { const t = wins[+w.dataset.w]; closeOv(); restore(t); focus(t); } else if (e.target.id === 'overview' || e.target.id === 'ovwins') closeOv(); };

  /* ---------- desktop icons ---------- */
  const ICONS = [['🏠', 'Home', () => open('files', { loc: 'home' })], ['🗑️', 'Trash', () => open('files', { loc: 'trash' })]];
  async function buildDesktop() { const files = await FS.list('desktop'); $('#icons').innerHTML = ICONS.map((x, i) => `<div class="ico" data-n="${i}"><i>${x[0]}</i><span>${x[1]}</span></div>`).join('') + files.map(f => `<div class="ico" data-f="${f.id}"><i>${fileIcon(f)}</i><span>${escH(f.name)}</span></div>`).join(''); $('#icons')._f = files; }
  $('#icons').onclick = e => { const i = e.target.closest('.ico'); $$('.ico').forEach(n => n.classList.toggle('sel', n === i)); };
  $('#icons').ondblclick = e => { const i = e.target.closest('.ico'); if (!i) return; if (i.dataset.n) ICONS[+i.dataset.n][2](); else { const f = $('#icons')._f.find(x => x.id === i.dataset.f); f && openFile(f); } };
  $('#desktop').addEventListener('pointerdown', e => { if (!e.target.closest('.ico')) $$('.ico').forEach(n => n.classList.remove('sel')); });
  scr.addEventListener('contextmenu', e => { e.preventDefault(); if (e.target.closest('.win,#topbar,#dock,#overview,#login,#modal,#popup')) return; const i = e.target.closest('.ico');
    if (i && i.dataset.f) { const f = $('#icons')._f.find(x => x.id === i.dataset.f); return menu(e.clientX, e.clientY, [['Open', () => openFile(f)], ['Download', () => download(f)], '-', ['Move to Trash', async () => { await FS.put({ ...f, from: 'desktop', folder: 'trash' }); sync(); }]]); }
    menu(e.clientX, e.clientY, [['New Document', async () => { await FS.save('New Document', 'text/plain', new Blob(['']), 'desktop'); }], ['Upload Files…', () => pickFiles('', fs => FS.import(fs))], '-', ['Open in Terminal', () => open('terminal')], '-', ['Change Background…', () => open('settings', { tab: 'bg' })], ['Display Settings', () => open('settings', { tab: 'disp' })]]); });
  function sync() { buildDesktop(); registerInstalled(); wins.forEach(w => w.api.sync && w.api.sync()); if (ovOpen()) buildOv($('#osearch').value.trim()); }

  /* ---------- power, lock, login, boot ---------- */
  const goHome = () => { location.href = '../../index.html'; };
  function power() { dialog({ title: 'Power Off', html: '<div class="pw"><div data-a="lock"><i>🔒</i>Lock Screen</div><div data-a="logout"><i>🚪</i>Log Out</div><div data-a="suspend"><i>🌙</i>Suspend</div><div data-a="restart"><i>🔄</i>Restart</div><div data-a="off"><i>⏻</i>Power Off</div><div data-a="home"><i>🏠</i>Switch OS</div></div>', buttons: [['Cancel']], w: 450 });
    $('#modal').onclick = e => { const a = e.target.closest('[data-a]'), c = e.target.closest('[data-i]'); if (c && !a) { $('#modal').className = 'hidden'; $('#modal').innerHTML = ''; return; } if (!a) return; $('#modal').className = 'hidden'; $('#modal').innerHTML = ''; const k = a.dataset.a;
      if (k === 'lock') lock(); else if (k === 'logout') logout(); else if (k === 'restart') location.reload(); else if (k === 'home') goHome(); else if (k === 'off') { $('#offMsg').textContent = 'System powered off.'; $('#powerOn').classList.remove('hidden'); $('#off').classList.remove('hidden'); } else if (k === 'suspend') { $('#offMsg').textContent = 'Suspended — click to resume.'; $('#powerOn').classList.add('hidden'); $('#off').classList.remove('hidden'); $('#off').onclick = () => { $('#off').classList.add('hidden'); $('#off').onclick = null; }; } }; }
  function lock() { authed = false; closeOv(); $('#lgMsg').textContent = 'Screen locked — password: ubuntu'; $('#pw').value = ''; $('#login').classList.remove('hidden'); $('#pw').focus(); }
  function logout() { [...wins].forEach(close); lock(); $('#lgMsg').textContent = 'Password: ubuntu'; }
  const tryLogin = () => { if ($('#pw').value === 'ubuntu') { authed = true; $('#login').classList.add('hidden'); notify('Welcome, Ubuntu', 'Ubuntu 24.04 LTS (virtual) is ready.'); } else { $('#lgMsg').textContent = 'Sorry, that didn’t work. Try “ubuntu”.'; $('#pw').value = ''; const b = $('.lbox'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } };
  $('#lgGo').onclick = tryLogin; $('#pw').onkeydown = e => { if (e.key === 'Enter') tryLogin(); }; $('#lgPower').onclick = power; $('#sysBtn').oncontextmenu = e => { e.preventDefault(); power(); }; $('#powerOn').onclick = () => location.reload();
  setTimeout(() => { $('#boot').classList.add('hidden'); $('#login').classList.remove('hidden'); $('#pw').focus(); }, 3200);

  /* ---------- clock, drop, keys ---------- */
  const tick = () => { const d = new Date(); $('#clockBtn').textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}  ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`; $('#lgClock').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  ['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length && authed) FS.import(e.dataTransfer.files); }));
  document.addEventListener('pointerdown', e => { if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); if (!e.target.closest('#popup,#clockBtn,#sysBtn')) { $('#popup').classList.add('hidden'); setBtn(); } });
  document.addEventListener('keydown', e => { if (!authed) return; if (e.key === 'Escape') { closeOv(); $('#ctx').classList.add('hidden'); $('#popup').classList.add('hidden'); setBtn(); } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); open('terminal'); } else if (e.key === 'Meta') { e.preventDefault(); ovOpen() ? closeOv() : openOv(); } });
  addEventListener('resize', () => wins.forEach(w => { if (!w.max && w.el.offsetLeft > innerWidth - 80) w.el.style.left = Math.max(70, innerWidth - 240) + 'px'; }));

  apply(); buildDesktop(); renderDock(); tick(); setInterval(tick, 15000);
  return { open, set, sync, notify, dialog, menu, close, focus, restore, get wins() { return wins; }, get settings() { return S; }, get battery() { return bat; } };
})();

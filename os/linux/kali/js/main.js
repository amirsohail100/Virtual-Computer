/* ===== Kali Linux (Virtual) — OS core: boot, login, desktop, windows, workspaces, panel, menu ===== */
const OS = (() => {
  const S = { wall: 'k1', fit: 'zoom', theme: 'dark', accent: 'blue', brightness: 100, vol: 60, ...jget('kali_settings', {}) }, wins = [], scr = $('#screen');
  let z = 10, seq = 0, cur = null, ws = 0, wallKey = null, wallUrl = null, authed = false;

  /* ---------- settings: wallpaper, theme, accent, brightness ---------- */
  async function applyWall() {
    const key = S.wall + '|' + S.fit; if (wallKey === key) return; wallKey = key; let url = '';
    if (S.wall.startsWith('u:')) { try { const f = await FS.get(S.wall.slice(2)); if (f) { url = URL.createObjectURL(f.blob); wallUrl && URL.revokeObjectURL(wallUrl); wallUrl = url; } } catch (e) {} if (!url) { S.wall = 'k1'; url = WALLS[0].img; } }
    else { const w = WALLS.find(x => x.id === S.wall) || WALLS[0]; url = w.img; }
    const d = $('#desktop'), f = S.fit; d.style.backgroundImage = `url("${url}")`; d.style.backgroundSize = f === 'zoom' ? 'cover' : f === 'stretch' ? '100% 100%' : 'auto'; d.style.backgroundRepeat = f === 'tile' ? 'repeat' : 'no-repeat'; d.style.backgroundPosition = 'center';
    $('#login').style.background = `linear-gradient(#000a,#000a),url("${url}") center/cover`;
  }
  function apply() { scr.classList.toggle('lt', S.theme === 'light'); ['blue', 'purple', 'red', 'green'].forEach(a => scr.classList.toggle('ac-' + a, S.accent === a)); $('#dim').style.background = `rgba(0,0,0,${(100 - S.brightness) / 110})`; applyWall(); }
  function set(p) { Object.assign(S, p); jset('kali_settings', S); apply(); wins.forEach(w => w.api.sync && w.api.sync()); }

  /* ---------- windows + workspaces ---------- */
  function open(id, arg) {
    const a = APPS[id]; if (!a) return; jset('kali_recent', [id, ...jget('kali_recent', []).filter(x => x !== id)].slice(0, 10)); let w = a.single && wins.find(x => x.id === id);
    if (w) { w.ws = ws; vis(w); w.api.arg && arg !== undefined && w.api.arg(arg); restore(w); return focus(w); }
    const el = document.createElement('div'), W = Math.min(a.w || 600, innerWidth - 20), H = Math.min(a.h || 420, innerHeight - 50), n = seq++ % 8;
    el.className = 'win'; el.style.cssText = `left:${Math.max(0, Math.min(80 + n * 28, innerWidth - W))}px;top:${Math.max(0, 24 + n * 28)}px;width:${W}px;height:${H}px`;
    el.innerHTML = `<div class="tbar"><span class="ti">${a.icon}</span><span class="tt">${escH(a.name)}</span><b class="bn mn">—</b>${a.fixed ? '' : '<b class="bn mx">▢</b>'}<b class="bn cl">✕</b></div><div class="wbody"></div>` + (a.fixed ? '' : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="rz" data-d="${d}"></i>`).join(''));
    w = { id, app: a, el, body: $('.wbody', el), api: {}, min: false, max: false, ws, setTitle: t => { $('.tt', el).textContent = t; renderTask(); }, close: () => close(w) };
    wins.push(w); $('#windows').appendChild(el); a.render(w.body, w, arg); bind(w); focus(w);
  }
  const vis = w => w.el.classList.toggle('off', w.ws !== ws);
  function bind(w) {
    const el = w.el, bar = $('.tbar', el); el.addEventListener('pointerdown', () => focus(w), true);
    $('.mn', el).onclick = () => minimize(w); $('.cl', el).onclick = () => close(w); const mx = $('.mx', el); if (mx) { mx.onclick = () => toggleMax(w); bar.ondblclick = e => { if (!e.target.closest('.bn')) toggleMax(w); }; }
    bar.onpointerdown = e => { if (e.target.closest('.bn') || w.max) return; const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop; scr.classList.add('drag');
      const mv = ev => { el.style.left = Math.min(innerWidth - 80, Math.max(80 - el.offsetWidth, ev.clientX - sx)) + 'px'; el.style.top = Math.min(innerHeight - 70, Math.max(0, ev.clientY - sy)) + 'px'; }, up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); };
    $$('.rz', el).forEach(h => h.onpointerdown = e => { if (w.max) return; e.preventDefault(); const d = h.dataset.d, r = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }, sx = e.clientX, sy = e.clientY; scr.classList.add('drag');
      const mv = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; let { x, y, w: ww, h: hh } = r; if (d.includes('e')) ww = Math.max(240, r.w + dx); if (d.includes('s')) hh = Math.max(130, r.h + dy); if (d.includes('w')) { ww = Math.max(240, r.w - dx); x = r.x + r.w - ww; } if (d.includes('n')) { hh = Math.max(130, r.h - dy); y = r.y + r.h - hh; } Object.assign(el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); },
        up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  }
  const here = () => wins.filter(x => x.ws === ws && !x.min), top = () => here().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
  function focus(w) { cur = w; z++; w.el.style.zIndex = z; wins.forEach(x => x.el.classList.toggle('act', x === w)); renderTask(); }
  function minimize(w) { w.min = true; w.el.classList.add('min'); if (cur === w) { const t = top(); t ? focus(t) : (cur = null, wins.forEach(x => x.el.classList.remove('act'))); } renderTask(); }
  function restore(w) { w.min = false; w.el.classList.remove('min'); }
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); $('.mx', w.el).textContent = w.max ? '❐' : '▢'; }
  function close(w) { w.api.close && w.api.close(); w.el.remove(); wins.splice(wins.indexOf(w), 1); if (cur === w) { cur = null; const t = top(); t && focus(t); } renderTask(); }
  function renderTask() { const L = wins.filter(w => w.ws === ws); $('#tasks').innerHTML = L.map(w => `<button class="tbtn${cur === w && !w.min ? ' on' : ''}" data-i="${wins.indexOf(w)}">${w.app.icon} ${escH($('.tt', w.el).textContent)}</button>`).join(''); }
  $('#tasks').onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const w = wins[+b.dataset.i]; if (w.min) { restore(w); focus(w); } else if (cur === w) minimize(w); else focus(w); };
  function setWs(n) { ws = n; wins.forEach(vis); cur = top() || null; wins.forEach(x => x.el.classList.toggle('act', x === cur)); renderWs(); renderTask(); }
  const renderWs = () => { $('#ws').innerHTML = [0, 1, 2, 3].map(i => `<i data-n="${i}" class="${i === ws ? 'on' : ''}">${i + 1}</i>`).join(''); }; $('#ws').onclick = e => { const i = e.target.closest('[data-n]'); i && setWs(+i.dataset.n); };

  /* ---------- menus, dialogs, notifications, popups ---------- */
  function menu(x, y, items) { const m = $('#ctx'); m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<div class="ci${it[2] ? ' dis' : ''}" data-i="${i}">${it[0]}</div>`).join(''); m.classList.remove('hidden'); m.style.left = Math.min(x, innerWidth - m.offsetWidth - 4) + 'px'; m.style.top = Math.min(y, innerHeight - m.offsetHeight - 4) + 'px'; m.onclick = e => { const c = e.target.closest('[data-i]'); m.classList.add('hidden'); if (c) items[+c.dataset.i][1](); }; }
  function dialog({ title, html, buttons = [['OK']], w = 340 }) {
    const m = $('#modal'); m.className = ''; m.innerHTML = `<div class="dlg" style="width:${w}px"><div class="tbar"><span class="tt">${escH(title)}</span><b class="bn cl" data-i="-1">✕</b></div><div class="dbody">${html}</div><div class="dbtn">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div></div>`;
    const done = i => { const b = buttons[i]; if (b && b[1]) b[1](m); m.className = 'hidden'; m.innerHTML = ''; }; m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) done(+b.dataset.i); }; m.onkeydown = e => { if (e.key === 'Enter') done(0); if (e.key === 'Escape') done(-1); }; const f = $('input', m) || $('button', m); f && f.focus(); }
  function notify(title, text) { const n = document.createElement('div'); n.className = 'nt'; n.innerHTML = `<b>${escH(title)}</b>${escH(text)}`; $('#notify').appendChild(n); const rm = () => n.remove(); n.onclick = rm; setTimeout(rm, 4500); }
  function popup(h, w) { const p = $('#popup'); if (!p.classList.contains('hidden') && p.dataset.k === h.k) return p.classList.add('hidden'); p.dataset.k = h.k; p.innerHTML = h.html; p.style.width = (w || 240) + 'px'; p.classList.remove('hidden'); return p; }
  $('#trClock').onclick = e => { e.stopPropagation(); const d = new Date(), f = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); let h = DAYS.map(x => `<b style="color:var(--tx2);font-size:11px">${x[0]}</b>`).join('') + '<i></i>'.repeat(f);
    for (let i = 1; i <= n; i++) h += `<span style="padding:5px 0;border-radius:50%;${i === d.getDate() ? 'background:var(--ac);color:#fff' : ''}">${i}</span>`; popup({ k: 'cal', html: `<div style="text-align:center;font-weight:700;margin-bottom:8px">${MONTHS[d.getMonth()]} ${d.getFullYear()}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;gap:2px">${h}</div>` }, 250); };
  $('#trVol').onclick = e => { e.stopPropagation(); const p = popup({ k: 'vol', html: `🔊 Volume<br><input type="range" id="vl" min="0" max="100" value="${S.vol}" style="width:100%">` }, 200); p && p.classList.contains('hidden') === false && ($('#vl', p).oninput = ev => set({ vol: +ev.target.value })); };
  $('#trNet').onclick = e => { e.stopPropagation(); popup({ k: 'net', html: '<b>Wired connection 1</b><br>✔ Connected — eth0<br>IP 192.168.56.101<br><span style="color:var(--tx2)">Virtual network (simulated)</span>' }, 230); };
  if (navigator.getBattery) navigator.getBattery().then(b => { const u = () => { $('#trBat').textContent = (b.charging ? '⚡' : '🔋') + Math.round(b.level * 100) + '%'; }; u(); b.addEventListener('levelchange', u); b.addEventListener('chargingchange', u); }).catch(() => {}); else $('#trBat').textContent = '🔌';

  /* ---------- desktop icons ---------- */
  const ICONS = [['🏠', 'Home', () => open('files', { loc: 'home' })], ['💽', 'File System', () => open('files', { loc: 'sys' })], ['🗑️', 'Trash', () => open('files', { loc: 'trash' })]];
  async function buildDesktop() { const files = await FS.list('desktop'); $('#icons').innerHTML = ICONS.map((x, i) => `<div class="ico" data-n="${i}"><i>${x[0]}</i><span>${x[1]}</span></div>`).join('') + files.map(f => `<div class="ico" data-f="${f.id}"><i>${fileIcon(f)}</i><span>${escH(f.name)}</span></div>`).join(''); $('#icons')._f = files; }
  $('#icons').onclick = e => { const i = e.target.closest('.ico'); $$('.ico').forEach(n => n.classList.toggle('sel', n === i)); };
  $('#icons').ondblclick = e => { const i = e.target.closest('.ico'); if (!i) return; if (i.dataset.n) ICONS[+i.dataset.n][2](); else { const f = $('#icons')._f.find(x => x.id === i.dataset.f); f && openFile(f); } };
  $('#desktop').addEventListener('pointerdown', e => { if (!e.target.closest('.ico')) $$('.ico').forEach(n => n.classList.remove('sel')); });
  scr.addEventListener('contextmenu', e => { e.preventDefault(); if (e.target.closest('.win,#panel,#kmenu,#login,#modal')) return; const i = e.target.closest('.ico');
    if (i && i.dataset.f) { const f = $('#icons')._f.find(x => x.id === i.dataset.f); return menu(e.clientX, e.clientY, [['Open', () => openFile(f)], ['Download', () => download(f)], '-', ['Move to Trash', async () => { await FS.put({ ...f, from: 'desktop', folder: 'trash' }); sync(); }]]); }
    menu(e.clientX, e.clientY, [['Open Terminal Here', () => open('terminal')], ['Create Document', async () => { await FS.save('New Document.txt', 'text/plain', new Blob(['']), 'desktop'); }], ['Upload files…', () => pickFiles('', fs => FS.import(fs))], '-', ['Refresh', sync], ['Desktop Settings…', () => open('settings', { tab: 'wall' })]]); });
  function sync() { buildDesktop(); wins.forEach(w => w.api.sync && w.api.sync()); }

  /* ---------- Kali menu (Whisker-style, real Kali categories) ---------- */
  let kcat = 'fav', kcur = [];
  const recent = () => jget('kali_recent', []).filter(id => APPS[id]);
  function kitems(c) {
    if (c === 'fav') return FAVS.map(appItem); if (c === 'recent') return recent().map(appItem);
    if (c === 'usual') return USUAL.flatMap(([g, ids]) => [{ h: g }, ...ids.map(appItem)]);
    return (TOOLS[c] || []).map(toolItem);
  }
  function buildKmenu(q) {
    $('#kcats').innerHTML = CATS.map(c => `<div class="kci${!q && kcat === c[0] ? ' on' : ''}" data-c="${c[0]}"><i>${c[2]}</i>${c[1]}</div>`).join('');
    kcur = q ? allItems().filter(x => x.n.toLowerCase().includes(q.toLowerCase())) : kitems(kcat);
    $('#kapps').innerHTML = kcur.map((x, i) => x.h ? `<div class="kg">${x.h}</div>` : `<div class="kai" data-i="${i}"><i>${x.i}</i>${escH(x.n)}</div>`).join('') || `<div class="kai" style="color:var(--tx2)">${kcat === 'recent' && !q ? 'No recently used applications' : 'No matches'}</div>`;
  }
  const kOpen = () => !$('#kmenu').classList.contains('hidden');
  function toggleK(v) { const m = $('#kmenu'), on = v === undefined ? m.classList.contains('hidden') : v; m.classList.toggle('hidden', !on); if (on) { $('#ksearch').value = ''; buildKmenu(); $('#ksearch').focus(); } }
  $('#kbtn').onclick = e => { e.stopPropagation(); toggleK(); }; $('#ksearch').oninput = e => buildKmenu(e.target.value.trim());
  $('#ksearch').onkeydown = e => { if (e.key === 'Enter') { const x = kcur.find(y => !y.h); if (x) { toggleK(false); launch(x); } } };
  $('#kmenu').onclick = e => { const c = e.target.closest('[data-c]'), i = e.target.closest('[data-i]'), k = e.target.closest('[data-k]');
    if (c) { kcat = c.dataset.c; $('#ksearch').value = ''; buildKmenu(); } else if (i) { const x = kcur[+i.dataset.i]; toggleK(false); launch(x); }
    else if (k) { toggleK(false); const a = k.dataset.k; if (a === 'settings') open('settings'); else if (a === 'lock') lock(); else power(); } };
  $$('.lau button').forEach(b => b.onclick = () => open(b.dataset.l));
  document.addEventListener('pointerdown', e => { if (kOpen() && !e.target.closest('#kmenu,#kbtn')) toggleK(false); if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); if (!e.target.closest('#popup,#tray')) $('#popup').classList.add('hidden'); });

  /* ---------- power, lock, login, boot ---------- */
  const goHome = () => { location.href = '../../index.html'; };
  function power() { toggleK(false); dialog({ title: 'Log Out kali', html: '<div class="pw"><div data-a="lock"><i>🔒</i>Lock Screen</div><div data-a="logout"><i>🚪</i>Log Out</div><div data-a="suspend"><i>🌙</i>Suspend</div><div data-a="restart"><i>🔄</i>Restart</div><div data-a="off"><i>⏻</i>Shut Down</div><div data-a="home"><i>🏠</i>Switch OS</div></div>', buttons: [['Cancel']], w: 440 });
    $('#modal').onclick = e => { const a = e.target.closest('[data-a]'), c = e.target.closest('[data-i]'); if (c && !a) { $('#modal').className = 'hidden'; $('#modal').innerHTML = ''; return; } if (!a) return; $('#modal').className = 'hidden'; $('#modal').innerHTML = ''; const k = a.dataset.a;
      if (k === 'lock') lock(); else if (k === 'logout') logout(); else if (k === 'restart') location.reload(); else if (k === 'home') goHome(); else if (k === 'off') { $('#offMsg').textContent = 'System halted.'; $('#powerOn').classList.remove('hidden'); $('#off').classList.remove('hidden'); } else if (k === 'suspend') { $('#offMsg').textContent = 'Suspended — click to resume.'; $('#powerOn').classList.add('hidden'); $('#off').classList.remove('hidden'); $('#off').onclick = () => { $('#off').classList.add('hidden'); $('#off').onclick = null; }; } }; }
  function lock() { authed = false; $('#lgMsg').textContent = 'Screen locked — password: kali'; $('#pw').value = ''; $('#login').classList.remove('hidden'); $('#pw').focus(); }
  function logout() { [...wins].forEach(close); lock(); $('#lgMsg').textContent = 'Default password: kali'; }
  const tryLogin = () => { if ($('#pw').value === 'kali') { authed = true; $('#login').classList.add('hidden'); notify('Welcome, kali', 'Kali Linux (virtual) is ready.'); } else { $('#lgMsg').textContent = 'Authentication failure — try "kali"'; $('#pw').value = ''; const b = $('.lbox'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); } };
  $('#lgGo').onclick = tryLogin; $('#pw').onkeydown = e => { if (e.key === 'Enter') tryLogin(); }; $('#lgPower').onclick = power; $('#trPower').onclick = power; $('#powerOn').onclick = () => location.reload();
  const LOG = ['Kali GNU/Linux Rolling — booting kernel 6.6.9-amd64', 'Loading initial ramdisk …', 'ok:Reached target Local File Systems.', 'ok:Started Journal Service.', 'ok:Mounted /boot/efi.', 'ok:Started udev Kernel Device Manager.', 'ok:Reached target Network (Pre).', 'ok:Started Network Manager.', 'ok:Started OpenBSD Secure Shell server.', 'ok:Started PostgreSQL RDBMS.', 'ok:Started Login Service.', 'ok:Reached target Graphical Interface.', 'ok:Started Light Display Manager.', '', 'Kali GNU/Linux Rolling kali tty7'];
  let li = 0; const bl = $('#bootlog'), bi = setInterval(() => { const l = LOG[li++]; if (l === undefined) { clearInterval(bi); setTimeout(() => { $('#boot').classList.add('hidden'); $('#login').classList.remove('hidden'); $('#pw').focus(); }, 500); return; } bl.innerHTML += (l.startsWith('ok:') ? '[  <span class="ok">OK</span>  ] ' + escH(l.slice(3)) : escH(l)) + '\n'; }, 170);

  /* ---------- clock, drop, keys ---------- */
  const tick = () => { const d = new Date(); $('#trClock').textContent = `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`; $('#lgClock').textContent = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); };
  ['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length && authed) FS.import(e.dataTransfer.files); }));
  document.addEventListener('keydown', e => { if (!authed) return; if (e.key === 'Escape') { toggleK(false); $('#ctx').classList.add('hidden'); $('#popup').classList.add('hidden'); } else if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); open('terminal'); } else if (e.key === 'Meta') { e.preventDefault(); toggleK(); } });
  addEventListener('resize', () => wins.forEach(w => { if (!w.max && w.el.offsetLeft > innerWidth - 80) w.el.style.left = Math.max(0, innerWidth - 220) + 'px'; }));

  apply(); buildDesktop(); renderWs(); tick(); setInterval(tick, 15000);
  return { open, set, sync, notify, dialog, menu, close, focus, restore, get wins() { return wins; }, get settings() { return S; } };
})();

/* ===== Windows XP (Virtual) — OS core: boot, login, desktop, windows, taskbar, start menu ===== */
const OS = (() => {
  const S = { wall: 'bliss', pos: 'stretch', theme: 'blue', ...jget('xp_settings', {}) }, wins = [], scr = $('#screen');
  let z = 10, seq = 0, cur = null, wallKey = null, wallUrl = null, balT = 0;

  /* ---------- settings: wallpaper + theme ---------- */
  async function applyWall() {
    const key = S.wall + '|' + S.pos; if (wallKey === key) return; wallKey = key; let url = '';
    if (S.wall.startsWith('u:')) { try { const f = await FS.get(S.wall.slice(2)); if (f) { url = URL.createObjectURL(f.blob); wallUrl && URL.revokeObjectURL(wallUrl); wallUrl = url; } } catch (e) {} if (!url) { S.wall = 'bliss'; url = WALLS[0].img; } }
    else { const w = WALLS.find(x => x.id === S.wall); url = w ? w.img : ''; }
    const d = $('#desktop'), p = S.pos; d.style.backgroundImage = url ? `url("${url}")` : 'none'; d.style.backgroundSize = p === 'stretch' ? '100% 100%' : 'auto'; d.style.backgroundRepeat = p === 'tile' ? 'repeat' : 'no-repeat'; d.style.backgroundPosition = 'center';
  }
  function apply() { scr.classList.remove('th-blue', 'th-olive', 'th-silver'); scr.classList.add('th-' + S.theme); applyWall(); }
  function set(p) { Object.assign(S, p); jset('xp_settings', S); apply(); }

  /* ---------- windows ---------- */
  function open(id, arg) {
    const a = APPS[id]; if (!a) return; let w = a.single && wins.find(x => x.id === id);
    if (w) { w.api.arg && arg !== undefined && w.api.arg(arg); restore(w); return focus(w); }
    const el = document.createElement('div'), W = Math.min(a.w || 600, innerWidth - 20), H = Math.min(a.h || 420, innerHeight - 50), n = seq++ % 8;
    el.className = 'win'; el.style.cssText = `left:${Math.max(0, Math.min(60 + n * 26, innerWidth - W))}px;top:${Math.max(0, 30 + n * 26)}px;width:${W}px;height:${H}px`;
    el.innerHTML = `<div class="tbar"><span class="ti">${a.icon}</span><span class="tt">${escH(a.name)}</span><b class="bn mn">&#8211;</b>${a.fixed ? '' : '<b class="bn mx">□</b>'}<b class="bn cl">✕</b></div><div class="wbody"></div>` + (a.fixed ? '' : ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].map(d => `<i class="rz" data-d="${d}"></i>`).join(''));
    w = { id, app: a, el, body: $('.wbody', el), api: {}, min: false, max: false, setTitle: t => { $('.tt', el).textContent = t; renderTask(); }, close: () => close(w) };
    wins.push(w); $('#windows').appendChild(el); a.render(w.body, w, arg); bind(w); focus(w);
  }
  function bind(w) {
    const el = w.el, bar = $('.tbar', el); el.addEventListener('pointerdown', () => focus(w), true);
    $('.mn', el).onclick = () => minimize(w); $('.cl', el).onclick = () => close(w); const mx = $('.mx', el); if (mx) { mx.onclick = () => toggleMax(w); bar.ondblclick = e => { if (!e.target.closest('.bn')) toggleMax(w); }; }
    bar.onpointerdown = e => { if (e.target.closest('.bn') || w.max) return; const sx = e.clientX - el.offsetLeft, sy = e.clientY - el.offsetTop; scr.classList.add('drag');
      const mv = ev => { el.style.left = Math.min(innerWidth - 80, Math.max(80 - el.offsetWidth, ev.clientX - sx)) + 'px'; el.style.top = Math.min(innerHeight - 60, Math.max(0, ev.clientY - sy)) + 'px'; }, up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); };
    $$('.rz', el).forEach(h => h.onpointerdown = e => { if (w.max) return; e.preventDefault(); const d = h.dataset.d, r = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight }, sx = e.clientX, sy = e.clientY; scr.classList.add('drag');
      const mv = ev => { const dx = ev.clientX - sx, dy = ev.clientY - sy; let { x, y, w: ww, h: hh } = r; if (d.includes('e')) ww = Math.max(220, r.w + dx); if (d.includes('s')) hh = Math.max(120, r.h + dy); if (d.includes('w')) { ww = Math.max(220, r.w - dx); x = r.x + r.w - ww; } if (d.includes('n')) { hh = Math.max(120, r.h - dy); y = r.y + r.h - hh; } Object.assign(el.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); },
        up = () => { scr.classList.remove('drag'); removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
  }
  const visible = () => wins.filter(x => !x.min);
  function focus(w) { cur = w; z++; w.el.style.zIndex = z; wins.forEach(x => x.el.classList.toggle('act', x === w)); renderTask(); }
  function minimize(w) { w.min = true; w.el.classList.add('min'); if (cur === w) { const t = visible().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; t ? focus(t) : (cur = null, wins.forEach(x => x.el.classList.remove('act'))); } renderTask(); }
  function restore(w) { w.min = false; w.el.classList.remove('min'); }
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); $('.mx', w.el).textContent = w.max ? '❐' : '□'; }
  function close(w) { w.api.close && w.api.close(); w.el.remove(); wins.splice(wins.indexOf(w), 1); if (cur === w) { cur = null; const t = visible().sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; t && focus(t); } renderTask(); }
  function renderTask() {
    $('#tasks').innerHTML = wins.map((w, i) => `<button class="tbtn${cur === w && !w.min ? ' on' : ''}" data-i="${i}">${w.app.icon} ${escH($('.tt', w.el).textContent)}</button>`).join('');
  }
  $('#tasks').onclick = e => { const b = e.target.closest('[data-i]'); if (!b) return; const w = wins[+b.dataset.i]; if (w.min) { restore(w); focus(w); } else if (cur === w) minimize(w); else focus(w); };
  const showDesktop = () => wins.forEach(w => { if (!w.min) minimize(w); });

  /* ---------- menus, dialogs, balloon ---------- */
  function menu(x, y, items) {
    const m = $('#ctx'); m.innerHTML = items.map((it, i) => it === '-' ? '<hr>' : `<div class="ci${it[2] ? ' dis' : ''}" data-i="${i}">${it[0]}</div>`).join(''); m.classList.remove('hidden');
    m.style.left = Math.min(x, innerWidth - m.offsetWidth - 4) + 'px'; m.style.top = Math.min(y, innerHeight - m.offsetHeight - 34) + 'px';
    m.onclick = e => { const c = e.target.closest('[data-i]'); m.classList.add('hidden'); if (c) items[+c.dataset.i][1](); };
  }
  function dialog({ title, html, buttons = [['OK']], w = 320 }) {
    const m = $('#modal'); m.className = ''; m.innerHTML = `<div class="dlg" style="width:${w}px"><div class="tbar"><span class="tt">${escH(title)}</span><b class="bn cl" data-i="-1">✕</b></div><div class="dbody">${html}</div><div class="dbtn">${buttons.map((b, i) => `<button data-i="${i}">${b[0]}</button>`).join('')}</div></div>`;
    const done = i => { const b = buttons[i]; if (b && b[1]) b[1](m); m.className = 'hidden'; m.innerHTML = ''; };
    m.onclick = e => { const b = e.target.closest('[data-i]'); if (b) done(+b.dataset.i); }; m.onkeydown = e => { if (e.key === 'Enter') done(0); if (e.key === 'Escape') done(-1); };
    const f = $('input', m) || $('button', m); f && f.focus(); if ($('input', m)) $('input', m).select();
  }
  function balloon(title, text) { const b = $('#balloon'); b.innerHTML = `<b>${escH(title)}</b>${escH(text)}`; b.classList.remove('hidden'); clearTimeout(balT); balT = setTimeout(() => b.classList.add('hidden'), 4500); b.onclick = () => b.classList.add('hidden'); }
  const run = () => dialog({ title: 'Run', html: 'Type the name of a program, folder, document, or Internet address, and Windows will open it for you.<br><br>Open: <input id="rn" style="width:200px">', buttons: [['OK', m => { const v = $('#rn', m).value.trim(), k = { notepad: 'notepad', calc: 'calc', winmine: 'mine', cmd: 'cmd', iexplore: 'ie', explorer: 'explorer', control: 'control', '': null }[v.toLowerCase()]; if (k) open(k); else if (v) { if (/^(https?:\/\/|www\.)/i.test(v)) open('ie', v.startsWith('www') ? 'https://' + v : v); else dialog({ title: v, html: `Windows cannot find '${escH(v)}'. Make sure you typed the name correctly, and then try again.` }); } }], ['Cancel']], w: 360 });

  /* ---------- desktop ---------- */
  const ICONS = [['docs', '📁', 'My Documents', () => open('explorer', { loc: 'docs' })], ['root', '🖥️', 'My Computer', () => open('explorer', { loc: 'root' })], ['bin', '🗑️', 'Recycle Bin', () => open('explorer', { loc: 'bin' })], ['ie', '🌐', 'Internet Explorer', () => open('ie')]];
  async function buildDesktop() {
    const files = await FS.list('desktop'); const h = ICONS.map((x, i) => `<div class="ico" data-n="${i}"><i>${x[1]}</i><span>${x[2]}</span></div>`).join('') + files.map(f => `<div class="ico" data-f="${f.id}"><i>${fileIcon(f)}</i><span>${escH(f.name)}</span></div>`).join('');
    $('#icons').innerHTML = h; $('#icons')._f = files;
  }
  $('#icons').onclick = e => { const i = e.target.closest('.ico'); $$('.ico').forEach(n => n.classList.toggle('sel', n === i)); };
  $('#icons').ondblclick = e => { const i = e.target.closest('.ico'); if (!i) return; if (i.dataset.n) ICONS[+i.dataset.n][3](); else { const f = $('#icons')._f.find(x => x.id === i.dataset.f); f && openFile(f); } };
  $('#desktop').addEventListener('pointerdown', e => { if (!e.target.closest('.ico')) $$('.ico').forEach(n => n.classList.remove('sel')); });
  $('#screen').addEventListener('contextmenu', e => { e.preventDefault(); if (e.target.closest('.win,#taskbar,#start,#login,#modal')) return; const i = e.target.closest('.ico'); if (i && i.dataset.f) { const f = $('#icons')._f.find(x => x.id === i.dataset.f); return menu(e.clientX, e.clientY, [['Open', () => openFile(f)], ['Download', () => download(f)], '-', ['Delete', async () => { await FS.put({ ...f, from: 'desktop', folder: 'bin' }); sync(); }]]); }
    menu(e.clientX, e.clientY, [['Refresh', sync], '-', ['Upload files…', () => pickFiles('', fs => FS.import(fs))], ['New Text Document', async () => { await FS.save('New Text Document.txt', 'text/plain', new Blob(['']), 'desktop'); }], '-', ['Properties', () => open('display')]]); });
  function sync() { buildDesktop(); wins.forEach(w => w.api.sync && w.api.sync()); }

  /* ---------- start menu ---------- */
  const PIN = [['ie', 'Internet Explorer', 'Browse the web'], ['notepad', 'Notepad', ''], ['calc', 'Calculator', ''], ['mine', 'Minesweeper', ''], ['cmd', 'Command Prompt', ''], ['explorer', 'My Computer', 'Files and folders']];
  function buildStart() {
    $('#sl').innerHTML = PIN.map(p => `<div class="sm" data-o="${p[0]}"><i>${APPS[p[0]].icon}</i><div><b>${p[1]}</b>${p[2] ? `<small>${p[2]}</small>` : ''}</div></div>`).join('') + '<div class="sm all" data-all>All Programs ▶</div>';
    $('#sr').innerHTML = [['docs', '📁', 'My Documents', 1], ['pics', '🖼️', 'My Pictures', 1], ['music', '🎵', 'My Music', 1], ['root', '🖥️', 'My Computer', 1]].map(p => `<div class="sm b" data-l="${p[0]}"><i>${p[1]}</i>${p[2]}</div>`).join('') + '<hr><div class="sm" data-o="control"><i>⚙️</i>Control Panel</div><div class="sm" data-o="display"><i>🖥️</i>Display</div><hr><div class="sm" data-run><i>🏃</i>Run…</div>';
    $('#allprog').innerHTML = Object.keys(APPS).filter(k => APPS[k].prog).map(k => `<div class="sm" data-o="${k}"><i>${APPS[k].icon}</i>${APPS[k].name}</div>`).join('');
  }
  const startOpen = () => !$('#start').classList.contains('hidden');
  function toggleStart(v) { const s = $('#start'), on = v === undefined ? s.classList.contains('hidden') : v; s.classList.toggle('hidden', !on); $('#startBtn').classList.toggle('on', on); $('#allprog').classList.add('hidden'); }
  $('#startBtn').onclick = e => { e.stopPropagation(); toggleStart(); };
  $('#start').onclick = e => { const o = e.target.closest('[data-o]'), l = e.target.closest('[data-l]'); if (e.target.closest('[data-all]')) { $('#allprog').classList.toggle('hidden'); return; }
    if (o) { toggleStart(false); open(o.dataset.o); } else if (l) { toggleStart(false); open('explorer', { loc: l.dataset.l }); } else if (e.target.closest('[data-run]')) { toggleStart(false); run(); } };
  document.addEventListener('pointerdown', e => { if (startOpen() && !e.target.closest('#start,#startBtn')) toggleStart(false); if (!e.target.closest('#ctx')) $('#ctx').classList.add('hidden'); });
  $('#qlIE').onclick = () => open('ie'); $('#qlDesk').onclick = showDesktop; $('#trClock').ondblclick = () => open('datetime'); $('#trVol').onclick = () => balloon('Volume', 'Master volume: 70%');

  /* ---------- power / login ---------- */
  const goHome = () => { location.href = '../../index.html'; };
  function shutdown() {
    toggleStart(false); const m = $('#modal'); m.className = 'sd';
    m.innerHTML = '<div class="sdp"><h3>Turn off computer</h3><div class="sdb"><div data-k="standby"><i>🌙</i>Stand By</div><div data-k="off"><i>⏻</i>Turn Off</div><div data-k="restart"><i>🔄</i>Restart</div><div data-k="home"><i>🏠</i>Switch OS</div></div><div class="sdf"><button class="xb" data-k="cancel">Cancel</button></div></div>';
    m.onclick = e => { const k = e.target.closest('[data-k]'); if (!k) return; const a = k.dataset.k; m.className = 'hidden'; m.innerHTML = '';
      if (a === 'off') { $('#offMsg').textContent = 'It is now safe to turn off your computer.'; $('#off').classList.remove('hidden'); } else if (a === 'standby') { $('#offMsg').textContent = 'Stand By — click anywhere to wake up.'; $('#powerOn').classList.add('hidden'); $('#off').classList.remove('hidden'); $('#off').onclick = () => { $('#off').classList.add('hidden'); $('#powerOn').classList.remove('hidden'); $('#off').onclick = null; }; }
      else if (a === 'restart') location.reload(); else if (a === 'home') goHome(); };
  }
  function logoff() { toggleStart(false); [...wins].forEach(close); $('#login').classList.remove('hidden'); }
  $('#sfOff').onclick = shutdown; $('#lgOff').onclick = shutdown; $('#sfLog').onclick = () => dialog({ title: 'Log Off Windows', html: 'Are you sure you want to log off?', buttons: [['Log Off', logoff], ['Cancel']] }); $('#powerOn').onclick = () => location.reload();
  $('#usr').onclick = () => { const l = $('#login'); l.classList.add('hidden'); balloon('Welcome', 'Hello Student — Windows XP is ready.'); };
  setTimeout(() => { $('#boot').classList.add('hidden'); $('#login').classList.remove('hidden'); }, 3300);

  /* ---------- clock, drop, keys ---------- */
  const tick = () => { const d = new Date(); $('#trClock').textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); $('#trClock').title = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); };
  ['dragover', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' && e.dataTransfer && e.dataTransfer.files.length) FS.import(e.dataTransfer.files); }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { toggleStart(false); $('#ctx').classList.add('hidden'); } else if (e.key === 'Meta') { e.preventDefault(); toggleStart(); } });
  addEventListener('resize', () => wins.forEach(w => { if (!w.max && w.el.offsetLeft > innerWidth - 80) w.el.style.left = Math.max(0, innerWidth - 200) + 'px'; }));

  apply(); buildDesktop(); buildStart(); tick(); setInterval(tick, 15000);
  return { open, set, sync, balloon, dialog, menu, close, get settings() { return S; } };
})();

/* ===== macOS — apps, wallpapers and virtual file system =====
   Each app: { name, cls, icon, w, h, single?, plain?, render(body, win, arg) }
   Naya app add karna ho to APPS me ek entry add karo. */

/* ---------- Wallpapers (built-in + user uploaded) ---------- */
const BUILTIN_WALLS = {
  m1: { name: 'Waves', img: "url('assets/waves.svg')", bg: '#b79cff' },
  m2: { name: 'Dusk Hills', img: "url('assets/hills.svg')", bg: '#4a3b99' },
  m3: { name: 'Ribbons', img: "url('assets/ribbons.svg')", bg: '#150b3a' }
};
let CUSTOM_WALLS = [];
try { CUSTOM_WALLS = JSON.parse(localStorage.getItem('m_walls_v1') || '[]'); } catch (e) {}
const saveCustomWalls = () => { try { localStorage.setItem('m_walls_v1', JSON.stringify(CUSTOM_WALLS)); return true; } catch (e) { return false; } };
const wallIds = () => [...Object.keys(BUILTIN_WALLS), ...CUSTOM_WALLS.map(w => w.id)];
function wallInfo(id) {
  if (BUILTIN_WALLS[id]) return BUILTIN_WALLS[id];
  const c = CUSTOM_WALLS.find(w => w.id === id);
  return c ? { name: c.name, img: 'url("' + c.data + '")', bg: '#000', custom: true } : BUILTIN_WALLS.m1;
}
function applyWall(el, id, fit) {
  const w = wallInfo(id);
  el.style.backgroundColor = w.bg; el.style.backgroundImage = w.img;
  const m = { fill: ['cover', 'center', 'no-repeat'], fit: ['contain', 'center', 'no-repeat'], stretch: ['100% 100%', 'center', 'no-repeat'],
              tile: ['auto', 'top left', 'repeat'], center: ['auto', 'center', 'no-repeat'] }[w.custom ? (fit || 'fill') : 'fill'];
  el.style.backgroundSize = m[0]; el.style.backgroundPosition = m[1]; el.style.backgroundRepeat = m[2];
}
function addCustomWall(file, cb) {
  if (!file || !/^image\//.test(file.type)) return cb(null, 'Please choose an image file (JPG, PNG, WebP...).');
  const rd = new FileReader();
  rd.onerror = () => cb(null, 'Could not read this file.');
  rd.onload = () => {
    const img = new Image();
    img.onerror = () => cb(null, 'This image could not be opened.');
    img.onload = () => {
      for (const [maxW, q] of [[1920, .82], [1440, .7], [1024, .6]]) {
        const sc = Math.min(1, maxW / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        const w = { id: 'c' + Date.now(), name: file.name.replace(/\.[^.]+$/, ''), data: cv.toDataURL('image/jpeg', q) };
        CUSTOM_WALLS.push(w);
        if (saveCustomWalls()) return cb(w.id);
        CUSTOM_WALLS.pop();
      }
      cb(null, 'Browser storage is full. Remove an older custom wallpaper and try again.');
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}

/* ---------- helpers ---------- */
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

const HOME = ['Macintosh HD', 'Users', 'Student'];

/* ---------- Virtual file system (localStorage) ---------- */
const FS = (() => {
  const def = { 'Macintosh HD': { 'Applications': {}, 'Library': {}, 'System': {},
    'Users': { 'Student': { 'Desktop': {}, 'Documents': {
      'Welcome.txt': 'Welcome to macOS in your browser!\nYe ek educational prototype hai.\n\nFinder me file double-click karo, TextEdit me edit karo aur Save dabao.',
      'Ideas.txt': '1. Mission Control\n2. Stage Manager\n3. Real file upload' }, 'Downloads': {}, 'Pictures': {}, 'Music': {}, 'Movies': {} } } } };
  let root = jget('m_fs1', def), trash = jget('m_trash1', []);
  const save = () => { jset('m_fs1', root); jset('m_trash1', trash); };
  const get = p => p.reduce((n, k) => (n && typeof n === 'object') ? n[k] : undefined, root);
  const set = (p, name, val) => { const d = get(p); if (d && typeof d === 'object') { d[name] = val; save(); } };
  const del = (p, name) => { const d = get(p); if (d && name in d) { trash.push({ name, path: [...p], val: d[name] }); delete d[name]; save(); } };
  const remove = (p, name) => { const d = get(p); if (d) { delete d[name]; save(); } };
  const find = (q, node = root, path = [], out = []) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.toLowerCase().includes(q)) out.push({ name: k, path, isDir: typeof v === 'object' });
      if (typeof v === 'object' && out.length < 20) find(q, v, [...path, k], out);
    }
    return out;
  };
  return { root: () => root, trash: () => trash, get, set, del, remove, save, find };
})();
const RECENT = {
  list() { return jget('m_recent1', []); },
  add(name, path) { const l = this.list().filter(r => !(r.name === name && r.path.join('/') === path.join('/'))); l.unshift({ name, path }); jset('m_recent1', l.slice(0, 12)); }
};

/* ---------- icons (own drawings) ---------- */
const MI = {
  folder: (s = 56) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M5 14a4 4 0 0 1 4-4h14l5 6h27a4 4 0 0 1 4 4v28a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#3a9bf0"/><path d="M5 22a4 4 0 0 1 4-4h46a4 4 0 0 1 4 4v26a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill="#69c2ff"/></svg>`,
  file: (n, s = 56) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><path d="M14 4h26l12 12v42a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#c9ced6"/><path d="M40 4l12 12H42a2 2 0 0 1-2-2z" fill="#dfe3ea"/><text x="32" y="46" font-size="11" text-anchor="middle" fill="#7a8493" font-family="sans-serif">${escH((n.split('.').pop() || '').slice(0, 4).toUpperCase())}</text></svg>`,
  drive: (s = 56) => `<svg viewBox="0 0 64 64" width="${s}" height="${s}"><rect x="6" y="22" width="52" height="24" rx="5" fill="#b9c0cb"/><rect x="6" y="22" width="52" height="10" rx="5" fill="#e4e8ee"/><circle cx="14" cy="39" r="2.4" fill="#34c759"/><rect x="22" y="37" width="30" height="4" rx="2" fill="#8590a0"/></svg>`
};

const APPS = {};
const mk = (id, o) => APPS[id] = o;

/* ---------- Finder ---------- */
mk('finder', { name: 'Finder', cls: 'i-finder', icon: '🙂', w: 840, h: 540,
render(body, win, arg) {
  let path = arg && arg.path ? [...arg.path] : [...HOME, 'Documents'];
  let hist = [path], hi = 0, sel = null, view = 'icons', q = '';
  body.innerHTML = `<div class="fd"><div class="fd-bar"><button data-a="back" title="Back">‹</button><button data-a="fwd" title="Forward">›</button><span class="seg"><button data-v="icons" title="Icons">▦</button><button data-v="list" title="List">☰</button></span>
    <button data-a="newf" title="New Folder">📁＋</button><button data-a="trash" title="Move to Trash">🗑</button><span class="sp"></span><input placeholder="Search"></div>
    <div class="fd-main"><div class="fd-side"></div><div class="fd-content"></div></div><div class="fd-path"><span></span><span></span></div></div>`;
  const $q = s => body.querySelector(s), side = $q('.fd-side'), cont = $q('.fd-content'), pth = $q('.fd-path span'), cnt = $q('.fd-path span:last-child'), sin = $q('.fd-bar input');
  const key = p => p.join('/'), isSp = () => path[0] && path[0][0] === '@', isDir = () => !isSp() && typeof FS.get(path) === 'object' && key(path) !== key([...HOME.slice(0, 1), 'Applications']);
  const names = { '@apps': 'Applications', '@recents': 'Recents', '@airdrop': 'AirDrop', '@trash': 'Trash' };
  const title = () => isSp() ? names[path[0]] : path[path.length - 1];
  const SIDE = [['Favorites', [['📡', 'AirDrop', ['@airdrop']], ['🕘', 'Recents', ['@recents']], ['🚀', 'Applications', ['@apps']], ['🖥', 'Desktop', [...HOME, 'Desktop']], ['📄', 'Documents', [...HOME, 'Documents']], ['⬇️', 'Downloads', [...HOME, 'Downloads']]]],
    ['Locations', [['💽', 'Macintosh HD', ['Macintosh HD']], ['🗑', 'Trash', ['@trash']]]]];
  const go = (p, np) => { path = p; sel = null; q = ''; sin.value = ''; if (!np) { hist = hist.slice(0, hi + 1); hist.push(p); hi++; } draw(); };
  const uniq = (d, b) => { let n = b, i = 2; while (n in d) n = b + ' ' + i++; return n; };
  function openItem(parent, name) {
    const n = FS.get(parent)[name];
    if (typeof n === 'object') return go([...parent, name]);
    RECENT.add(name, parent); OS.open('textedit', { name, path: parent, content: n });
  }
  function drawSide() {
    side.innerHTML = SIDE.map(([h, items]) => `<h5>${h}</h5>` + items.map(([e, l, p]) => `<div class="fd-si ${key(p) === key(path) ? 'on' : ''}" data-p='${JSON.stringify(p)}'><span>${e}</span>${l}</div>`).join('')).join('');
  }
  function entries() {
    const node = FS.get(path) || {};
    return Object.entries(node).sort((a, b) => ((typeof a[1] === 'object') === (typeof b[1] === 'object') ? a[0].localeCompare(b[0]) : (typeof a[1] === 'object' ? -1 : 1)));
  }
  const item = (id, ico, label, data = '') => `<div class="fd-it ${sel === id ? 'sel' : ''}" data-n="${escH(id)}" ${data}>${ico}<span class="n">${escH(label)}</span></div>`;
  function drawContent() {
    let html = '', n = 0;
    if (q) {
      const r = FS.find(q.toLowerCase()); n = r.length; cont._r = r;
      html = r.length ? '<div class="fd-grid">' + r.map((x, i) => item('r' + i, x.isDir ? MI.folder() : MI.file(x.name), x.name, `data-r="${i}" title="${escH(x.path.join(' › '))}"`)).join('') + '</div>' : '<div class="empty">No results</div>';
    } else if (path[0] === '@apps') {
      const ids = Object.keys(APPS); n = ids.length;
      html = '<div class="fd-grid">' + ids.map(id => item(id, `<div class="ic ${APPS[id].cls}" style="width:56px;height:56px;border-radius:22%;display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 4px;color:#fff">${OS.iconInner(id)}</div>`, APPS[id].name, 'data-app="1"')).join('') + '</div>';
    } else if (path[0] === '@recents') {
      const r = RECENT.list().filter(x => FS.get(x.path) && x.name in FS.get(x.path)); n = r.length; cont._r = r;
      html = r.length ? '<div class="fd-grid">' + r.map((x, i) => item('r' + i, MI.file(x.name), x.name, `data-r="${i}"`)).join('') + '</div>' : '<div class="empty">No recent files</div>';
    } else if (path[0] === '@airdrop') html = '<div class="empty">📡<br>AirDrop: nobody is around right now.</div>';
    else if (path[0] === '@trash') {
      const t = FS.trash(); n = t.length;
      html = (t.length ? '<div style="margin-bottom:10px"><button class="btn" data-a="empty">Empty Trash</button></div>' : '') + (t.length ? '<div class="fd-grid">' + t.map((x, i) => item('t' + i, typeof x.val === 'object' ? MI.folder() : MI.file(x.name), x.name, `data-t="${i}"`)).join('') + '</div>' : '<div class="empty">Trash is empty</div>');
    } else if (key(path) === 'Macintosh HD/Applications') { html = '<div class="empty">Open “Applications” from the sidebar.</div>'; }
    else {
      const e = entries(); n = e.length;
      if (!e.length) html = '<div class="empty">This folder is empty.</div>';
      else if (view === 'list') html = '<table class="fd-tbl"><tr><th>Name</th><th>Kind</th><th>Size</th></tr>' + e.map(([k, v]) => `<tr class="fd-it ${sel === k ? 'sel' : ''}" data-n="${escH(k)}"><td>${typeof v === 'object' ? MI.folder(18) : MI.file(k, 18)} ${escH(k)}</td><td>${typeof v === 'object' ? 'Folder' : (k.split('.').pop() || 'Document').toUpperCase() + ' Document'}</td><td>${typeof v === 'object' ? '--' : Math.max(1, Math.ceil(v.length / 1024)) + ' KB'}</td></tr>`).join('') + '</table>';
      else html = '<div class="fd-grid">' + e.map(([k, v]) => item(k, typeof v === 'object' ? MI.folder() : MI.file(k), k)).join('') + '</div>';
    }
    cont.innerHTML = html; cnt.textContent = n + ' item' + (n === 1 ? '' : 's');
  }
  function draw() {
    win.setTitle(title()); drawSide(); drawContent();
    pth.textContent = isSp() ? title() : path.join(' › ');
    $q('[data-a=back]').disabled = hi === 0; $q('[data-a=fwd]').disabled = hi >= hist.length - 1;
    body.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    $q('[data-a=newf]').disabled = !isDir(); $q('[data-a=trash]').disabled = !(sel && (isDir() || path[0] === '@trash'));
    OS.refreshDesktop();
  }
  const newFolder = () => { if (!isDir()) return; const n = uniq(FS.get(path), 'untitled folder'); FS.set(path, n, {}); sel = n; draw(); };
  const toTrash = () => { if (sel && isDir()) { FS.del(path, sel); sel = null; draw(); } };
  const rename = () => { if (!sel || !isDir()) return; const d = FS.get(path), n = prompt('Rename:', sel); if (n && n !== sel && !(n in d)) { d[n] = d[sel]; delete d[sel]; FS.save(); sel = n; draw(); } };
  win.api = { newFolder };
  body.addEventListener('click', e => {
    const a = e.target.closest('[data-a]'), v = e.target.closest('[data-v]'), p = e.target.closest('[data-p]'), it = e.target.closest('.fd-it');
    if (a && !a.disabled) {
      const k = a.dataset.a;
      if (k === 'back' && hi > 0) { hi--; go(hist[hi], true); } if (k === 'fwd' && hi < hist.length - 1) { hi++; go(hist[hi], true); }
      if (k === 'newf') newFolder(); if (k === 'trash') { if (path[0] === '@trash') { FS.trash().splice(+sel.slice(1), 1); FS.save(); sel = null; draw(); } else toTrash(); }
      if (k === 'empty' && confirm('Permanently delete everything in the Trash?')) { FS.trash().length = 0; FS.save(); draw(); }
      return;
    }
    if (v) { view = v.dataset.v; return draw(); }
    if (p) return go(JSON.parse(p.dataset.p));
    sel = it ? it.dataset.n : null;
    cont.querySelectorAll('.fd-it.sel').forEach(x => x.classList.remove('sel')); if (it) it.classList.add('sel');
    $q('[data-a=trash]').disabled = !(sel && (isDir() || path[0] === '@trash'));
  });
  body.addEventListener('dblclick', e => {
    const it = e.target.closest('.fd-it'); if (!it) return;
    if (it.dataset.app) return OS.open(it.dataset.n);
    if (it.dataset.r !== undefined) { const r = cont._r[it.dataset.r]; return r.isDir ? go([...r.path, r.name]) : openItem(r.path, r.name); }
    if (it.dataset.t !== undefined) return;
    openItem(path, it.dataset.n);
  });
  body.addEventListener('contextmenu', e => {
    e.preventDefault(); e.stopPropagation();
    const it = e.target.closest('.fd-it');
    if (it && it.dataset.t !== undefined) { sel = it.dataset.n; drawContent(); const i = +it.dataset.t; return OS.showCtx(e.clientX, e.clientY, [['Put Back', () => { const x = FS.trash()[i], d = FS.get(x.path); if (d) { d[x.name in d ? x.name + ' copy' : x.name] = x.val; FS.trash().splice(i, 1); FS.save(); draw(); } }], ['Delete Immediately', () => { FS.trash().splice(i, 1); FS.save(); draw(); }]]); }
    if (it && isDir()) { sel = it.dataset.n; cont.querySelectorAll('.fd-it.sel').forEach(x => x.classList.remove('sel')); it.classList.add('sel'); return OS.showCtx(e.clientX, e.clientY, [['Open', () => openItem(path, sel)], ['Rename', rename], '-', ['Move to Trash', toTrash]]); }
    if (isDir()) OS.showCtx(e.clientX, e.clientY, [['New Folder', newFolder], ['Switch view', () => { view = view === 'icons' ? 'list' : 'icons'; draw(); }]]);
  });
  sin.addEventListener('input', () => { q = sin.value.trim(); sel = null; drawContent(); });
  body.addEventListener('keydown', e => { if (e.target === sin) return; if (e.key === 'Delete' || e.key === 'Backspace') toTrash(); if (e.key === 'Enter') rename(); });
  body.tabIndex = 0;
  draw();
}});

/* ---------- TextEdit ---------- */
mk('textedit', { name: 'TextEdit', cls: 'i-textedit', icon: '📄', w: 560, h: 420,
render(body, win, arg) {
  let name = arg && arg.name, path = arg && arg.path;
  body.innerHTML = `<div class="te"><div class="bar"><button class="btn" data-a="save">Save</button><button class="btn" data-a="new">New</button><span class="fn"></span></div><textarea spellcheck="false"></textarea></div>`;
  const ta = body.querySelector('textarea'), fn = body.querySelector('.fn');
  ta.value = (arg && arg.content) || '';
  const t = () => { win.setTitle(name || 'Untitled'); fn.textContent = name || 'Untitled'; };
  const save = () => { if (!name) { name = prompt('Save as:', 'Untitled.txt'); if (!name) return; path = [...HOME, 'Documents']; } FS.set(path, name, ta.value); RECENT.add(name, path); t(); OS.refreshDesktop(); OS.notify('TextEdit', 'Document saved', name); };
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  body.querySelector('.bar').onclick = e => { const a = e.target.dataset.a; if (a === 'save') save(); if (a === 'new') { name = path = null; ta.value = ''; t(); } };
  t(); ta.focus();
}});

/* ---------- Notes ---------- */
mk('notes', { name: 'Notes', cls: 'i-notes', icon: '📝', w: 720, h: 460,
render(body, win) {
  let notes = jget('m_notes1', [{ id: 1, text: 'Welcome to Notes\nType here — everything is saved in your browser.', t: Date.now() }]), cur = notes[0] && notes[0].id;
  const save = () => jset('m_notes1', notes);
  const title = n => (n.text.split('\n')[0] || 'New Note').slice(0, 40);
  const draw = (keepEd) => {
    const n = notes.find(x => x.id === cur);
    body.innerHTML = `<div class="nt"><div class="nt-side">${notes.map(x => `<div class="nt-it ${x.id === cur ? 'on' : ''}" data-id="${x.id}"><b>${escH(title(x))}</b><small>${new Date(x.t).toLocaleDateString()}</small></div>`).join('') || '<div class="empty">No notes</div>'}</div>
      <div class="nt-ed"><div class="bar"><button class="btn" data-a="new">✎ New note</button><button class="btn" data-a="del" ${n ? '' : 'disabled'}>🗑 Delete</button></div><textarea ${n ? '' : 'disabled'} placeholder="Start typing…">${n ? escH(n.text) : ''}</textarea></div></div>`;
  };
  body.onclick = e => {
    const it = e.target.closest('[data-id]'), a = e.target.dataset.a;
    if (it) { cur = +it.dataset.id; draw(); }
    if (a === 'new') { const n = { id: Date.now(), text: '', t: Date.now() }; notes.unshift(n); cur = n.id; save(); draw(); body.querySelector('textarea').focus(); }
    if (a === 'del') { notes = notes.filter(x => x.id !== cur); cur = notes[0] && notes[0].id; save(); draw(); }
  };
  body.oninput = e => { if (e.target.tagName !== 'TEXTAREA') return; const n = notes.find(x => x.id === cur); if (!n) return; n.text = e.target.value; n.t = Date.now(); save(); const b = body.querySelector('.nt-it.on b'); if (b) b.textContent = title(n); };
  draw();
}});

/* ---------- Calculator ---------- */
mk('calculator', { name: 'Calculator', cls: 'i-calculator', icon: '🧮', w: 260, h: 380, plain: true,
render(body) {
  const keys = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
  body.innerHTML = `<div class="mc"><div class="mc-d">0</div><div class="mc-k">${keys.map(k => `<button class="${'AC±%'.includes(k) && k.length < 3 ? 'f' : '÷×−+='.includes(k) ? 'o' : ''} ${k === '0' ? 'z' : ''}">${k}</button>`).join('')}</div></div>`;
  const d = body.querySelector('.mc-d'); let cur = '0', acc = null, op = null, fresh = false;
  const f = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b;
  const fm = n => isNaN(n) ? 'Error' : String(+n.toPrecision(10));
  body.querySelector('.mc-k').onclick = e => {
    const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return;
    if (/^\d$/.test(k)) { cur = (cur === '0' || fresh) ? k : cur + k; fresh = false; }
    else if (k === '.') { if (fresh) { cur = '0'; fresh = false; } if (!cur.includes('.')) cur += '.'; }
    else if (k === 'AC') { cur = '0'; acc = op = null; } else if (k === '±') cur = String(-parseFloat(cur)); else if (k === '%') cur = String(parseFloat(cur) / 100);
    else if (k === '=') { if (op !== null) { cur = fm(f(acc, parseFloat(cur), op)); acc = op = null; fresh = true; } }
    else { if (op !== null && !fresh) { acc = f(acc, parseFloat(cur), op); cur = fm(acc); } else acc = parseFloat(cur); op = k; fresh = true; }
    d.textContent = cur; d.style.fontSize = cur.length > 9 ? '30px' : '44px';
  };
}});

/* ---------- Safari ---------- */
mk('safari', { name: 'Safari', cls: 'i-safari', icon: '🧭', w: 920, h: 560,
render(body, win, arg) {
  const home = `<body style="font-family:-apple-system,Segoe UI,sans-serif;background:linear-gradient(135deg,#e8f1ff,#f6e9ff);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="font-weight:300;font-size:44px;color:#3a6df0">Start Page</h1><p style="color:#666">Type a web address above. Kuch websites iframe block karti hain — wo normal hai.</p></body>`;
  body.innerHTML = `<div class="sf"><div class="sf-bar"><button data-a="b">‹</button><button data-a="f">›</button><button data-a="r">⟳</button><input placeholder="Search or enter website name"></div><iframe></iframe></div>`;
  const fr = body.querySelector('iframe'), inp = body.querySelector('input'); let h = [], i = -1;
  const load = (u, push = true) => {
    if (!u) { fr.srcdoc = home; inp.value = ''; return; }
    if (!/^https?:\/\//.test(u)) u = u.includes('.') && !u.includes(' ') ? 'https://' + u : 'https://www.bing.com/search?q=' + encodeURIComponent(u);
    fr.removeAttribute('srcdoc'); fr.src = u; inp.value = u; if (push) { h = h.slice(0, i + 1); h.push(u); i++; } win.setTitle(u);
  };
  inp.onkeydown = e => { if (e.key === 'Enter') load(inp.value.trim()); };
  body.querySelector('.sf-bar').onclick = e => { const a = e.target.dataset.a; if (a === 'b' && i > 0) load(h[--i], false); if (a === 'f' && i < h.length - 1) load(h[++i], false); if (a === 'r') fr.src = fr.src; };
  win.api = { open: u => load(u) }; load('');
  if (arg && arg.url) load(arg.url);
}});

/* ---------- Calendar ---------- */
mk('calendar', { name: 'Calendar', cls: 'i-calendar', icon: '', html: () => { const d = new Date(); return `<span style="display:flex;flex-direction:column;align-items:center;line-height:1"><span style="font-size:.22em;color:#ff3b30;font-weight:700">${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()]}</span><span style="font-size:.62em;color:#111;font-weight:300">${d.getDate()}</span></span>`; },
w: 820, h: 540, single: true,
render(body) {
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const evs = jget('m_events1', {}), now = new Date(); let off = 0, sel = now.toDateString();
  const draw = () => {
    const v = new Date(now.getFullYear(), now.getMonth() + off, 1), st = new Date(v); st.setDate(1 - v.getDay());
    let c = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => `<div class="cal-h">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) { const d = new Date(st); d.setDate(st.getDate() + i); const k = d.toDateString(); c += `<div class="cal-d ${d.getMonth() !== v.getMonth() ? 'dim' : ''} ${k === now.toDateString() ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-k="${k}"><b>${d.getDate()}</b>${(evs[k] || []).length ? '<i></i>' : ''}</div>`; }
    body.innerHTML = `<div class="cal"><div class="cal-m"><div class="cal-bar"><b>${MN[v.getMonth()]} <span style="font-weight:300">${v.getFullYear()}</span></b><span><button class="btn" data-n="-">‹</button> <button class="btn" data-n="0">Today</button> <button class="btn" data-n="+">›</button></span></div><div class="cal-g">${c}</div></div>
      <div class="cal-s"><h3>${escH(sel)}</h3>${(evs[sel] || []).map((t, i) => `<div class="cal-ev">${escH(t)}<button data-x="${i}">✕</button></div>`).join('') || '<div class="hint">No events</div>'}<br><button class="btn pri" data-add>＋ New Event</button></div></div>`;
  };
  body.onclick = e => {
    const d = e.target.dataset, k = e.target.closest('[data-k]'); if (k) sel = k.dataset.k;
    if (d.n === '0') { off = 0; sel = now.toDateString(); } if (d.n === '-') off--; if (d.n === '+') off++;
    if (d.add !== undefined) { const t = prompt('Event title:'); if (t) (evs[sel] = evs[sel] || []).push(t); }
    if (d.x !== undefined) evs[sel].splice(+d.x, 1);
    jset('m_events1', evs); draw();
  };
  draw();
}});

/* ---------- Clock ---------- */
mk('clock', { name: 'Clock', cls: 'i-clock', icon: '⏰', w: 480, h: 500, single: true,
render(body, win) {
  let tab = 'world', sw = { run: false, t0: 0, acc: 0 }, tm = { end: 0, mins: 5 };
  const zones = [['Local', undefined], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
  const fmt = ms => { const t = Math.floor(ms / 10); return `${String(Math.floor(t / 6000)).padStart(2, '0')}:${String(Math.floor(t / 100) % 60).padStart(2, '0')}.${String(t % 100).padStart(2, '0')}`; };
  const draw = () => { body.innerHTML = `<div class="ck"><div class="ck-t">${['world', 'stopwatch', 'timer'].map(t => `<button class="${t === tab ? 'on' : ''}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div><div class="ck-b" id="ckb"></div></div>`; upd(true); };
  const upd = full => {
    const el = body.querySelector('#ckb'); if (!el) return;
    if (tab === 'world') {
      const d = new Date(), h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
      el.innerHTML = `<svg viewBox="0 0 120 120" width="180" height="180"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2"/>${[...Array(12)].map((_, i) => `<line x1="60" y1="8" x2="60" y2="${i % 3 ? 12 : 15}" stroke="currentColor" stroke-width="2" transform="rotate(${i * 30} 60 60)"/>`).join('')}<line x1="60" y1="60" x2="60" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round" transform="rotate(${h * 30 + m / 2} 60 60)"/><line x1="60" y1="60" x2="60" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round" transform="rotate(${m * 6} 60 60)"/><line x1="60" y1="66" x2="60" y2="14" stroke="#ff9f0a" stroke-width="1.5" transform="rotate(${s * 6} 60 60)"/></svg><div class="ck-z">${zones.map(z => `<div><span>${z[0]}</span><b>${d.toLocaleTimeString([], { timeZone: z[1], hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></div>`).join('')}</div>`;
    } else if (tab === 'stopwatch') {
      if (full || !el.querySelector('.ck-big')) el.innerHTML = `<div class="ck-big"></div><div><button class="btn pri" data-sw="go">${sw.run ? 'Stop' : 'Start'}</button> <button class="btn" data-sw="reset">Reset</button></div>`;
      el.querySelector('.ck-big').textContent = fmt(sw.acc + (sw.run ? Date.now() - sw.t0 : 0));
    } else {
      const left = tm.end ? Math.max(0, tm.end - Date.now()) : tm.mins * 60000;
      if (tm.end && left === 0) { tm.end = 0; OS.notify('Clock', 'Timer finished', tm.mins + ' minute timer is done.'); }
      if (full || !el.querySelector('.ck-big')) el.innerHTML = `<div class="ck-big"></div><div>${tm.end ? '' : 'Minutes: <input type="number" id="tmin" min="1" max="180" value="' + tm.mins + '" style="width:64px"> '}<button class="btn pri" data-tm="go">${tm.end ? 'Cancel' : 'Start'}</button></div>`;
      el.querySelector('.ck-big').textContent = fmt(left);
    }
  };
  body.onclick = e => {
    const d = e.target.dataset;
    if (d.t) { tab = d.t; draw(); }
    if (d.sw === 'go') { if (sw.run) { sw.acc += Date.now() - sw.t0; sw.run = false; } else { sw.t0 = Date.now(); sw.run = true; } draw(); }
    if (d.sw === 'reset') { sw = { run: false, t0: 0, acc: 0 }; draw(); }
    if (d.tm === 'go') { if (tm.end) tm.end = 0; else { tm.mins = Math.max(1, +body.querySelector('#tmin').value || 1); tm.end = Date.now() + tm.mins * 60000; } draw(); }
  };
  const iv = setInterval(() => upd(false), 100); win.onclose = () => clearInterval(iv); draw();
}});

/* ---------- Weather (demo data) ---------- */
mk('weather', { name: 'Weather', cls: 'i-weather', icon: '⛅', w: 520, h: 480, single: true, plain: true,
render(body) {
  const cities = ['Delhi', 'Mumbai', 'Patna', 'Bengaluru', 'London', 'New York', 'Tokyo'], cond = [['☀️', 'Sunny'], ['⛅', 'Partly cloudy'], ['☁️', 'Cloudy'], ['🌧️', 'Rain'], ['⛈️', 'Thunderstorm']];
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const draw = c => { const h = hash(c + new Date().toDateString()), now = cond[h % 5];
    body.innerHTML = `<div class="wx"><select id="wxc">${cities.map(x => `<option ${x === c ? 'selected' : ''}>${x}</option>`).join('')}</select><div class="wx-n"><span>${now[0]}</span><b>${14 + h % 22}°</b><div>${now[1]}</div></div>
      <div class="wx-d">${['Tomorrow', '+2', '+3', '+4', '+5'].map(d => { const x = hash(c + d), k = cond[x % 5]; return `<div><small>${d}</small><span>${k[0]}</span><b>${14 + x % 22}°</b></div>`; }).join('')}</div><small style="opacity:.8">Demo data — not a real forecast.</small></div>`; };
  body.onchange = e => { if (e.target.id === 'wxc') draw(e.target.value); }; draw('Delhi');
}});

/* ---------- Photos ---------- */
mk('photos', { name: 'Photos', cls: 'i-photos', icon: '🌸', w: 860, h: 540,
render(body) {
  const extra = []; let cur = -1;
  const all = () => [...wallIds().map(id => ({ id, name: wallInfo(id).name })), ...extra];
  const paint = (el, it, fit) => { if (it.id) applyWall(el, it.id, fit); else { Object.assign(el.style, { backgroundImage: `url("${it.url}")`, backgroundSize: fit === 'fit' ? 'contain' : 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundColor: '#000' }); } };
  const draw = () => {
    const l = all();
    body.innerHTML = cur < 0 ? `<div class="ph"><div class="ph-bar"><b>Library</b><span><button class="btn pri" data-o>Import…</button></span><input type="file" id="pf" accept="image/*" multiple hidden></div><div class="ph-g">${l.map((it, i) => `<div class="ph-t" data-i="${i}" title="${escH(it.name)}"></div>`).join('')}</div></div>`
      : `<div class="ph"><div class="ph-bar"><button class="btn" data-back>‹ Library</button><b>${escH(l[cur].name)}</b><span><button class="btn" data-prev>‹</button><button class="btn" data-next>›</button><button class="btn pri" data-set>Set as Desktop Picture</button></span></div><div class="ph-v"></div></div>`;
    if (cur < 0) body.querySelectorAll('.ph-t').forEach(el => paint(el, l[+el.dataset.i], 'fill')); else paint(body.querySelector('.ph-v'), l[cur], 'fit');
  };
  body.onclick = e => {
    const d = e.target.dataset, th = e.target.closest('[data-i]'), l = all();
    if (th) cur = +th.dataset.i; if (d.back !== undefined) cur = -1;
    if (d.prev !== undefined) cur = (cur - 1 + l.length) % l.length; if (d.next !== undefined) cur = (cur + 1) % l.length;
    if (d.o !== undefined) return body.querySelector('#pf').click();
    if (d.set !== undefined) { const it = l[cur]; if (it.id) OS.set({ wall: it.id }); else addCustomWall(it.file, (id, err) => id ? (OS.set({ wall: id }), OS.notify('Photos', 'Desktop picture changed', it.name)) : OS.notify('Photos', 'Could not set picture', err)); return; }
    draw();
  };
  body.onchange = e => { if (e.target.id === 'pf') { [...e.target.files].forEach(f => extra.push({ name: f.name, file: f, url: URL.createObjectURL(f) })); draw(); } };
  draw();
}});

/* ---------- Photo Booth ---------- */
mk('camera', { name: 'Photo Booth', cls: 'i-camera', icon: '📸', w: 640, h: 500, single: true,
render(body, win) {
  body.innerHTML = `<div class="cam"><video autoplay playsinline muted></video><div class="m">Starting camera…</div><div class="bar"><button class="btn pri" data-snap>📸 Take photo</button></div><div class="sh"></div></div>`;
  const v = body.querySelector('video'), m = body.querySelector('.m'), sh = body.querySelector('.sh'); let stream;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) m.textContent = 'Camera is not available here (needs https or localhost).';
  else navigator.mediaDevices.getUserMedia({ video: true }).then(s => { stream = s; v.srcObject = s; m.style.display = 'none'; }).catch(() => m.textContent = 'Camera permission denied or no camera found.');
  win.onclose = () => stream && stream.getTracks().forEach(t => t.stop());
  body.onclick = e => { if (e.target.dataset.snap === undefined || !v.videoWidth) return; const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'photo-' + Date.now() + '.png'; a.innerHTML = `<img src="${a.href}" height="56">`; sh.prepend(a); };
}});

/* ---------- Terminal ---------- */
mk('terminal', { name: 'Terminal', cls: 'i-terminal', icon: '', html: '<span style="font:700 .42em Menlo,Consolas,monospace">&gt;_</span>', w: 640, h: 380,
render(body) {
  const P = 'student@Mac ~ % ';
  body.innerHTML = `<div class="term"><div class="out"></div><div class="in">${P}<input spellcheck="false"></div></div>`;
  const out = body.querySelector('.out'), inp = body.querySelector('input'), term = body.querySelector('.term');
  const pr = t => { const d = document.createElement('div'); d.className = 'l'; d.textContent = t; out.appendChild(d); term.scrollTop = term.scrollHeight; };
  pr('Last login: ' + new Date().toString().slice(0, 24) + ' on ttys000\nVirtual macOS terminal (demo). Type "help".\n');
  const c = {
    help: () => 'help, ls, pwd, whoami, date, echo <text>, clear, sw_vers, uname, neofetch, open <app>, apps',
    ls: () => Object.keys(FS.get([...HOME, 'Documents']) || {}).join('  '), pwd: () => '/Users/Student', whoami: () => 'student', date: () => new Date().toString(),
    sw_vers: () => 'ProductName:  macOS (Virtual)\nProductVersion: 0.1', uname: () => 'Darwin Virtual-Mac 23.0.0 web x86_64',
    neofetch: () => 'student@Virtual-Mac\n-------------------\nOS: macOS (Virtual) 0.1\nHost: Your Browser\nShell: zsh (demo)\nResolution: ' + innerWidth + 'x' + innerHeight, apps: () => Object.keys(APPS).join(', '),
    clear: () => { out.innerHTML = ''; return ''; }, echo: a => a.join(' '), open: a => APPS[a[0]] ? (OS.open(a[0]), 'Opening ' + APPS[a[0]].name + '…') : 'The file ' + (a[0] || '') + ' does not exist.'
  };
  inp.onkeydown = e => { if (e.key !== 'Enter') return; const l = inp.value.trim(); pr(P + l); inp.value = ''; if (!l) return; const [x, ...a] = l.split(/\s+/); const f = c[x]; const r = f ? f(a) : 'zsh: command not found: ' + x; if (r) pr(r); };
  term.onclick = () => { if (!getSelection().toString()) inp.focus(); }; inp.focus();
}});

/* ---------- Activity Monitor ---------- */
mk('activity', { name: 'Activity Monitor', cls: 'i-activity', icon: '📈', w: 540, h: 380, single: true,
render(body, win) {
  const draw = () => {
    const rows = OS.runningApps().filter(id => id !== 'activity').map((id, i) => `<tr><td>${OS.iconInner(id)} ${APPS[id] ? APPS[id].name : id}</td><td>${(1 + (id.length * 3 + i) % 9).toFixed(1)}%</td><td>${60 + (id.length * 17) % 300} MB</td><td>${id === 'finder' ? '' : `<button class="btn" data-q="${id}">Quit</button>`}</td></tr>`).join('');
    body.innerHTML = `<div class="am"><table><tr><th>Process Name</th><th>% CPU</th><th>Memory</th><th></th></tr>${rows}</table></div>`;
  };
  body.onclick = e => { if (e.target.dataset.q) { OS.quit(e.target.dataset.q); draw(); } };
  const t = setInterval(draw, 1500); win.onclose = () => clearInterval(t); draw();
}});

/* ---------- System Settings ---------- */
mk('settings', { name: 'System Settings', cls: 'i-settings', icon: '⚙️', w: 780, h: 520, single: true,
render(body, win) {
  const panes = [['🎨', 'Appearance'], ['🖼️', 'Wallpaper'], ['🧲', 'Desktop & Dock'], ['🖥️', 'Displays'], ['ℹ️', 'About This Mac']];
  const accents = [['Blue', '#0a84ff'], ['Purple', '#bf5af2'], ['Pink', '#ff375f'], ['Red', '#ff453a'], ['Orange', '#ff9f0a'], ['Green', '#30d158']];
  const fits = [['fill', 'Fill Screen'], ['fit', 'Fit to Screen'], ['stretch', 'Stretch'], ['center', 'Center'], ['tile', 'Tile']];
  let pane = 'Appearance';
  const sw = (k, on) => `<div class="sw ${on ? 'on' : ''}" data-sw="${k}"></div>`;
  const draw = () => {
    const s = OS.settings; let m = '';
    if (pane === 'Appearance') m = `<h2>Appearance</h2><div class="card"><div class="seg2"><div class="opt ${!s.dark ? 'on' : ''}" data-dark="0"><div class="th" style="background:linear-gradient(135deg,#fff,#dcdfe6)"></div>Light</div><div class="opt ${s.dark ? 'on' : ''}" data-dark="1"><div class="th" style="background:linear-gradient(135deg,#3a3a3d,#111)"></div>Dark</div></div></div>
      <div class="card"><b>Accent colour</b><div class="walls">${accents.map(a => `<div class="wall ${s.accent === a[1] ? 'on' : ''}" data-acc="${a[1]}" title="${a[0]}" style="width:34px;height:34px;border-radius:50%;background:${a[1]}"></div>`).join('')}</div></div>`;
    if (pane === 'Wallpaper') m = `<h2>Wallpaper</h2><div class="card"><b>Desktop picture</b><div class="hint">Choose a macOS-style wallpaper, or upload your own photo from your PC. (You can also drag &amp; drop an image onto the desktop.)</div>
      <div class="walls">${wallIds().map(id => `<div class="wall ${s.wall === id ? 'on' : ''}" data-wall="${id}" title="${escH(wallInfo(id).name)}">${wallInfo(id).custom ? `<button class="wdel" data-del="${id}">✕</button>` : ''}</div>`).join('')}<div class="wall add" data-add>＋<span>Add Photo…</span></div></div>
      <input type="file" id="wfile" accept="image/*" hidden><div class="row" style="margin-top:10px"><span>Fit</span><select id="fit">${fits.map(f => `<option value="${f[0]}" ${s.fit === f[0] ? 'selected' : ''}>${f[1]}</option>`).join('')}</select></div><div class="hint" id="wmsg"></div></div>`;
    if (pane === 'Desktop & Dock') m = `<h2>Desktop &amp; Dock</h2><div class="card"><div class="row"><span>Size</span><input type="range" id="dsz" min="36" max="80" value="${s.dockSize}"></div><div class="row"><span>Magnification</span>${sw('mag', s.magnify)}</div><div class="row"><span>Automatically hide and show the Dock</span>${sw('hide', s.hide)}</div></div>`;
    if (pane === 'Displays') m = `<h2>Displays</h2><div class="card"><div class="row"><span>Brightness</span><input type="range" id="sbr" min="30" max="100" value="${s.brightness}"></div></div><div class="card"><div class="row"><span>Night Shift</span>${sw('night', OS.sys.night)}</div></div>`;
    if (pane === 'About This Mac') m = `<h2>About This Mac</h2><div class="card" style="text-align:center;padding:26px"><div style="font-size:54px">💻</div><h3 style="margin:8px 0 2px">macOS (Virtual)</h3><div class="hint">Version 0.1 — Virtual Computer</div><br>Chip: Web Silicon<br>Memory: your browser<br>User: Student<br><br><small class="hint">Educational project — not affiliated with Apple.</small></div>`;
    body.innerHTML = `<div class="st"><div class="st-s">${panes.map(p => `<div class="st-i ${p[1] === pane ? 'on' : ''}" data-pane="${p[1]}"><span>${p[0]}</span>${p[1]}</div>`).join('')}</div><div class="st-m">${m}</div></div>`;
    body.querySelectorAll('.wall[data-wall]').forEach(el => applyWall(el, el.dataset.wall, 'fill'));
  };
  const msg = t => { const x = body.querySelector('#wmsg'); if (x) x.textContent = t; };
  body.onclick = e => {
    const d = e.target.dataset, t = e.target;
    if (d.del) { e.stopPropagation(); CUSTOM_WALLS = CUSTOM_WALLS.filter(w => w.id !== d.del); saveCustomWalls(); if (OS.settings.wall === d.del) OS.set({ wall: 'm1' }); return draw(); }
    if (t.closest('[data-add]')) return body.querySelector('#wfile').click();
    const pn = t.closest('[data-pane]'), dk = t.closest('[data-dark]'), wl = t.closest('[data-wall]'), ac = t.closest('[data-acc]'), s = t.closest('[data-sw]');
    if (pn) pane = pn.dataset.pane; if (dk) OS.set({ dark: dk.dataset.dark === '1' }); if (wl) OS.set({ wall: wl.dataset.wall }); if (ac) OS.set({ accent: ac.dataset.acc });
    if (s) { const k = s.dataset.sw; if (k === 'mag') OS.set({ magnify: !OS.settings.magnify }); if (k === 'hide') OS.set({ hide: !OS.settings.hide }); if (k === 'night') OS.toggleNight(); }
    draw();
  };
  body.onchange = e => {
    if (e.target.id === 'fit') OS.set({ fit: e.target.value });
    if (e.target.id === 'wfile' && e.target.files[0]) addCustomWall(e.target.files[0], (id, err) => { if (id) { OS.set({ wall: id }); draw(); } else msg(err); });
  };
  body.oninput = e => { if (e.target.id === 'dsz') OS.set({ dockSize: +e.target.value }); if (e.target.id === 'sbr') OS.set({ brightness: +e.target.value }); };
  win.api = { pane: p => { pane = p; draw(); } };
  draw();
}});

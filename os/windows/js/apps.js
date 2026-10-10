/* ===== Apps for Windows 11 Web (educational prototype) =====
   Each app: { name, icon, w, h, single?, render(body, win, arg) }
   Naya app add karna ho to bas APPS me ek entry add karo. */

/* ---------- Wallpapers (built-in + user uploaded) ---------- */
const BUILTIN_WALLS = {
  '1': { name: 'Bloom', img: "url('assets/bloom-dark.svg')", bg: '#020814' },
  '2': { name: 'Bloom (light)', img: "url('assets/bloom-light.svg')", bg: '#dfe9ff' },
  '3': { name: 'Glow', img: "url('assets/glow.svg')", bg: '#0b0620' },
  '4': { name: 'Sunrise', img: 'radial-gradient(circle at 60% 35%,#ffd194 0,transparent 40%),linear-gradient(135deg,#ff7e5f,#6a3093)', bg: '#6a3093' }
};
let CUSTOM_WALLS = [];
try { CUSTOM_WALLS = JSON.parse(localStorage.getItem('w11_walls_v1') || '[]'); } catch (e) {}
const saveCustomWalls = () => { try { localStorage.setItem('w11_walls_v1', JSON.stringify(CUSTOM_WALLS)); return true; } catch (e) { return false; } };
const wallIds = () => [...Object.keys(BUILTIN_WALLS), ...CUSTOM_WALLS.map(w => w.id)];
function wallInfo(id) {
  if (BUILTIN_WALLS[id]) return BUILTIN_WALLS[id];
  const c = CUSTOM_WALLS.find(w => w.id === id);
  return c ? { name: c.name, img: 'url("' + c.data + '")', bg: '#000', custom: true } : BUILTIN_WALLS['1'];
}
function applyWall(el, id, fit) {
  const w = wallInfo(id);
  el.style.backgroundColor = w.bg; el.style.backgroundImage = w.img;
  const m = { fill: ['cover', 'center', 'no-repeat'], fit: ['contain', 'center', 'no-repeat'], stretch: ['100% 100%', 'center', 'no-repeat'],
              tile: ['auto', 'top left', 'repeat'], center: ['auto', 'center', 'no-repeat'] }[w.custom ? (fit || 'fill') : 'fill'];
  el.style.backgroundSize = m[0]; el.style.backgroundPosition = m[1]; el.style.backgroundRepeat = m[2];
}
/* PC se image lo -> chhota karo (localStorage limit) -> save. cb(id) ya cb(null, 'error msg') */
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
      cb(null, 'Browser storage is full. Delete an older custom wallpaper and try again.');
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}

const HOME = ['Local Disk (C:)', 'Users', 'Student'];

/* ---------- Virtual file system (saved in localStorage) ---------- */
const FS = (() => {
  const def = {
    'Local Disk (C:)': {
      'Windows': {}, 'Program Files': {},
      'Users': { 'Student': {
        'Desktop': {},
        'Documents': {
          'readme.txt': 'Welcome to Windows 11 Web!\nYe ek educational prototype hai.\n\nDouble-click karke files kholo, Notepad me edit karo aur Ctrl+S se save karo.',
          'todo.txt': '1. Start menu improve karna\n2. Real file upload\n3. Window snap layouts'
        },
        'Downloads': {}, 'Pictures': {}, 'Music': {}, 'Videos': {}
      } }
    },
    'Local Disk (D:)': { 'Projects': {}, 'Backup': {} }
  };
  let root, bin = [];
  try { root = JSON.parse(localStorage.getItem('w11_fs2')) || def; } catch (e) { root = def; }
  try { bin = JSON.parse(localStorage.getItem('w11_bin')) || []; } catch (e) { bin = []; }
  const save = () => { try { localStorage.setItem('w11_fs2', JSON.stringify(root)); localStorage.setItem('w11_bin', JSON.stringify(bin)); } catch (e) {} };
  const get = (path) => path.reduce((n, k) => (n && typeof n === 'object') ? n[k] : undefined, root);
  const set = (path, name, val) => { const d = get(path); if (d && typeof d === 'object') { d[name] = val; save(); } };
  const del = (path, name) => { const d = get(path); if (d && name in d) { bin.push({ name, path: [...path], val: d[name], t: Date.now() }); delete d[name]; save(); } };
  const remove = (path, name) => { const d = get(path); if (d) { delete d[name]; save(); } };
  /* recursive search by name */
  const find = (q, node = root, path = [], out = []) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.toLowerCase().includes(q)) out.push({ name: k, path, isDir: typeof v === 'object' });
      if (typeof v === 'object' && out.length < 30) find(q, v, [...path, k], out);
    }
    return out;
  };
  return { root: () => root, bin: () => bin, get, set, del, remove, save, find };
})();

/* recent files (Start menu "Recommended") */
const RECENT = {
  list() { try { return JSON.parse(localStorage.getItem('w11_recent')) || [{ name: 'readme.txt', path: [...HOME, 'Documents'], t: Date.now() - 4 * 60000 }, { name: 'todo.txt', path: [...HOME, 'Documents'], t: Date.now() - 52 * 60000 }]; } catch (e) { return []; } },
  add(name, path) { const l = this.list().filter(r => !(r.name === name && r.path.join('/') === path.join('/'))); l.unshift({ name, path, t: Date.now() }); try { localStorage.setItem('w11_recent', JSON.stringify(l.slice(0, 6))); } catch (e) {} }
};

const APPS = {

/* ---------- Notepad ---------- */
notepad: { name: 'Notepad', icon: '📝', w: 560, h: 400,
render(body, win, arg) {
  let name = arg && arg.name, path = arg && arg.path;
  body.innerHTML = `<div class="np"><div class="np-bar"><button class="btn" data-a="new">New</button><button class="btn" data-a="save">Save (Ctrl+S)</button><span class="fn"></span></div>
  <textarea spellcheck="false"></textarea><div class="np-st">Ln 1, Col 1</div></div>`;
  const ta = body.querySelector('textarea'), st = body.querySelector('.np-st'), fn = body.querySelector('.fn');
  ta.value = (arg && arg.content) || '';
  const title = () => { const t = (name || 'Untitled') + ' - Notepad'; win.setTitle(t); fn.textContent = name || 'Untitled'; };
  const pos = () => { const l = ta.value.slice(0, ta.selectionStart).split('\n'); st.textContent = `Ln ${l.length}, Col ${l[l.length - 1].length + 1}`; };
  const save = () => {
    if (!name) { name = prompt('File name (e.g. notes.txt):', 'notes.txt'); if (!name) return; path = [...HOME, 'Documents']; }
    FS.set(path, name, ta.value); RECENT.add(name, path); title(); st.textContent = 'Saved ✔'; if (window.OS) OS.notify('Notepad', 'File saved', name);
  };
  ta.addEventListener('keyup', pos); ta.addEventListener('click', pos);
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  body.querySelector('.np-bar').onclick = e => { const a = e.target.dataset.a; if (a === 'save') save(); if (a === 'new') { name = path = null; ta.value = ''; title(); } };
  title(); ta.focus();
  if (name && path) RECENT.add(name, path);
}},

/* ---------- Calculator ---------- */
calc: { name: 'Calculator', icon: '🧮', w: 320, h: 460,
render(body, win) {
  const keys = ['C','⌫','%','÷','7','8','9','×','4','5','6','−','1','2','3','+','±','0','.','='];
  body.innerHTML = `<div class="calc"><div class="calc-exp"></div><div class="calc-disp">0</div><div class="calc-keys">${keys.map(k => `<button class="${'÷×−+'.includes(k) ? 'op' : k === '=' ? 'eq' : ''}">${k}</button>`).join('')}</div></div>`;
  const exp = body.querySelector('.calc-exp'), disp = body.querySelector('.calc-disp');
  let cur = '0', acc = null, op = null, fresh = false;
  const calc = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b;
  const fmt = n => isNaN(n) ? 'Cannot divide by zero' : String(+n.toPrecision(12));
  body.querySelector('.calc-keys').onclick = e => {
    const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return;
    if (/\d/.test(k)) { cur = (cur === '0' || fresh) ? k : cur + k; fresh = false; }
    else if (k === '.') { if (fresh) { cur = '0'; fresh = false; } if (!cur.includes('.')) cur += '.'; }
    else if (k === 'C') { cur = '0'; acc = op = null; exp.textContent = ''; }
    else if (k === '⌫') cur = cur.length > 1 ? cur.slice(0, -1) : '0';
    else if (k === '±') cur = String(-parseFloat(cur));
    else if (k === '%') cur = String(parseFloat(cur) / 100);
    else if (k === '=') { if (op !== null) { const r = calc(acc, parseFloat(cur), op); exp.textContent = `${acc} ${op} ${cur} =`; cur = fmt(r); acc = op = null; fresh = true; } }
    else { if (op !== null && !fresh) { acc = calc(acc, parseFloat(cur), op); cur = fmt(acc); } else acc = parseFloat(cur); op = k; exp.textContent = `${acc} ${k}`; fresh = true; }
    disp.textContent = cur;
  };
}},

/* ---------- Settings ---------- */
settings: { name: 'Settings', icon: '⚙️', w: 800, h: 520, single: true,
render(body, win) {
  const tabs = ['Personalization', 'System', 'About'];
  let tab = 0;
  const accents = ['#0067c0', '#e81123', '#107c10', '#8764b8', '#ff8c00'];
  const fits = [['fill', 'Fill'], ['fit', 'Fit'], ['stretch', 'Stretch'], ['tile', 'Tile'], ['center', 'Center']];
  const draw = () => {
    const s = OS.settings;
    let main = '';
    if (tab === 0) main = `<h2>Personalization</h2>
      <div class="card"><b>Theme</b><br><br><button class="btn ${!s.dark ? 'primary' : ''}" data-theme="0">☀️ Light</button> <button class="btn ${s.dark ? 'primary' : ''}" data-theme="1">🌙 Dark</button></div>
      <div class="card"><b>Background</b><div class="hint">Windows images ya apni photo — "Browse photos" se apne PC se upload karo. (Desktop pe image drag-drop bhi kar sakte ho.)</div>
        <div class="walls">${wallIds().map(id => { const w = wallInfo(id); return `<div class="wall ${s.wall === id ? 'on' : ''}" data-wall="${id}" title="${w.name}">${w.custom ? `<button class="wdel" data-del="${id}" title="Remove">✕</button>` : ''}</div>`; }).join('')}
        <div class="wall add" data-add title="Browse photos">＋<span>Browse photos</span></div></div>
        <input type="file" id="wfile" accept="image/*" hidden>
        <div class="fitrow">Choose a fit for your photo: <select id="fit">${fits.map(f => `<option value="${f[0]}" ${s.fit === f[0] ? 'selected' : ''}>${f[1]}</option>`).join('')}</select></div>
        <div id="wmsg" class="hint"></div></div>
      <div class="card"><b>Accent colour</b><div class="swatches">${accents.map(c => `<div class="sw ${s.accent === c ? 'on' : ''}" data-acc="${c}" style="background:${c}"></div>`).join('')}</div></div>`;
    if (tab === 1) main = `<h2>System</h2><div class="card"><b>Display brightness</b><br><br><input type="range" min="30" max="100" value="${s.brightness}" id="sbr" style="width:100%"></div>
      <div class="card"><b>Reset</b><br><br><button class="btn" id="rst">Reset files, wallpapers &amp; settings</button></div>`;
    if (tab === 2) main = `<h2>About</h2><div class="card">Windows 11 Web — educational prototype<br>Version 0.3 (HTML + CSS + JavaScript)<br>Device name: WEB-PC<br>User: Student<br><br><small>Not affiliated with or endorsed by Microsoft.</small></div>`;
    body.innerHTML = `<div class="set"><div class="set-side">${tabs.map((t, i) => `<div class="${i === tab ? 'on' : ''}" data-t="${i}">${t}</div>`).join('')}</div><div class="set-main">${main}</div></div>`;
    body.querySelectorAll('.wall[data-wall]').forEach(el => applyWall(el, el.dataset.wall, 'fill'));
  };
  const msg = t => { const m = body.querySelector('#wmsg'); if (m) m.textContent = t; };
  body.onclick = e => {
    const d = e.target.dataset;
    if (d.del) { e.stopPropagation(); CUSTOM_WALLS = CUSTOM_WALLS.filter(w => w.id !== d.del); saveCustomWalls(); if (OS.settings.wall === d.del) OS.set({ wall: '1' }); draw(); return; }
    if (d.add !== undefined || e.target.closest('[data-add]')) { body.querySelector('#wfile').click(); return; }
    if (d.t) tab = +d.t;
    if (d.theme) OS.set({ dark: d.theme === '1' });
    if (d.wall) OS.set({ wall: d.wall });
    if (d.acc) OS.set({ accent: d.acc });
    if (e.target.id === 'rst' && confirm('Sab reset karna hai?')) { localStorage.clear(); location.reload(); }
    if (e.target.closest('.wall[data-wall]') && !d.wall) OS.set({ wall: e.target.closest('.wall').dataset.wall });
    if (Object.keys(d).length || e.target.closest('.wall')) draw();
  };
  body.onchange = e => {
    if (e.target.id === 'fit') OS.set({ fit: e.target.value });
    if (e.target.id === 'wfile' && e.target.files[0]) addCustomWall(e.target.files[0], (id, err) => { if (id) { OS.set({ wall: id }); draw(); } else msg(err); });
  };
  body.oninput = e => { if (e.target.id === 'sbr') OS.set({ brightness: +e.target.value }); };
  draw();
}},

/* ---------- Edge-like browser ---------- */
edge: { name: 'Microsoft Edge', icon: '🌐', w: 900, h: 540,
render(body, win) {
  const home = `<body style="font-family:Segoe UI,sans-serif;background:linear-gradient(135deg,#e0f0ff,#f6f9ff);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0"><h1 style="font-weight:300;font-size:44px;color:#0067c0">Search the web</h1><p style="color:#555">Address bar me URL likho (e.g. wikipedia.org). Kuch websites iframe block karti hain — wo normal hai.</p></body>`;
  body.innerHTML = `<div class="br"><div class="br-bar"><button data-a="b">←</button><button data-a="f">→</button><button data-a="r">⟳</button><input placeholder="Search or enter web address"></div><iframe></iframe></div>`;
  const fr = body.querySelector('iframe'), inp = body.querySelector('input');
  let hist = [], idx = -1;
  const load = (u, push = true) => {
    if (!u) { fr.srcdoc = home; inp.value = ''; return; }
    if (!/^https?:\/\//.test(u)) u = u.includes('.') && !u.includes(' ') ? 'https://' + u : 'https://www.bing.com/search?q=' + encodeURIComponent(u);
    fr.removeAttribute('srcdoc'); fr.src = u; inp.value = u;
    if (push) { hist = hist.slice(0, idx + 1); hist.push(u); idx++; }
    win.setTitle(u + ' - Edge');
  };
  inp.onkeydown = e => { if (e.key === 'Enter') load(inp.value.trim()); };
  body.querySelector('.br-bar').onclick = e => {
    const a = e.target.dataset.a;
    if (a === 'b' && idx > 0) load(hist[--idx], false);
    if (a === 'f' && idx < hist.length - 1) load(hist[++idx], false);
    if (a === 'r') fr.src = fr.src;
  };
  load('');
}},

/* ---------- Paint ---------- */
paint: { name: 'Paint', icon: '🎨', w: 760, h: 520,
render(body, win) {
  body.innerHTML = `<div class="pt"><div class="pt-bar">Colour <input type="color" value="#000000"> Size <input type="range" min="1" max="40" value="4"> <button class="btn" data-a="e">Eraser</button> <button class="btn" data-a="c">Clear</button> <button class="btn" data-a="s">Save PNG</button></div><div class="pt-wrap"><canvas width="1000" height="600"></canvas></div></div>`;
  const cv = body.querySelector('canvas'), cx = cv.getContext('2d'), col = body.querySelector('input[type=color]'), sz = body.querySelector('input[type=range]');
  cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.lineCap = cx.lineJoin = 'round';
  let draw = false, erase = false;
  const p = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
  cv.onpointerdown = e => { draw = true; cv.setPointerCapture(e.pointerId); cx.beginPath(); cx.moveTo(...p(e)); };
  cv.onpointermove = e => { if (!draw) return; cx.strokeStyle = erase ? '#fff' : col.value; cx.lineWidth = sz.value; cx.lineTo(...p(e)); cx.stroke(); };
  cv.onpointerup = () => draw = false;
  body.querySelector('.pt-bar').onclick = e => {
    const a = e.target.dataset.a;
    if (a === 'e') { erase = !erase; e.target.classList.toggle('primary', erase); }
    if (a === 'c') { cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); }
    if (a === 's') { const l = document.createElement('a'); l.download = 'paint.png'; l.href = cv.toDataURL(); l.click(); }
  };
}},

/* ---------- Terminal ---------- */
terminal: { name: 'Terminal', icon: '⬛', w: 640, h: 380,
render(body, win) {
  body.innerHTML = `<div class="term"><div class="out"></div><div class="in">C:\\Users\\Student&gt;<input spellcheck="false"></div></div>`;
  const out = body.querySelector('.out'), inp = body.querySelector('input'), term = body.querySelector('.term');
  const print = t => { const d = document.createElement('div'); d.className = 'line'; d.textContent = t; out.appendChild(d); term.scrollTop = term.scrollHeight; };
  print('Windows 11 Web [Version 0.1]\n(Educational prototype) Type "help" for commands.\n');
  const cmds = {
    help: () => 'help, ver, date, time, echo <text>, dir, whoami, cls, start <app>, apps',
    ver: () => 'Windows 11 Web [Version 0.1]', date: () => new Date().toLocaleDateString(), time: () => new Date().toLocaleTimeString(),
    whoami: () => 'web-pc\\student', apps: () => Object.keys(APPS).join(', '),
    dir: () => Object.entries(FS.get([...HOME, 'Documents']) || {}).map(([k, v]) => (typeof v === 'object' ? '<DIR>  ' : '       ') + k).join('\n'),
    cls: () => { out.innerHTML = ''; return ''; },
    echo: a => a.join(' '),
    start: a => APPS[a[0]] ? (OS.open(a[0]), 'Starting ' + a[0] + '...') : 'App not found. Try: apps'
  };
  inp.onkeydown = e => {
    if (e.key !== 'Enter') return;
    const line = inp.value.trim(); print('C:\\Users\\Student>' + line); inp.value = '';
    if (!line) return;
    const [c, ...a] = line.split(/\s+/); const f = cmds[c.toLowerCase()];
    const r = f ? f(a) : `'${c}' is not recognized as an internal or external command.`; if (r) print(r);
  };
  term.onclick = () => { if (!getSelection().toString()) inp.focus(); }; inp.focus();
}},

/* ---------- Task Manager ---------- */
taskmgr: { name: 'Task Manager', icon: '📊', w: 520, h: 360, single: true,
render(body, win) {
  const draw = () => {
    const rows = OS.list().filter(w => w.app !== 'taskmgr').map(w => `<tr><td>${APPS[w.app].icon} ${w.title}</td><td>${w.min ? 'Suspended' : 'Running'}</td><td><button class="btn" data-id="${w.id}">End task</button></td></tr>`).join('');
    body.innerHTML = `<div class="tm"><table><tr><th>Name</th><th>Status</th><th></th></tr>${rows || '<tr><td colspan=3 style="opacity:.6">No apps running</td></tr>'}</table></div>`;
  };
  body.onclick = e => { if (e.target.dataset.id) { OS.close(e.target.dataset.id); draw(); } };
  const t = setInterval(draw, 1000); win.onclose = () => clearInterval(t); draw();
}}

};

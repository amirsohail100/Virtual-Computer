/* ===== Apps for Windows 11 Web (educational prototype) =====
   Each app: { name, icon, w, h, single?, render(body, win, arg) }
   Naya app add karna ho to bas APPS me ek entry add karo. */

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
        'Downloads': {}, 'Pictures': {}, 'Music': {}
      } }
    }
  };
  let root;
  try { root = JSON.parse(localStorage.getItem('w11_fs')) || def; } catch (e) { root = def; }
  const save = () => { try { localStorage.setItem('w11_fs', JSON.stringify(root)); } catch (e) {} };
  const get = (path) => path.reduce((n, k) => (n && typeof n === 'object') ? n[k] : undefined, root);
  const set = (path, name, val) => { const d = get(path); if (d && typeof d === 'object') { d[name] = val; save(); } };
  return { root: () => root, get, set, save };
})();

const APPS = {

/* ---------- File Explorer ---------- */
explorer: { name: 'File Explorer', icon: '📁', w: 780, h: 470,
render(body, win, arg) {
  let path = arg && arg.path ? [...arg.path] : [...HOME, 'Documents'];
  const back = [];
  body.innerHTML = `<div class="ex"><div class="ex-bar"><button data-a="back" title="Back">←</button><button data-a="up" title="Up">↑</button><div class="ex-addr"></div></div>
  <div class="ex-main"><div class="ex-side"></div><div class="ex-list"></div></div><div class="ex-status"></div></div>`;
  const side = body.querySelector('.ex-side'), list = body.querySelector('.ex-list'),
        addr = body.querySelector('.ex-addr'), st = body.querySelector('.ex-status');
  const quick = [['🖥️', 'This PC', []], ['🖼️', 'Desktop', [...HOME, 'Desktop']], ['📄', 'Documents', [...HOME, 'Documents']],
                 ['⬇️', 'Downloads', [...HOME, 'Downloads']], ['🖼️', 'Pictures', [...HOME, 'Pictures']], ['🎵', 'Music', [...HOME, 'Music']]];
  side.innerHTML = quick.map((q, i) => `<div data-i="${i}">${q[0]} ${q[1]}</div>`).join('');
  side.onclick = e => { const d = e.target.closest('[data-i]'); if (d) go(quick[d.dataset.i][2]); };
  const iconFor = (n, v) => typeof v === 'object' ? (path.length === 0 ? '💽' : '📁') : /\.(png|jpg|jpeg|gif)$/i.test(n) ? '🖼️' : '📄';
  function go(p, noHist) { if (!noHist) back.push(path); path = p; draw(); }
  function draw() {
    const node = path.length ? FS.get(path) : FS.root();
    addr.textContent = path.length ? path.join(' › ') : 'This PC';
    win.setTitle(path.length ? path[path.length - 1] : 'This PC');
    const names = Object.keys(node || {});
    list.innerHTML = names.length ? names.map(n => `<div class="ex-item" data-n="${n}"><span class="em">${iconFor(n, node[n])}</span>${n}</div>`).join('') : '<div style="opacity:.6;padding:10px">This folder is empty.</div>';
    st.textContent = names.length + ' item(s)';
  }
  list.onclick = e => { list.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); const i = e.target.closest('.ex-item'); if (i) i.classList.add('sel'); };
  list.ondblclick = e => {
    const i = e.target.closest('.ex-item'); if (!i) return;
    const n = i.dataset.n, node = path.length ? FS.get(path) : FS.root();
    if (typeof node[n] === 'object') go([...path, n]);
    else OS.open('notepad', { name: n, path: [...path], content: node[n] });
  };
  body.querySelector('.ex-bar').onclick = e => {
    const a = e.target.dataset.a;
    if (a === 'back' && back.length) go(back.pop(), true);
    if (a === 'up' && path.length) go(path.slice(0, -1));
  };
  draw();
}},

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
    FS.set(path, name, ta.value); title(); st.textContent = 'Saved ✔';
  };
  ta.addEventListener('keyup', pos); ta.addEventListener('click', pos);
  ta.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } });
  body.querySelector('.np-bar').onclick = e => { const a = e.target.dataset.a; if (a === 'save') save(); if (a === 'new') { name = path = null; ta.value = ''; title(); } };
  title(); ta.focus();
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
settings: { name: 'Settings', icon: '⚙️', w: 760, h: 480, single: true,
render(body, win) {
  const tabs = ['Personalization', 'System', 'About'];
  let tab = 0;
  const walls = ['1', '2', '3', '4'], accents = ['#0067c0', '#e81123', '#107c10', '#8764b8', '#ff8c00'];
  const draw = () => {
    const s = OS.settings;
    let main = '';
    if (tab === 0) main = `<h2>Personalization</h2>
      <div class="card"><b>Theme</b><br><br><button class="btn ${!s.dark ? 'primary' : ''}" data-theme="0">☀️ Light</button> <button class="btn ${s.dark ? 'primary' : ''}" data-theme="1">🌙 Dark</button></div>
      <div class="card"><b>Background</b><br><br><div class="walls">${walls.map(w => `<div class="wall ${s.wall === w ? 'on' : ''}" data-wall="${w}" style="background:${getComputedStyle(document.documentElement).getPropertyValue('--w' + w) || ''}"></div>`).join('')}</div></div>
      <div class="card"><b>Accent colour</b><div class="swatches">${accents.map(c => `<div class="sw ${s.accent === c ? 'on' : ''}" data-acc="${c}" style="background:${c}"></div>`).join('')}</div></div>`;
    if (tab === 1) main = `<h2>System</h2><div class="card"><b>Display brightness</b><br><br><input type="range" min="30" max="100" value="${s.brightness}" id="sbr" style="width:100%"></div>
      <div class="card"><b>Reset</b><br><br><button class="btn" id="rst">Reset files &amp; settings</button></div>`;
    if (tab === 2) main = `<h2>About</h2><div class="card">Windows 11 Web — educational prototype<br>Version 0.1 (HTML + CSS + JavaScript)<br>Device name: WEB-PC<br>User: Student<br><br><small>Not affiliated with or endorsed by Microsoft.</small></div>`;
    body.innerHTML = `<div class="set"><div class="set-side">${tabs.map((t, i) => `<div class="${i === tab ? 'on' : ''}" data-t="${i}">${t}</div>`).join('')}</div><div class="set-main">${main}</div></div>`;
    body.querySelectorAll('.wall').forEach(el => el.style.background = WALL_CSS[el.dataset.wall]);
  };
  const WALL_CSS = {
    1: 'radial-gradient(ellipse at 30% 65%,#59b0ff 0,transparent 42%),linear-gradient(135deg,#0b1f5c,#1a6fe0 60%,#8ec5ff)',
    2: 'radial-gradient(circle at 70% 30%,#f093fb 0,transparent 45%),linear-gradient(135deg,#2b1055,#7597de)',
    3: 'radial-gradient(circle at 25% 70%,#5fd38d 0,transparent 45%),linear-gradient(135deg,#0f2027,#2c7744)',
    4: 'radial-gradient(circle at 60% 35%,#ffd194 0,transparent 40%),linear-gradient(135deg,#ff7e5f,#6a3093)' };
  body.onclick = e => {
    const d = e.target.dataset;
    if (d.t) tab = +d.t;
    if (d.theme) OS.set({ dark: d.theme === '1' });
    if (d.wall) OS.set({ wall: d.wall });
    if (d.acc) OS.set({ accent: d.acc });
    if (e.target.id === 'rst' && confirm('Sab reset karna hai?')) { localStorage.clear(); location.reload(); }
    if (Object.keys(d).length) draw();
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

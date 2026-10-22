/* ===== Windows XP (Virtual) — helpers, file system and apps =====
   App: { name, icon, w, h, fixed?, single?, prog?, render(body, win, arg) }
   win: { setTitle(t), close(), el, body, api:{ arg(a), sync(), close() } } */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WALLS = [{ id: 'bliss', name: 'Bliss', img: 'assets/bliss.svg' }, { id: 'azul', name: 'Azul', img: 'assets/azul.svg' }, { id: 'autumn', name: 'Autumn', img: 'assets/autumn.svg' }, { id: 'followme', name: 'Follow', img: 'assets/followme.svg' }];
const LOC = { docs: 'My Documents', pics: 'My Pictures', music: 'My Music', desktop: 'Desktop', bin: 'Recycle Bin' };
const isImg = f => /^image/.test(f.type) || /\.(png|jpe?g|gif|bmp|webp|svg|avif)$/i.test(f.name);
const isMedia = f => /^(audio|video)/.test(f.type) || /\.(mp3|wav|ogg|m4a|aac|flac|mp4|webm|mkv|mov)$/i.test(f.name);
const isText = f => /^text|json/.test(f.type) || /\.(txt|md|json|csv|log|js|css|html?|xml|ini|bat)$/i.test(f.name);
const fsize = n => n < 1024 ? n + ' bytes' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const fileIcon = f => isImg(f) ? '🖼️' : isMedia(f) ? (/^video|\.(mp4|webm|mkv|mov)$/i.test(f.type + f.name) ? '🎞️' : '🎵') : isText(f) ? '📄' : /pdf/.test(f.type) ? '📕' : /zip|rar|7z/.test(f.type + f.name) ? '🗜️' : '📎';
const pickFiles = (accept, cb) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (accept) i.accept = accept; i.onchange = () => { if (i.files.length) cb(i.files); }; i.click(); };
const download = f => { const u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 6e4); };

/* ---------- file system in the browser (IndexedDB) ---------- */
const FS = (() => {
  let db; const open = () => db || (db = new Promise((res, rej) => { const r = indexedDB.open('xp_fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('f', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (m, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('f', m), r = fn(t.objectStore('f')); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => rej(t.error); }); };
  const self = {
    list: async f => ((await tx('readonly', s => s.getAll()).catch(() => [])) || []).filter(x => x.folder === f).sort((a, b) => a.name.localeCompare(b.name)),
    get: id => tx('readonly', s => s.get(id)), put: r => tx('readwrite', s => s.put(r)), del: id => tx('readwrite', s => s.delete(id)),
    /* save a file (used by Notepad, Paint …) */
    async save(name, type, blob, folder, id) { const r = { id: id || 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name, type, size: blob.size, folder, added: Date.now(), blob }; await self.put(r); OS.sync(); return r; },
    /* upload: images -> My Pictures, audio/video -> My Music, the rest -> My Documents (or the folder given) */
    async import(files, folder) {
      const cnt = {}, ids = [];
      try { for (const f of [...files]) { const meta = { name: f.name, type: f.type }, fo = folder || (isImg(meta) ? 'pics' : isMedia(meta) ? 'music' : 'docs'); const r = await self.save(f.name, f.type, f, fo); cnt[fo] = (cnt[fo] || 0) + 1; ids.push(r.id); } }
      catch (e) { OS.balloon('Copy failed', 'The browser storage is full or blocked.'); }
      const t = Object.entries(cnt).map(([k, n]) => `${n} file${n > 1 ? 's' : ''} → ${LOC[k]}`).join(', '); if (t) OS.balloon('Files copied', t); return ids;
    }
  };
  return self;
})();
function openFile(f) {
  if (/\.wpd$/i.test(f.name)) OS.open('wordpad', f.id); else if (isImg(f)) OS.open('viewer', f.id); else if (isText(f)) OS.open('notepad', f.id); else if (isMedia(f)) OS.open('wmp', f.id);
  else if (/pdf/.test(f.type)) { const u = URL.createObjectURL(f.blob); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 6e4); } else download(f);
}
/* menu bar: spec = { File: [['New', fn], '-', ['Exit', fn]], ... } */
const mbar = spec => {
  const m = document.createElement('div'); m.className = 'mbar'; m.innerHTML = Object.keys(spec).map(k => `<span data-m="${k}">${k}</span>`).join('');
  m.onclick = e => { const s = e.target.closest('[data-m]'), o = $('.mdd', m); o && o.remove(); if (!s) return; const items = spec[s.dataset.m], r = document.createElement('div'); r.className = 'mdd'; r.style.left = s.offsetLeft + 'px';
    r.innerHTML = items.map((x, i) => x === '-' ? '<hr>' : `<div data-i="${i}">${x[0]}</div>`).join(''); m.appendChild(r);
    r.onclick = ev => { const it = ev.target.closest('[data-i]'); if (it) { r.remove(); const f = items[it.dataset.i][1]; f && f(); } };
    const off = ev => { if (!m.contains(ev.target)) { r.remove(); removeEventListener('pointerdown', off, true); } }; addEventListener('pointerdown', off, true); };
  return m;
};

const APPS = {
  explorer: { name: 'My Computer', icon: '🖥️', w: 720, h: 480, prog: 1,
    render(b, w, arg) {
      let loc = (arg && arg.loc) || 'root', sel = null, hist = [], urls = {}, items = [];
      const nm = l => l === 'root' ? 'My Computer' : LOC[l] || 'Local Disk (C:)', U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const upload = () => pickFiles('', fs => FS.import(fs, loc === 'root' || loc === 'bin' || loc === 'c' ? undefined : loc));
      const go = l => { hist.push(loc); loc = l; sel = null; draw(); };
      b.innerHTML = '<div class="ex" tabindex="0"></div>'; const ex = $('.ex', b);
      ex.appendChild(mbar({ File: [['Upload files…', upload], '-', ['Close', () => w.close()]], Go: [['Back', () => hist.length && (loc = hist.pop(), draw())], ['My Computer', () => go('root')]], Help: [['About', () => OS.dialog({ title: 'About', html: 'Windows Explorer (virtual)' })]] }));
      ex.insertAdjacentHTML('beforeend', '<div class="ext"><button class="xb" data-a="back">◀ Back</button><button class="xb" data-a="up">⤴ Up</button><button class="xb" data-a="up2">⬆ Upload</button></div><div class="exa">Address <div class="addr"></div></div><div class="exb"><div class="xl"></div><div class="xr"></div></div>');
      const draw = async () => {
        w.setTitle(nm(loc)); $('.addr', ex).textContent = loc === 'root' ? 'My Computer' : loc === 'c' ? 'C:\\' : 'C:\\Documents and Settings\\Student\\' + LOC[loc]; let h = '';
        if (loc === 'root') { items = [...['docs', 'pics', 'music', 'desktop', 'bin'].map(k => ({ k: 'folder', loc: k, name: LOC[k], icon: k === 'bin' ? '🗑️' : k === 'pics' ? '🖼️' : k === 'music' ? '🎵' : '📁' })), { k: 'folder', loc: 'c', name: 'Local Disk (C:)', icon: '💽' }];
          h = '<h5>Files Stored on This Computer</h5>' + items.slice(0, 4).map((x, i) => it(x, i)).join('') + '<h5>Others</h5>' + items.slice(4).map((x, i) => it(x, i + 4)).join(''); }
        else if (loc === 'c') { items = ['Documents and Settings', 'Program Files', 'WINDOWS'].map(n => ({ k: 'static', name: n, icon: '📁' })); h = items.map((x, i) => it(x, i)).join(''); }
        else { const l = await FS.list(loc); items = l.map(f => ({ k: 'file', f, name: f.name, icon: fileIcon(f) })); h = items.map((x, i) => it(x, i)).join('') || '<div style="color:#888;padding:20px">This folder is empty. Use Upload or drag & drop files here.</div>'; }
        $('.xr', ex).innerHTML = h; side();
      };
      const it = (x, i) => `<div class="it${sel === i ? ' sel' : ''}" data-i="${i}">${x.k === 'file' && isImg(x.f) ? `<i><img src="${U(x.f)}" alt=""></i>` : `<i>${x.icon}</i>`}<span>${escH(x.name)}</span></div>`;
      const side = () => { const s = items[sel], tasks = loc === 'root' || loc === 'c' ? '' : `<div class="pn"><h4>File and Folder Tasks</h4><div>${loc === 'bin' ? '<a data-a="empty">🗑 Empty the Recycle Bin</a>' + (s ? '<a data-a="restore">↩ Restore this item</a>' : '') : '<a data-a="up2">⬆ Upload files here</a><a data-a="newtxt">📝 New text document</a>'}${s && s.k === 'file' ? `<a data-a="del">❌ ${loc === 'bin' ? 'Delete permanently' : 'Delete this file'}</a><a data-a="dl">💾 Download to your PC</a>` : ''}</div></div>`;
        $('.xl', ex).innerHTML = tasks + `<div class="pn"><h4>Other Places</h4><div>${[['root', 'My Computer'], ['docs', 'My Documents'], ['pics', 'My Pictures'], ['music', 'My Music'], ['desktop', 'Desktop']].map(p => `<a data-go="${p[0]}">▸ ${p[1]}</a>`).join('')}</div></div><div class="pn"><h4>Details</h4><div><b>${escH(s ? s.name : nm(loc))}</b><small>${s && s.k === 'file' ? `${fsize(s.f.size)}<br>${new Date(s.f.added).toLocaleString()}` : s ? 'File Folder' : `${items.length} object(s)`}</small></div></div>`; };
      const act = async a => { const s = items[sel], f = s && s.f;
        if (a === 'back') hist.length && (loc = hist.pop(), sel = null, draw()); else if (a === 'up') loc !== 'root' && go('root'); else if (a === 'up2') upload();
        else if (a === 'newtxt') { await FS.save('New Text Document.txt', 'text/plain', new Blob(['']), loc); } else if (a === 'dl' && f) download(f);
        else if (a === 'del' && f) { if (loc === 'bin') await FS.del(f.id); else await FS.put({ ...f, from: f.folder, folder: 'bin' }); sel = null; OS.sync(); }
        else if (a === 'restore' && f) { await FS.put({ ...f, folder: f.from || 'docs' }); sel = null; OS.sync(); }
        else if (a === 'empty') { for (const x of items) await FS.del(x.f.id); sel = null; OS.sync(); } };
      const openIt = x => { if (x.k === 'folder') go(x.loc); else if (x.k === 'file') openFile(x.f); };
      ex.onclick = e => { const a = e.target.closest('[data-a]'), g = e.target.closest('[data-go]'), i = e.target.closest('[data-i]'); if (a) act(a.dataset.a); else if (g) go(g.dataset.go); else if (i) { sel = +i.dataset.i; $$('.it', ex).forEach(n => n.classList.toggle('sel', n === i)); side(); } else if (e.target.closest('.xr')) { sel = null; $$('.it', ex).forEach(n => n.classList.remove('sel')); side(); } };
      ex.ondblclick = e => { const i = e.target.closest('[data-i]'); if (i) openIt(items[+i.dataset.i]); };
      ex.oncontextmenu = e => { const i = e.target.closest('[data-i]'); if (!i) return; e.preventDefault(); e.stopPropagation(); sel = +i.dataset.i; const x = items[sel]; draw(); OS.menu(e.clientX, e.clientY, [['Open', () => openIt(x)], ...(x.k === 'file' ? [loc === 'bin' ? ['Restore', () => act('restore')] : null, ['Download', () => act('dl')], '-', ['Delete', () => act('del')]].filter(Boolean) : [])]); };
      ex.onkeydown = e => { if (e.key === 'Delete' && items[sel] && items[sel].k === 'file') act('del'); };
      b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); e.stopPropagation(); FS.import(e.dataTransfer.files, loc === 'root' || loc === 'bin' || loc === 'c' ? undefined : loc); };
      w.api.sync = draw; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } },
  notepad: { name: 'Untitled - Notepad', icon: '📝', w: 560, h: 400, prog: 1,
    render(b, w, arg) {
      let id = null, name = 'Untitled', folder = 'docs'; b.style.display = 'flex'; b.style.flexDirection = 'column';
      const ta = document.createElement('textarea'); ta.className = 'npt'; ta.spellcheck = false; const title = () => w.setTitle(name + ' - Notepad');
      const load = async fid => { const f = await FS.get(fid); if (f) { ta.value = await f.blob.text(); id = f.id; name = f.name; folder = f.folder; title(); } };
      const save = async () => { if (!id && name === 'Untitled') return saveAs(); const r = await FS.save(name, 'text/plain', new Blob([ta.value], { type: 'text/plain' }), folder, id); id = r.id; OS.balloon('Notepad', `Saved to ${LOC[folder]}`); };
      const saveAs = () => OS.dialog({ title: 'Save As', html: 'File name:<br><input id="fn" style="width:240px" value="' + escH(name === 'Untitled' ? 'Untitled.txt' : name) + '">', buttons: [['Save', m => { let n = $('#fn', m).value.trim() || 'Untitled.txt'; if (!/\.\w+$/.test(n)) n += '.txt'; name = n; id = null; title(); save(); }], ['Cancel']] });
      b.appendChild(mbar({ File: [['New', () => { ta.value = ''; id = null; name = 'Untitled'; title(); }], ['Open…', () => pickFiles('.txt,.md,.json,.csv,.log,text/*', async fs => { const f = fs[0]; ta.value = await f.text(); name = f.name; id = null; title(); })], ['Save', save], ['Save As…', saveAs], '-', ['Exit', () => w.close()]],
        Edit: [['Select All', () => ta.select()], ['Time/Date', () => { ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end'); }]], Format: [['Word Wrap', () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre' ? '' : 'pre'; ta.wrap = ta.style.whiteSpace === 'pre' ? 'off' : 'soft'; }]], Help: [['About Notepad', () => OS.dialog({ title: 'About Notepad', html: 'Notepad — Windows XP (virtual)' })]] }));
      b.appendChild(ta); ta.style.flex = '1'; arg ? load(arg) : title(); w.api.arg = load;
    } },
  calc: { name: 'Calculator', icon: '🧮', w: 260, h: 330, fixed: 1, prog: 1,
    render(b) {
      let cur = '0', acc = null, op = null, fresh = true, mem = 0; b.innerHTML = '<div class="calc"><div class="cdisp">0</div><div class="cg"></div></div>'; const d = $('.cdisp', b);
      const K = ['MC', 'MR', 'MS', 'M+', 'C', '7', '8', '9', '/', 'sqrt', '4', '5', '6', '*', '%', '1', '2', '3', '-', '1/x', '0', '±', '.', '+', '='];
      $('.cg', b).innerHTML = K.map(k => `<button class="${/^(M.|C)$/.test(k) ? 'r' : /[\/*\-+=]/.test(k) && k.length === 1 ? 'bl' : ''}">${k}</button>`).join('');
      const show = () => d.textContent = cur.slice(0, 16), calc = (a, o, c) => o === '+' ? a + c : o === '-' ? a - c : o === '*' ? a * c : o === '/' ? (c === 0 ? NaN : a / c) : c;
      $('.cg', b).onclick = e => { const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return; const n = parseFloat(cur);
        if (/^\d$/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; } else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
        else if (k === 'C') { cur = '0'; acc = op = null; fresh = true; } else if (k === '±') cur = String(-n); else if (k === 'sqrt') cur = String(Math.sqrt(n)); else if (k === '1/x') cur = n ? String(1 / n) : 'Cannot divide by zero'; else if (k === '%') cur = String(acc !== null ? acc * n / 100 : 0);
        else if (k === 'MC') mem = 0; else if (k === 'MR') { cur = String(mem); fresh = true; } else if (k === 'MS') mem = n; else if (k === 'M+') mem += n;
        else { if (op && !fresh) { acc = calc(acc, op, n); cur = String(+acc.toFixed(10)); } else acc = n; op = k === '=' ? null : k; fresh = true; } show(); };
    } },
  mine: { name: 'Minesweeper', icon: '💣', w: 230, h: 320, fixed: 1, prog: 1,
    render(b, w) {
      let R = 9, C = 9, M = 10, g, over, started, flags, t0, tm; b.style.background = '#c0c0c0';
      const nb = (r, c) => { const o = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) if ((i || j) && g[r + i] && g[r + i][c + j]) o.push([r + i, c + j]); return o; };
      const newGame = (r = R, c = C, m = M) => { R = r; C = c; M = m; g = Array.from({ length: R }, () => Array.from({ length: C }, () => ({ m: 0, o: 0, f: 0, n: 0 }))); over = started = 0; flags = 0; clearInterval(tm); w.el.style.width = C * 22 + 44 + 'px'; w.el.style.height = R * 22 + 150 + 'px'; draw('🙂'); };
      const draw = face => { const t = started && !over ? Math.min(999, (Date.now() - t0) / 1e3 | 0) : $('.tm', b) ? $('.tm', b).textContent : 0;
        b.innerHTML = `<div class="mine"><div class="mh"><span class="led">${String(M - flags).padStart(3, '0')}</span><button data-r>${face || '🙂'}</button><span class="led tm">${String(t).padStart(3, '0')}</span></div><div class="mg" style="grid-template-columns:repeat(${C},22px)">${g.map((row, r) => row.map((x, c) => `<button class="mc${x.o ? ' o' : ''}" data-r="${r}" data-c="${c}">${x.o ? (x.m ? '💣' : x.n || '') : x.f ? '🚩' : ''}</button>`).join('')).join('')}</div></div>`; };
      const rev = (r, c) => { const x = g[r][c]; if (x.o || x.f) return; x.o = 1; if (x.m) return; if (!x.n) nb(r, c).forEach(p => rev(...p)); };
      b.onclick = e => { const k = e.target.closest('button'); if (!k) return; if (k.dataset.r !== undefined && k.dataset.c === undefined) return newGame(); if (over) return; const r = +k.dataset.r, c = +k.dataset.c;
        if (!started) { started = 1; t0 = Date.now(); let n = 0; while (n < M) { const a = Math.random() * R | 0, d = Math.random() * C | 0; if (!g[a][d].m && !(Math.abs(a - r) < 2 && Math.abs(d - c) < 2)) { g[a][d].m = 1; n++; } } g.forEach((row, i) => row.forEach((x, j) => x.n = nb(i, j).filter(([p, q]) => g[p][q].m).length)); tm = setInterval(() => { const l = $('.tm', b); l ? l.textContent = String(Math.min(999, (Date.now() - t0) / 1e3 | 0)).padStart(3, '0') : clearInterval(tm); }, 500); }
        const x = g[r][c]; if (x.f) return; rev(r, c); if (x.m) { over = 1; g.forEach(row => row.forEach(y => { if (y.m) y.o = 1; })); clearInterval(tm); draw('😵'); }
        else if (g.every(row => row.every(y => y.m || y.o))) { over = 1; clearInterval(tm); draw('😎'); } else draw(); };
      b.oncontextmenu = e => { e.preventDefault(); const k = e.target.closest('.mc'); if (!k || over) return; const x = g[+k.dataset.r][+k.dataset.c]; if (!x.o) { x.f = !x.f; flags += x.f ? 1 : -1; draw(); } };
      w.api.close = () => clearInterval(tm); newGame();
    } },
  cmd: { name: 'Command Prompt', icon: '⌨️', w: 640, h: 380, prog: 1,
    render(b, w) {
      let cwd = 'docs', hist = [], hi = 0; const dirs = { docs: 'My Documents', pics: 'My Pictures', music: 'My Music', desktop: 'Desktop' };
      b.innerHTML = '<div class="cmd">Microsoft Windows XP [Version 5.1.2600]\n(C) Copyright 1985-2001 Microsoft Corp.\n\n<span id="o"></span><span id="pr"></span><input id="in" autocomplete="off"></div>';
      const box = $('.cmd', b), o = $('#o', b), inp = $('#in', b), pr = () => `C:\\Documents and Settings\\Student${cwd === 'root' ? '' : '\\' + dirs[cwd]}>`, say = t => { o.append(document.createTextNode(t)); box.scrollTop = 1e9; };
      const upd = () => { $('#pr', b).textContent = pr(); }; upd();
      const run = async line => { const [c, ...a] = line.trim().split(/\s+/), arg = a.join(' '); switch ((c || '').toLowerCase()) {
        case '': break; case 'help': say('DIR  CD  TYPE  CLS  ECHO  DATE  TIME  VER  WHOAMI  HOSTNAME  IPCONFIG  START  EXIT\n'); break;
        case 'ver': say('Microsoft Windows XP [Version 5.1.2600]\n'); break; case 'cls': o.textContent = ''; break; case 'echo': say(arg + '\n'); break;
        case 'date': say('The current date is: ' + new Date().toDateString() + '\n'); break; case 'time': say('The current time is: ' + new Date().toLocaleTimeString() + '\n'); break;
        case 'whoami': say('xp-pc\\student\n'); break; case 'hostname': say('XP-PC\n'); break; case 'ipconfig': say('Windows IP Configuration\n\nEthernet adapter Local Area Connection:\n   IP Address. . . . : 192.168.0.101\n   Subnet Mask . . . : 255.255.255.0\n'); break;
        case 'dir': { const l = cwd === 'root' ? [] : await FS.list(cwd); say(` Directory of C:\\Documents and Settings\\Student\\${dirs[cwd] || ''}\n\n` + (l.map(f => `${new Date(f.added).toLocaleDateString()}  ${String(f.size).padStart(12)} ${f.name}`).join('\n') || 'File Not Found') + `\n               ${l.length} File(s)\n`); break; }
        case 'cd': { const k = Object.keys(dirs).find(x => dirs[x].toLowerCase().replace(/ /g, '') === arg.toLowerCase().replace(/ /g, '')); if (arg === '..' || arg === '\\') cwd = 'root'; else if (k) cwd = k; else if (arg) say('The system cannot find the path specified.\n'); upd(); break; }
        case 'type': { const f = (await FS.list(cwd)).find(x => x.name.toLowerCase() === arg.toLowerCase()); say(f ? (await f.blob.text()) + '\n' : 'The system cannot find the file specified.\n'); break; }
        case 'start': { const m = { notepad: 'notepad', calc: 'calc', winmine: 'mine', iexplore: 'ie', explorer: 'explorer', control: 'control' }[arg.toLowerCase()]; m ? OS.open(m) : say('The system cannot find the file ' + arg + '.\n'); break; }
        case 'exit': w.close(); break; default: say(`'${c}' is not recognized as an internal or external command,\noperable program or batch file.\n`); } say('\n'); };
      inp.onkeydown = async e => { if (e.key === 'Enter') { const v = inp.value; say(pr() + v + '\n'); hist.push(v); hi = hist.length; inp.value = ''; await run(v); } else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; } };
      box.onclick = () => { if (!getSelection().toString()) inp.focus(); }; setTimeout(() => inp.focus(), 50);
    } },
  ie: { name: 'Internet Explorer', icon: '🌐', w: 800, h: 520, prog: 1,
    render(b, w, arg) {
      const home = '<body style="font:14px Tahoma;text-align:center;padding-top:60px;background:linear-gradient(#fff,#dfeaff)"><h1 style="color:#215dc6;font-size:40px">MSN<small style="font-size:16px"> (virtual)</small></h1><p>Type an address above and press Go.</p><p style="color:#666;font-size:12px">Many sites refuse to load inside frames — use the ↗ button to open them in a real tab.</p><p><a href="https://en.wikipedia.org" target="_self">Wikipedia</a> · <a href="https://www.openstreetmap.org" target="_self">OpenStreetMap</a></p></body>';
      b.innerHTML = '<div class="ie"><div class="iea"><button class="xb" data-a="back">◀</button><button class="xb" data-a="fw">▶</button><button class="xb" data-a="rl">⟳</button><button class="xb" data-a="home">🏠</button>Address<input id="u" placeholder="http://"><button class="xb" data-a="go">Go</button><button class="xb" data-a="ext" title="Open in a real browser tab">↗</button></div><iframe></iframe></div>';
      const f = $('iframe', b), u = $('#u', b); let H = [], i = -1;
      const nav = (v, push = true) => { v = (v || '').trim(); if (!v) return; if (!/^(https?:|about:)/.test(v)) v = /^[\w-]+(\.[\w-]+)+/.test(v) && !v.includes(' ') ? 'https://' + v : 'https://duckduckgo.com/?q=' + encodeURIComponent(v); if (push) { H = H.slice(0, i + 1); H.push(v); i++; } u.value = v; w.setTitle('Internet Explorer'); if (v === 'about:home') { f.removeAttribute('src'); f.srcdoc = home; } else { f.removeAttribute('srcdoc'); f.src = v; } };
      b.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'go') nav(u.value); else if (k === 'home') nav('about:home'); else if (k === 'rl') nav(H[i], false); else if (k === 'back' && i > 0) nav(H[--i], false); else if (k === 'fw' && i < H.length - 1) nav(H[++i], false); else if (k === 'ext') window.open(u.value.startsWith('about:') ? 'https://www.google.com' : u.value, '_blank'); };
      u.onkeydown = e => { if (e.key === 'Enter') nav(u.value); }; nav(arg || 'about:home');
    } },
  viewer: { name: 'Windows Picture and Fax Viewer', icon: '🖼️', w: 640, h: 480,
    render(b, w, arg) {
      let url = null, rec = null; b.style.display = 'flex'; b.style.flexDirection = 'column';
      b.appendChild(mbar({ File: [['Edit with Paint', () => rec && OS.open('paint', rec.id)], ['Set as Desktop Background', () => rec && OS.set({ wall: 'u:' + rec.id, pos: 'stretch' })], ['Download', () => rec && download(rec)], '-', ['Close', () => w.close()]] })); const v = document.createElement('div'); v.className = 'vw'; v.style.flex = '1'; b.appendChild(v);
      const load = async id => { rec = await FS.get(id); if (!rec) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(rec.blob); v.innerHTML = `<img src="${url}" alt="">`; w.setTitle(rec.name + ' - Picture Viewer'); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  wmp: { name: 'Windows Media Player', icon: '▶️', w: 520, h: 360,
    render(b, w, arg) {
      let url = null; b.style.background = '#0a1a4a'; const load = async id => { const r = await FS.get(id); if (!r) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(r.blob); const vid = /^video|\.(mp4|webm|mkv|mov)$/i.test(r.type + r.name);
        b.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#cfe0ff">${vid ? `<video src="${url}" controls autoplay style="max-width:100%;max-height:80%"></video>` : `<div style="font-size:70px">🎵</div><audio src="${url}" controls autoplay style="width:80%"></audio>`}<b>${escH(r.name)}</b></div>`; w.setTitle(r.name + ' - Windows Media Player'); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  display: { name: 'Display Properties', icon: '🖥️', w: 400, h: 500, fixed: 1, single: 1,
    render(b, w) {
      let tab = 'desk', S = OS.settings, pick = S.wall, pos = S.pos, th = S.theme, urls = {};
      const prev = async () => { const m = $('.mon>div', b); if (!m) return; let u = ''; if (pick.startsWith('u:')) { const f = await FS.get(pick.slice(2)); if (f) u = urls[pick] = urls[pick] || URL.createObjectURL(f.blob); } else { const x = WALLS.find(q => q.id === pick); u = x ? x.img : ''; } m.style.backgroundImage = u ? `url("${u}")` : 'none'; };
      const draw = async () => { const pics = (await FS.list('pics')).filter(isImg), items = [{ id: 'none', name: '(None)' }, ...WALLS, ...pics.map(f => ({ id: 'u:' + f.id, name: f.name }))];
        b.innerHTML = `<div class="tabs"><span data-t="desk" class="${tab === 'desk' ? 'on' : ''}">Desktop</span><span data-t="app" class="${tab === 'app' ? 'on' : ''}">Appearance</span></div><div class="tpg">` + (tab === 'desk' ? `<div class="mon"><div></div></div><b>Background:</b><div class="lst">${items.map(i => `<div class="li${pick === i.id ? ' on' : ''}" data-p="${escH(i.id)}">${escH(i.name)}</div>`).join('')}</div><button class="xb" data-br>Browse…</button> &nbsp; Position: <select id="pos">${['center', 'tile', 'stretch'].map(p => `<option value="${p}"${pos === p ? ' selected' : ''}>${p[0].toUpperCase() + p.slice(1)}</option>`).join('')}</select>` : `<b>Windows and buttons:</b><br><br>Windows XP style<br><br><b>Color scheme:</b><br><select id="th">${[['blue', 'Default (blue)'], ['olive', 'Olive Green'], ['silver', 'Silver']].map(p => `<option value="${p[0]}"${th === p[0] ? ' selected' : ''}>${p[1]}</option>`).join('')}</select>`) + `</div><div class="dfoot"><button class="xb" data-ok>OK</button><button class="xb" data-x>Cancel</button><button class="xb" data-ap>Apply</button></div>`; prev(); };
      b.onclick = async e => { const t = e.target.closest('[data-t]'), p = e.target.closest('[data-p]'); if (t) { tab = t.dataset.t; draw(); } else if (p) { pick = p.dataset.p; draw(); }
        else if (e.target.closest('[data-br]')) pickFiles('image/*', async fs => { const ids = await FS.import(fs); if (ids[0]) { pick = 'u:' + ids[0]; draw(); } });
        else if (e.target.closest('[data-ok]')) { OS.set({ wall: pick, pos, theme: th }); w.close(); } else if (e.target.closest('[data-ap]')) OS.set({ wall: pick, pos, theme: th }); else if (e.target.closest('[data-x]')) w.close(); };
      b.onchange = e => { if (e.target.id === 'pos') pos = e.target.value; if (e.target.id === 'th') th = e.target.value; }; w.api.sync = () => { if (!$('select:focus', b)) draw(); }; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } },
  control: { name: 'Control Panel', icon: '⚙️', w: 520, h: 360, single: 1, prog: 1,
    render(b) { b.innerHTML = '<div class="cp">' + [['display', '🖥️', 'Display'], ['system', '💻', 'System'], ['datetime', '🕒', 'Date and Time'], ['explorer', '📁', 'Folder Options']].map(x => `<div class="cpi" data-o="${x[0]}"><i>${x[1]}</i>${x[2]}</div>`).join('') + '</div>'; b.onclick = e => { const o = e.target.closest('[data-o]'); if (o) OS.open(o.dataset.o); }; } },
  system: { name: 'System Properties', icon: '💻', w: 380, h: 330, fixed: 1, single: 1,
    render(b) { b.innerHTML = `<div class="sysx"><b>System:</b><br>Microsoft Windows XP<br>Professional<br>Version 2002 Service Pack 3 (virtual)<br><br><b>Registered to:</b><br>Student<br><br><b>Computer:</b><br>Virtual browser PC<br>${navigator.deviceMemory ? navigator.deviceMemory + ' GB RAM' : 'RAM: n/a'} · ${navigator.hardwareConcurrency || 1} CPU thread(s)</div>`; } },
  datetime: { name: 'Date and Time Properties', icon: '🕒', w: 300, h: 300, fixed: 1, single: 1,
    render(b, w) { const iv = setInterval(() => { const t = $('#dt', b); t ? t.textContent = new Date().toLocaleTimeString() : clearInterval(iv); }, 1000), d = new Date(), f = new Date(d.getFullYear(), d.getMonth(), 1).getDay(), n = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); let h = 'SMTWTFS'.split('').map(c => `<b>${c}</b>`).join('') + '<i></i>'.repeat(f);
      for (let i = 1; i <= n; i++) h += `<span class="${i === d.getDate() ? 't' : ''}">${i}</span>`; b.innerHTML = `<div style="padding:14px;background:#fff;height:100%"><b>${MONTHS[d.getMonth()]} ${d.getFullYear()}</b><div class="cal" style="margin:8px 0">${h}</div><div id="dt" style="font-size:20px;text-align:center">${d.toLocaleTimeString()}</div></div>`; w.api.close = () => clearInterval(iv); } }
};


/* ---------- more apps: Paint, Solitaire, Task Manager, WordPad, Sound Recorder ---------- */
const saveAsDlg = (name, cb) => OS.dialog({ title: 'Save As', html: 'File name:<br><input id="fn" style="width:240px" value="' + escH(name) + '">', buttons: [['Save', m => cb($('#fn', m).value.trim() || name)], ['Cancel']] });
Object.assign(APPS, {
  paint: { name: 'untitled - Paint', icon: '🎨', w: 760, h: 540, prog: 1,
    render(b, w, arg) {
      let tool = 'pencil', fg = '#000000', bg = '#ffffff', size = 2, id = null, name = 'untitled.png', hist = [], on = false, sx, sy, snap, col;
      const PAL = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#4000ff', '#804000', '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
      const TOOLS = [['pencil', '✏️'], ['brush', '🖌️'], ['eraser', '🧽'], ['fill', '🪣'], ['pick', '💧'], ['line', '╱'], ['rect', '▭'], ['oval', '◯']];
      b.style.display = 'flex'; b.style.flexDirection = 'column'; const title = () => w.setTitle(name + ' - Paint');
      const body = document.createElement('div'); body.className = 'pt';
      body.innerHTML = `<div class="tb">${TOOLS.map(t => `<button data-t="${t[0]}" title="${t[0]}">${t[1]}</button>`).join('')}</div><div class="cv"><canvas width="640" height="400"></canvas></div>`;
      const pal = document.createElement('div'); pal.className = 'pal'; pal.innerHTML = `<div class="cur"><i id="cb" style="background:${bg}"></i><i id="cf" style="background:${fg}"></i></div><div class="sw">${PAL.map(c => `<i data-c="${c}" style="background:${c}"></i>`).join('')}</div>Size <select id="sz"><option>1</option><option selected>2</option><option>4</option><option>8</option></select>`;
      const cv = $('canvas', body), x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 400);
      const rgb = h => { const s = h.length === 4 ? h.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : h; return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); };
      const push = () => { hist.push(x.getImageData(0, 0, cv.width, cv.height)); if (hist.length > 25) hist.shift(); };
      const undo = () => { const h = hist.pop(); if (h) x.putImageData(h, 0, 0); }, clear = () => { push(); x.fillStyle = bg; x.fillRect(0, 0, cv.width, cv.height); };
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width | 0, (e.clientY - r.top) * cv.height / r.height | 0]; };
      const flood = (px, py, c) => { const W = cv.width, H = cv.height, im = x.getImageData(0, 0, W, H), d = im.data, i0 = (py * W + px) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2]], n = rgb(c); if (t[0] === n[0] && t[1] === n[1] && t[2] === n[2]) return; const st = [[px, py]];
        while (st.length) { const [p, q] = st.pop(); if (p < 0 || q < 0 || p >= W || q >= H) continue; const i = (q * W + p) * 4; if (d[i] !== t[0] || d[i + 1] !== t[1] || d[i + 2] !== t[2]) continue; d[i] = n[0]; d[i + 1] = n[1]; d[i + 2] = n[2]; d[i + 3] = 255; st.push([p + 1, q], [p - 1, q], [p, q + 1], [p, q - 1]); } x.putImageData(im, 0, 0); };
      cv.oncontextmenu = e => e.preventDefault();
      cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); const [px, py] = pos(e); col = e.button === 2 ? bg : fg;
        if (tool === 'fill') { push(); return flood(px, py, col); }
        if (tool === 'pick') { const d = x.getImageData(px, py, 1, 1).data, h = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''); if (e.button === 2) bg = h; else fg = h; return cols(); }
        push(); on = true; sx = px; sy = py; snap = x.getImageData(0, 0, cv.width, cv.height); x.lineCap = x.lineJoin = 'round'; x.strokeStyle = tool === 'eraser' ? bg : col; x.lineWidth = tool === 'eraser' ? size * 4 : tool === 'brush' ? size * 3 : size;
        if (/pencil|brush|eraser/.test(tool)) { x.beginPath(); x.moveTo(px, py); x.lineTo(px, py); x.stroke(); x.beginPath(); x.moveTo(px, py); } };
      cv.onpointermove = e => { if (!on) return; const [px, py] = pos(e);
        if (/pencil|brush|eraser/.test(tool)) { x.lineTo(px, py); x.stroke(); x.beginPath(); x.moveTo(px, py); return; }
        x.putImageData(snap, 0, 0); x.beginPath(); if (tool === 'line') { x.moveTo(sx, sy); x.lineTo(px, py); } else if (tool === 'rect') x.rect(sx, sy, px - sx, py - sy); else x.ellipse((sx + px) / 2, (sy + py) / 2, Math.abs(px - sx) / 2, Math.abs(py - sy) / 2, 0, 0, 7); x.stroke(); };
      cv.onpointerup = () => { on = false; };
      const cols = () => { $('#cb', pal).style.background = bg; $('#cf', pal).style.background = fg; };
      pal.onclick = e => { const c = e.target.closest('[data-c]'); if (c) { fg = c.dataset.c; cols(); } }; pal.oncontextmenu = e => { e.preventDefault(); const c = e.target.closest('[data-c]'); if (c) { bg = c.dataset.c; cols(); } }; pal.onchange = e => { if (e.target.id === 'sz') size = +e.target.value; };
      body.onclick = e => { const t = e.target.closest('[data-t]'); if (t) { tool = t.dataset.t; $$('.tb button', body).forEach(n => n.classList.toggle('on', n === t)); } }; $('.tb button', body).classList.add('on');
      const load = blob => { const im = new Image(), u = URL.createObjectURL(blob); im.onload = () => { cv.width = im.width; cv.height = im.height; x.drawImage(im, 0, 0); URL.revokeObjectURL(u); hist = []; }; im.src = u; };
      const doSave = n => { name = n; if (!/\.\w+$/.test(name)) name += '.png'; cv.toBlob(async bl => { const r = await FS.save(name, 'image/png', bl, 'pics', id); id = r.id; title(); OS.balloon('Paint', 'Saved to My Pictures'); }); };
      b.appendChild(mbar({ File: [['New', () => { id = null; name = 'untitled.png'; cv.width = 640; cv.height = 400; x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 400); hist = []; title(); }], ['Open…', () => pickFiles('image/*', fs => { name = fs[0].name; id = null; load(fs[0]); title(); })], ['Save', () => id ? doSave(name) : saveAsDlg(name, doSave)], ['Save As…', () => saveAsDlg(name, n => { id = null; doSave(n); })], '-', ['Exit', () => w.close()]], Edit: [['Undo', undo], ['Clear Image', clear]] }));
      b.appendChild(body); b.appendChild(pal); body.style.flex = '1'; title();
      if (arg) FS.get(arg).then(f => { if (f) { id = f.id; name = f.name; load(f.blob); title(); } }); w.api.arg = a2 => FS.get(a2).then(f => { if (f) { id = f.id; name = f.name; load(f.blob); title(); } });
      w.el.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'z') undo(); });
    } },
  solitaire: { name: 'Solitaire', icon: '🃏', w: 670, h: 520, prog: 1,
    render(b, w) {
      const SU = ['♠', '♥', '♦', '♣'], RK = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']; let tab, stock, waste, found, sel = null;
      const red = c => c.s === 1 || c.s === 2, pile = p => p[0] === 't' ? tab[+p.slice(1)] : p[0] === 'f' ? found[+p.slice(1)] : p === 'w' ? waste : stock;
      const canTab = (c, col) => { const t = col[col.length - 1]; return t ? t.up && red(t) !== red(c) && t.r === c.r + 1 : c.r === 13; }, canFnd = (c, f) => f.length ? f[f.length - 1].s === c.s && c.r === f.length + 1 : c.r === 1;
      const deal = () => { const d = []; for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) d.push({ s, r, up: 0 }); for (let i = d.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[d[i], d[j]] = [d[j], d[i]]; } tab = []; for (let i = 0; i < 7; i++) { tab.push(d.splice(0, i + 1)); tab[i][i].up = 1; } stock = d; waste = []; found = [[], [], [], []]; sel = null; draw(); };
      const card = (c, p, i, x, y, s) => `<div class="cd ${c.up ? 'f' + (red(c) ? ' r' : '') : 'bk'}${s ? ' sel' : ''}" data-p="${p}" data-i="${i}" style="left:${x}px;top:${y}px">${c.up ? `<b>${RK[c.r]}${SU[c.s]}</b><i>${SU[c.s]}</i>` : ''}</div>`;
      const draw = () => { let h = `<div class="sl" data-p="s" style="left:10px;top:10px;color:#fff;font-size:30px;text-align:center;line-height:92px">${stock.length ? '' : '↻'}</div>`;
        stock.length && (h += card(stock[stock.length - 1], 's', 0, 10, 10, 0)); waste.length && (h += card(waste[waste.length - 1], 'w', waste.length - 1, 90, 10, sel && sel.p === 'w'));
        found.forEach((f, k) => { h += `<div class="sl" data-p="f${k}" style="left:${250 + k * 80}px;top:10px"></div>`; f.length && (h += card(f[f.length - 1], 'f' + k, f.length - 1, 250 + k * 80, 10, 0)); });
        tab.forEach((col, k) => { h += `<div class="sl" data-p="t${k}" style="left:${10 + k * 90}px;top:130px"></div>`; let y = 130; col.forEach((c, i) => { h += card(c, 't' + k, i, 10 + k * 90, y, sel && sel.p === 't' + k && i >= sel.i); y += c.up ? 22 : 8; }); }); $('.sol', b).innerHTML = h; };
      const move = (s, to) => { const from = pile(s.p), cards = from.slice(s.i), tg = pile(to); if (!cards.length) return false;
        if (to[0] === 't' && canTab(cards[0], tg)) tg.push(...cards); else if (to[0] === 'f' && cards.length === 1 && canFnd(cards[0], tg)) tg.push(cards[0]); else return false;
        from.length = s.i; if (s.p[0] === 't' && from.length && !from[from.length - 1].up) from[from.length - 1].up = 1; return true; };
      const check = () => { if (found.every(f => f.length === 13)) OS.dialog({ title: 'Solitaire', html: '🎉 Congratulations, you won!', buttons: [['New Game', deal]] }); };
      b.innerHTML = '<div class="sol"></div>'; b.insertBefore(mbar({ Game: [['Deal', deal], '-', ['Exit', () => w.close()]], Help: [['How to play', () => OS.dialog({ title: 'Solitaire', html: 'Click a card, then click where to put it. Build columns down in alternating colours, foundations up by suit. Double-click a card to send it to a foundation.', w: 340 })]] }), b.firstChild);
      b.onclick = e => { const c = e.target.closest('[data-p]'); if (!c) return; const p = c.dataset.p, i = c.dataset.i !== undefined ? +c.dataset.i : null;
        if (p === 's') { if (stock.length) { const x = stock.pop(); x.up = 1; waste.push(x); } else { stock = waste.reverse(); stock.forEach(x => x.up = 0); waste = []; } sel = null; return draw(); }
        if (sel) { if (sel.p === p && sel.i === i) { sel = null; return draw(); } if (move(sel, p)) { sel = null; draw(); return check(); } }
        const P = pile(p); sel = (i !== null && P[i] && P[i].up && p[0] !== 'f' && (p !== 'w' || i === P.length - 1)) ? { p, i } : null; draw(); };
      b.ondblclick = e => { const c = e.target.closest('[data-i]'); if (!c) return; const p = c.dataset.p; if (p[0] === 'f' || p === 's') return; const P = pile(p); for (let k = 0; k < 4; k++) if (move({ p, i: P.length - 1 }, 'f' + k)) { sel = null; draw(); return check(); } };
      deal();
    } },
  taskmgr: { name: 'Windows Task Manager', icon: '📊', w: 420, h: 470, fixed: 1, single: 1, prog: 1,
    render(b, w) {
      let tab = 'app', sel = null, cpu = Array(60).fill(8); b.style.display = 'flex'; b.style.flexDirection = 'column';
      const list = () => OS.wins.filter(x => x.id !== 'taskmgr');
      const draw = () => { const L = list(); cpu.push(Math.min(100, 4 + L.length * 5 + Math.random() * 14)); cpu.shift(); const c = cpu[cpu.length - 1] | 0, mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB' : 'n/a';
        b.innerHTML = `<div class="tabs"><span data-t="app" class="${tab === 'app' ? 'on' : ''}">Applications</span><span data-t="perf" class="${tab === 'perf' ? 'on' : ''}">Performance</span></div><div class="tpg" style="height:calc(100% - 100px)">` +
          (tab === 'app' ? `<div class="lst" style="height:260px">${L.map((x, i) => `<div class="li tm${sel === x ? ' on' : ''}" data-w="${i}"><span>${x.app.icon} ${escH($('.tt', x.el).textContent)}</span><span>${x.min ? 'Minimized' : 'Running'}</span></div>`).join('') || '<div class="li">No applications running</div>'}</div><div style="text-align:right"><button class="xb" data-a="end">End Task</button> <button class="xb" data-a="sw">Switch To</button> <button class="xb" data-a="new">New Task…</button></div>`
            : `<b>CPU Usage: ${c}%</b><canvas id="cg" width="370" height="110" style="background:#000;border:2px inset #888;display:block;margin:6px 0"></canvas><b>Memory:</b> ${mem} (browser)<br><b>CPU threads:</b> ${navigator.hardwareConcurrency || 1}`) +
          `</div><div style="padding:4px 10px">Processes: ${L.length + 2} &nbsp; CPU Usage: ${c}%</div>`;
        const g = $('#cg', b); if (g) { const x = g.getContext('2d'); x.strokeStyle = '#0a3'; x.lineWidth = 1; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(0, i * 22); x.lineTo(370, i * 22); x.stroke(); } x.strokeStyle = '#3f3'; x.beginPath(); cpu.forEach((v, i) => x[i ? 'lineTo' : 'moveTo'](i * 6.2, 110 - v * 1.1)); x.stroke(); } };
      b.onclick = e => { const t = e.target.closest('[data-t]'), r = e.target.closest('[data-w]'), a = e.target.closest('[data-a]'); if (t) { tab = t.dataset.t; } else if (r) sel = list()[+r.dataset.w];
        else if (a && a.dataset.a === 'end' && sel) { OS.close(sel); sel = null; } else if (a && a.dataset.a === 'sw' && sel) { OS.restore(sel); OS.focus(sel); } else if (a && a.dataset.a === 'new') OS.run(); draw(); };
      const iv = setInterval(() => b.isConnected ? draw() : clearInterval(iv), 1000); w.api.close = () => clearInterval(iv); draw();
    } },
  wordpad: { name: 'Document - WordPad', icon: '📃', w: 640, h: 460, prog: 1,
    render(b, w, arg) {
      let id = null, name = 'Document.wpd', folder = 'docs'; b.style.display = 'flex'; b.style.flexDirection = 'column'; const title = () => w.setTitle(name + ' - WordPad');
      const clean = h => { const d = new DOMParser().parseFromString(h, 'text/html'); d.querySelectorAll('script,iframe,object,embed,link,style,meta').forEach(n => n.remove()); d.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /javascript:/i.test(a.value)) n.removeAttribute(a.name); })); return d.body.innerHTML; };
      const ed = document.createElement('div'); ed.className = 'wp'; ed.contentEditable = 'true'; const tb = document.createElement('div'); tb.className = 'wtb';
      tb.innerHTML = '<select data-f><option>Times New Roman</option><option>Arial</option><option>Courier New</option><option>Tahoma</option></select><select data-s><option value="2">10</option><option value="3" selected>12</option><option value="4">14</option><option value="5">18</option><option value="6">24</option><option value="7">36</option></select><b data-c="bold">B</b><i data-c="italic">I</i><u data-c="underline">U</u><span data-c="justifyLeft">⇤</span><span data-c="justifyCenter">↔</span><span data-c="justifyRight">⇥</span><span data-c="insertUnorderedList">• List</span>';
      tb.onmousedown = e => { if (!e.target.closest('select')) e.preventDefault(); }; tb.onclick = e => { const c = e.target.closest('[data-c]'); if (c) { document.execCommand(c.dataset.c); ed.focus(); } };
      tb.onchange = e => { if (e.target.dataset.f) document.execCommand('fontName', false, e.target.value); else document.execCommand('fontSize', false, e.target.value); ed.focus(); };
      const load = async fid => { const f = await FS.get(fid); if (!f) return; const t = await f.blob.text(); if (/\.wpd$/i.test(f.name)) ed.innerHTML = clean(t); else ed.textContent = t; id = f.id; name = f.name; folder = f.folder; title(); };
      const save = async n => { name = n; if (!/\.wpd$/i.test(name)) name = name.replace(/\.\w+$/, '') + '.wpd'; const r = await FS.save(name, 'text/html', new Blob([ed.innerHTML], { type: 'text/html' }), folder, id); id = r.id; title(); OS.balloon('WordPad', `Saved to ${LOC[folder]}`); };
      b.appendChild(mbar({ File: [['New', () => { ed.innerHTML = ''; id = null; name = 'Document.wpd'; title(); }], ['Open…', () => pickFiles('.wpd,.txt,.html', async fs => { const f = fs[0], t = await f.text(); if (/\.wpd$|\.html?$/i.test(f.name)) ed.innerHTML = clean(t); else ed.textContent = t; name = f.name; id = null; title(); })], ['Save', () => id ? save(name) : saveAsDlg(name, save)], ['Save As…', () => saveAsDlg(name, n => { id = null; save(n); })], '-', ['Exit', () => w.close()]] })); b.appendChild(tb); b.appendChild(ed); ed.style.flex = '1'; title(); arg && load(arg); w.api.arg = load;
    } },
  sndrec: { name: 'Sound Recorder', icon: '🎙️', w: 320, h: 170, fixed: 1, single: 1, prog: 1,
    render(b, w) {
      let rec = null, chunks = [], t0 = 0, iv; b.innerHTML = '<div style="padding:14px;text-align:center"><div id="st" style="font-size:20px;margin:8px;font-family:monospace">0.00 sec</div><button class="xb" id="rc">⏺ Record</button> <div id="msg" style="margin-top:10px;color:#444">Recordings are saved to My Music.</div></div>';
      const rcB = $('#rc', b); rcB.onclick = async () => { if (rec) { rec.stop(); return; } try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks = []; rec = new MediaRecorder(s); rec.ondataavailable = e => chunks.push(e.data);
        rec.onstop = async () => { s.getTracks().forEach(k => k.stop()); clearInterval(iv); const n = (await FS.list('music')).filter(f => /^Sound/.test(f.name)).length + 1, r = await FS.save(`Sound ${n}.webm`, 'audio/webm', new Blob(chunks, { type: 'audio/webm' }), 'music'); rec = null; rcB.textContent = '⏺ Record'; $('#msg', b).textContent = `Saved as ${r.name} in My Music.`; };
        rec.start(); t0 = Date.now(); rcB.textContent = '⏹ Stop'; iv = setInterval(() => { $('#st', b) && ($('#st', b).textContent = ((Date.now() - t0) / 1e3).toFixed(2) + ' sec'); }, 100); } catch (e) { OS.balloon('Sound Recorder', 'Microphone not available — allow access in the browser.'); } };
      w.api.close = () => { rec && rec.state !== 'inactive' && rec.stop(); clearInterval(iv); };
    } }
});

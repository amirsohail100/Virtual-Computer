/* ===== iOS (Virtual) — helpers and apps =====
   App: { name, icon, bg, html?, dark?, render(body, task, arg) }
   Optional task.api hooks: back() (return true if handled), show(), hide(), close(), sync() */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const G = (a, b) => `linear-gradient(160deg,${a},${b})`;
const WALLS = [{ id: 'w1', name: 'Blue Bloom', img: 'assets/w1.svg', light: false }, { id: 'w2', name: 'Aurora', img: 'assets/w2.svg', light: false }, { id: 'w3', name: 'Sunset', img: 'assets/w3.svg', light: false }, { id: 'w4', name: 'Citrus', img: 'assets/w4.svg', light: true }, { id: 'w5', name: 'Mint', img: 'assets/w5.svg', light: true }, { id: 'w6', name: 'Rose', img: 'assets/w6.svg', light: false }, { id: 'w7', name: 'Midnight', img: 'assets/w7.svg', light: false }, { id: 'w8', name: 'Graphite', img: 'assets/w8.svg', light: false }];

/* ---------- file storage (IndexedDB): images -> Photos, everything else -> Files ---------- */
const FS = (() => {
  let db; const open = () => db || (db = new Promise((res, rej) => { const r = indexedDB.open('ios_fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('f', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (m, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('f', m), r = fn(t.objectStore('f')); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => rej(t.error); }); };
  return {
    list: () => tx('readonly', s => s.getAll()).then(a => (a || []).sort((x, y) => y.added - x.added)).catch(() => []),
    get: id => tx('readonly', s => s.get(id)), del: id => tx('readwrite', s => s.delete(id)),
    async import(files) {
      const ids = []; let im = 0, ot = 0;
      try {
        for (const f of [...files]) {
          const img = f.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(f.name), id = 'f' + Date.now() + Math.random().toString(36).slice(2, 6);
          await tx('readwrite', s => s.put({ id, name: f.name, type: f.type, size: f.size, kind: img ? 'image' : 'file', added: Date.now(), blob: f }));
          if (img) { im++; ids.push(id); } else ot++;
        }
      } catch (e) { OS.notify('Files', 'Could not save', 'Storage is full or blocked by the browser.', '⚠️'); }
      OS.sync(); if (ot) OS.notify('Files', 'Saved', `${ot} file${ot > 1 ? 's' : ''} saved in Files`, '📁'); if (im) OS.notify('Photos', 'Imported', `${im} photo${im > 1 ? 's' : ''} added to Photos`, '🌸');
      return ids;
    }
  };
})();
/* opens the system file picker (works on PC and on phones) */
const pickFiles = (accept, cb) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (accept) i.accept = accept; i.onchange = () => { if (i.files.length) cb(i.files); }; i.click(); };
const fsize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const dl = (f, url) => { const a = document.createElement('a'); a.href = url; a.download = f.name; a.click(); };
const tg = (k, on) => `<div class="tg${on ? ' on' : ''}" data-k="${k}"></div>`;

const APPS = {
  calendar: { name: 'Calendar', icon: '📅', bg: '#fff',
    html: () => { const d = new Date(); return `<span class="ci"><small>${DAYS[d.getDay()].slice(0, 3).toUpperCase()}</small><b>${d.getDate()}</b></span>`; },
    render(b) {
      let y = new Date().getFullYear(), m = new Date().getMonth(); const T = new Date();
      const draw = () => {
        const f = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(); let h = '';
        for (const c of 'SMTWTFS') h += `<b class="dw">${c}</b>`; h += '<i></i>'.repeat(f);
        for (let i = 1; i <= n; i++) h += `<div class="dn${i === T.getDate() && m === T.getMonth() && y === T.getFullYear() ? ' t' : ''}">${i}</div>`;
        b.innerHTML = `<div class="nb"><span data-p="-1">‹</span><b>${MON[m]} ${y}</b><span data-p="1">›</span></div><div class="sc"><div class="cal">${h}</div></div>`;
      };
      b.onclick = e => { const p = e.target.closest('[data-p]'); if (p) { m += +p.dataset.p; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); } }; draw();
    } },
  photos: { name: 'Photos', icon: '🌸', bg: '#fff',
    render(b, t) {
      let urls = {}, view = null; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const draw = async () => {
        const list = (await FS.list()).filter(f => f.kind === 'image'), cf = list.find(f => f.id === view); if (view && !cf) view = null;
        b.innerHTML = `<div class="nb"><b style="text-align:left;font-size:30px">Photos</b><span data-imp title="Import from your device">＋</span></div>` +
          (list.length ? `<div class="sc" style="padding:0"><div class="ph">${list.map(f => `<img data-i="${f.id}" src="${U(f)}" alt="">`).join('')}</div></div>`
            : '<div class="sc emp"><p>No Photos</p><small>Tap ＋ or drop images here to import them from your PC or phone.</small><button class="btn" data-imp>Import Photos</button></div>') +
          (cf ? `<div class="big"><div class="vb"><span data-back>‹ Photos</span><span data-wp>Wallpaper</span><span data-dl>⬇</span><span data-del>🗑</span></div><img src="${U(cf)}" alt=""></div>` : '');
      };
      draw(); t.api.sync = draw; t.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL);
      t.api.back = () => { if (view) { view = null; draw(); return true; } };
      b.onclick = async e => {
        const i = e.target.closest('[data-i]');
        if (i) { view = i.dataset.i; draw(); } else if (e.target.closest('[data-imp]')) pickFiles('image/*', fs => FS.import(fs));
        else if (e.target.closest('[data-back]')) { view = null; draw(); }
        else if (view && e.target.closest('[data-wp]')) { OS.set({ wall: 'u:' + view }); OS.notify('Settings', 'Wallpaper', 'Wallpaper updated', '🖼️'); }
        else if (view && e.target.closest('[data-dl]')) { const f = await FS.get(view); if (f) dl(f, U(f)); }
        else if (view && e.target.closest('[data-del]')) { const id = view; view = null; await FS.del(id); if (urls[id]) URL.revokeObjectURL(urls[id]); delete urls[id]; if (OS.settings.wall === 'u:' + id) OS.set({ wall: 'w1' }); draw(); }
      };
    } },
  files: { name: 'Files', icon: '📁', bg: G('#4aa3ff', '#1c6fe0'),
    render(b, t) {
      let view = null; const ico = f => /pdf/.test(f.type) ? '📕' : /^audio/.test(f.type) ? '🎵' : /^video/.test(f.type) ? '🎞️' : /zip|rar|7z|tar/.test(f.type + f.name) ? '🗜️' : /^text|json/.test(f.type) ? '📄' : '📎';
      const draw = async () => {
        const list = (await FS.list()).filter(f => f.kind !== 'image');
        b.innerHTML = `<div class="nb"><b style="text-align:left;font-size:30px">Files</b><span data-imp title="Upload files">＋</span></div><div class="sc">` +
          (list.length ? `<div class="grp">${list.map(f => `<div class="row" data-o="${f.id}"><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ico(f)} ${escH(f.name)}</span><small>${fsize(f.size)}</small><span data-d="${f.id}">🗑</span></div>`).join('')}</div><small style="color:var(--tx2)">Images you upload go to Photos automatically.</small>`
            : '<div class="emp" style="height:380px"><p>No Files</p><small>Tap ＋ or drop files here to upload them from your PC or phone. Images are saved in Photos.</small><button class="btn" data-imp>Upload Files</button></div>') + '</div>' +
          (view ? `<div class="big" style="background:var(--bg)"><div class="vb"><span data-back>‹ Files</span></div><pre class="tx"></pre></div>` : '');
        if (view) $('.tx', b).textContent = view;
      };
      draw(); t.api.sync = draw; t.api.back = () => { if (view) { view = null; draw(); return true; } };
      b.onclick = async e => {
        const d = e.target.closest('[data-d]'), o = e.target.closest('[data-o]');
        if (e.target.closest('[data-imp]')) pickFiles('', fs => FS.import(fs)); else if (e.target.closest('[data-back]')) { view = null; draw(); }
        else if (d) { await FS.del(d.dataset.d); draw(); }
        else if (o) { const f = await FS.get(o.dataset.o); if (!f) return; const u = URL.createObjectURL(f.blob);
          if (/^text|json/.test(f.type) || /\.(txt|md|json|csv|log)$/i.test(f.name)) { view = (await f.blob.text()).slice(0, 200000); draw(); URL.revokeObjectURL(u); }
          else if (/pdf|^audio|^video/.test(f.type)) { window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 6e4); } else { dl(f, u); setTimeout(() => URL.revokeObjectURL(u), 6e4); } }
      };
    } },
  camera: { name: 'Camera', icon: '📷', bg: G('#8e8e93', '#48484a'), dark: true,
    render(b, t) {
      b.innerHTML = '<video autoplay playsinline muted></video><div class="shut"><i></i></div><p class="cerr" hidden>Camera not available</p>';
      const v = $('video', b); let s = null;
      t.api.show = () => { navigator.mediaDevices && navigator.mediaDevices.getUserMedia({ video: true }).then(x => { s = x; v.srcObject = x; }).catch(() => { $('.cerr', b).hidden = false; }); };
      t.api.hide = t.api.close = () => { s && s.getTracks().forEach(k => k.stop()); s = null; v.srcObject = null; };
      $('.shut i', b).onclick = () => { b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), 150); };
    } },
  weather: { name: 'Weather', icon: '⛅', bg: G('#4aa3ff', '#1c6fe0'), dark: true,
    render(b) {
      b.style.background = G('#4aa3ff', '#1c6fe0');
      b.innerHTML = '<div style="text-align:center;padding-top:40px;color:#fff"><div style="font-size:28px">My Location</div><div style="font-size:92px;font-weight:200">28°</div><div>Partly Cloudy</div></div><div class="sc" style="margin-top:26px"><div class="grp" style="background:rgba(255,255,255,.2)">' + ['Now ⛅ 28°', '1 PM ☀️ 30°', '3 PM ☀️ 31°', '5 PM ⛅ 29°', '8 PM 🌙 25°'].map(x => `<div class="row" style="color:#fff">${x}</div>`).join('') + '</div></div>';
    } },
  clock: { name: 'Clock', icon: '🕒', bg: '#000', dark: true,
    render(b, t) {
      const Z = [['Local'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo']];
      b.innerHTML = '<h1 class="lt">Clock</h1><div class="sc"><div class="grp" id="wc"></div><div class="sw0"><div id="swt">00:00.0</div><button id="sb">Start</button><button id="sr" style="background:#636366">Reset</button></div></div>';
      let t0 = 0, run = 0, acc = 0; const f = z => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', timeZone: z });
      const tick = () => { $('#wc', b).innerHTML = Z.map(([n, z]) => `<div class="row"><span>${n}</span><b style="font-weight:400;white-space:nowrap">${f(z)}</b></div>`).join(''); if (run) acc = Date.now() - t0; const s = acc / 1e3 | 0; $('#swt', b).textContent = String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + '.' + (acc / 100 % 10 | 0); };
      const iv = setInterval(tick, 100); tick(); t.api.close = () => clearInterval(iv);
      $('#sb', b).onclick = function () { run = !run; if (run) t0 = Date.now() - acc; this.textContent = run ? 'Stop' : 'Start'; this.style.background = run ? '#ff3b30' : '#34c759'; };
      $('#sr', b).onclick = () => { acc = 0; if (run) t0 = Date.now(); };
    } },
  maps: { name: 'Maps', icon: '🗺️', bg: G('#7bd88f', '#3b9dff'),
    render(b) { b.innerHTML = '<h1 class="lt">Maps</h1><div class="sc"><input class="in" id="q" placeholder="Search Maps — press Enter"></div>'; $('#q', b).onkeydown = k => { if (k.key === 'Enter' && k.target.value) window.open('https://www.openstreetmap.org/search?query=' + encodeURIComponent(k.target.value), '_blank'); }; } },
  calculator: { name: 'Calculator', icon: '🧮', bg: '#333', dark: true,
    render(b) {
      b.style.background = '#000'; let x = ''; const K = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
      b.innerHTML = `<div class="cd" id="cd">0</div><div class="ck">${K.map(k => `<button class="${'÷×−+='.includes(k) ? 'op' : ['AC', '±', '%'].includes(k) ? 'fn' : ''}${k === '0' ? ' z' : ''}">${k}</button>`).join('')}</div>`;
      const d = $('#cd', b), ev = s => { s = s.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-'); if (!/^[\d+\-*/.() ]+$/.test(s)) throw 0; return +(Function('return ' + s)()).toFixed(8); };
      $('.ck', b).onclick = e => { const k = e.target.closest('button'); if (!k) return; const c = k.textContent; if (x === 'Error') x = '';
        try { if (c === 'AC') x = ''; else if (c === '±') x = x ? String(-ev(x)) : x; else if (c === '%') x = x ? String(ev(x) / 100) : x; else if (c === '=') x = x ? String(ev(x)) : x; else x += c; } catch (er) { x = 'Error'; }
        d.textContent = x || '0'; d.style.fontSize = x.length > 8 ? '44px' : '72px'; };
    } },
  settings: { name: 'Settings', icon: '⚙️', bg: G('#a0a0a5', '#636366'),
    render(b, t) {
      let view = 'main', urls = {}; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const main = () => { const s = OS.settings, row = (n, k) => `<div class="row">${n}${tg(k, s[k])}</div>`, w = WALLS.find(x => x.id === s.wall);
        b.innerHTML = `<h1 class="lt">Settings</h1><div class="sc"><div class="grp">${row('Airplane Mode', 'plane')}${row('Wi‑Fi', 'wifi')}${row('Bluetooth', 'bt')}${row('Cellular', 'cell')}${row('Personal Hotspot', 'hot')}</div><div class="grp"><div class="row" data-go="wall" style="cursor:pointer">Wallpaper<small>${w ? w.name : 'My Photo'} ›</small></div>${row('Do Not Disturb', 'dnd')}${row('Dark Mode', 'dark')}<div class="row">Brightness<input type="range" id="br" min="30" max="100" value="${s.brightness}"></div></div><div class="grp"><div class="row">Name<small>iPhone</small></div><div class="row">Software Version<small>iOS (Virtual)</small></div></div></div>`; };
      const wall = async () => { const s = OS.settings, im = (await FS.list()).filter(f => f.kind === 'image');
        b.innerHTML = `<div class="nb"><span data-back>‹</span><b>Wallpaper</b><span data-up title="Upload your own">＋</span></div><div class="sc"><div class="wg">${WALLS.map(w => `<div class="wt${s.wall === w.id ? ' on' : ''}" data-w="${w.id}" style="background-image:url('${w.img}')"><small>${w.name}</small></div>`).join('')}</div>` +
          (im.length ? `<h3 class="sh">My Photos</h3><div class="wg">${im.map(f => `<div class="wt${s.wall === 'u:' + f.id ? ' on' : ''}" data-w="u:${f.id}" style="background-image:url('${U(f)}')"></div>`).join('')}</div>` : '') + '<button class="btn" data-up>Upload from device</button></div>'; };
      const draw = () => view === 'wall' ? wall() : main(); draw();
      t.api.sync = () => { const a = document.activeElement; if (!(a && a.type === 'range' && b.contains(a))) draw(); };
      t.api.back = () => { if (view === 'wall') { view = 'main'; draw(); return true; } };
      t.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL);
      b.onclick = e => { const g = e.target.closest('.tg'), w = e.target.closest('[data-w]');
        if (g) OS.set({ [g.dataset.k]: !OS.settings[g.dataset.k] }); else if (e.target.closest('[data-go]')) { view = 'wall'; draw(); }
        else if (e.target.closest('[data-back]')) { view = 'main'; draw(); } else if (w) OS.set({ wall: w.dataset.w });
        else if (e.target.closest('[data-up]')) pickFiles('image/*', async fs => { const ids = await FS.import(fs); if (ids[0]) OS.set({ wall: 'u:' + ids[0] }); }); };
      b.oninput = e => { if (e.target.id === 'br') OS.set({ brightness: +e.target.value }, 1); };
    } },
  phone: { name: 'Phone', icon: '📞', bg: G('#6be36f', '#1fb83a'),
    render(b) {
      b.innerHTML = '<div class="pn" id="pn">&nbsp;</div><div class="ck pad">' + '123456789*0#'.split('').map(k => `<button>${k}</button>`).join('') + '<span></span><button class="call" id="cl">📞</button><button id="dl">⌫</button></div>';
      let n = ''; const p = $('#pn', b), up = () => p.textContent = n || '\u00a0';
      $('.pad', b).onclick = e => { const k = e.target.closest('button'); if (!k) return; if (k.id === 'cl') { if (n) p.textContent = 'Calling ' + n + '…'; } else if (k.id === 'dl') { n = n.slice(0, -1); up(); } else { n += k.textContent; up(); } };
    } },
  safari: { name: 'Safari', icon: '🧭', bg: '#fff',
    render(b) {
      const F = [['Google', 'https://google.com', '🔎'], ['Wikipedia', 'https://wikipedia.org', '📖'], ['YouTube', 'https://youtube.com', '▶️'], ['GitHub', 'https://github.com', '🐙']];
      b.innerHTML = `<h1 class="lt">Safari</h1><div class="sc"><input class="in" id="u" placeholder="Search or enter website name"><div class="fav">${F.map(f => `<div data-u="${f[1]}"><i>${f[2]}</i>${f[0]}</div>`).join('')}</div></div>`;
      $('#u', b).onkeydown = k => { if (k.key === 'Enter') { const v = k.target.value.trim(); if (v) window.open(/^[\w-]+\.[\w.-]+/.test(v) && !v.includes(' ') ? (v.startsWith('http') ? v : 'https://' + v) : 'https://www.google.com/search?q=' + encodeURIComponent(v), '_blank'); } };
      b.onclick = e => { const f = e.target.closest('[data-u]'); if (f) window.open(f.dataset.u, '_blank'); };
    } },
  messages: { name: 'Messages', icon: '💬', bg: G('#6be36f', '#1fb83a'),
    render(b) {
      b.innerHTML = '<div class="nb"><b>Aarav</b></div><div class="msb" id="ch"></div><div class="mi"><input class="in" id="mi" placeholder="iMessage" style="margin:0"></div>';
      const add = (x, me) => { const d = document.createElement('div'); d.className = 'bub' + (me ? ' me' : ''); d.textContent = x; const c = $('#ch', b); c.appendChild(d); c.scrollTop = 1e5; };
      add('Hey! Welcome to iOS (Virtual) 👋');
      $('#mi', b).onkeydown = k => { if (k.key === 'Enter' && k.target.value.trim()) { add(k.target.value, 1); k.target.value = ''; setTimeout(() => add(['Nice!', 'Got it 👍', 'Haha ok', 'Tell me more'][Math.random() * 4 | 0]), 700); } };
    } },
  notes: { name: 'Notes', icon: '📝', bg: G('#ffe27a', '#ffc300'),
    render(b) {
      b.innerHTML = '<h1 class="lt">Notes</h1><div class="sc"><textarea class="in" id="nt" style="height:340px;resize:none" placeholder="Start typing…"></textarea></div>';
      const t = $('#nt', b); t.value = jget('i_note', ''); t.oninput = () => jset('i_note', t.value);
    } }
};


/* ===== iOS (Virtual) — extra apps + iPhone-Pro style default wallpapers =====
   Loaded after apps.js and before main.js. Adds apps with Object.assign(APPS, ...). */

/* default wallpapers (first in the list); new users start with the first one */
WALLS.unshift(
  { id: 'p1', name: 'Sky Blue', img: 'assets/p1.svg', light: true },
  { id: 'p2', name: 'Cobalt', img: 'assets/p2.svg', light: true },
  { id: 'p3', name: 'Teal', img: 'assets/p3.svg', light: false },
  { id: 'p4', name: 'Deep Purple', img: 'assets/p4.svg', light: false }
);
{ const s = jget('i_settings1', {}); if (!s.wall) { s.wall = 'p1'; jset('i_settings1', s); } }

const store = (k, d) => ({ get: () => jget(k, d), set: v => jset(k, v) });

Object.assign(APPS, {
  mail: { name: 'Mail', icon: '✉️', bg: G('#4aa3ff', '#1c6fe0'),
    render(b, t) {
      const st = store('i_mail', [{ id: 1, box: 'in', from: 'iOS Team', sub: 'Welcome to iOS (Virtual)', body: 'Your virtual iPhone is ready. Try Control Center, wallpapers and uploading photos.', unread: 1, d: Date.now() }, { id: 2, box: 'in', from: 'Aarav', sub: 'Dinner tonight?', body: 'Are we still on for 8 PM?', unread: 1, d: Date.now() - 36e5 }]);
      let box = 'in', view = null, comp = false; const L = () => st.get();
      const draw = () => {
        const all = L(), m = all.find(x => x.id === view);
        if (comp) { b.innerHTML = '<div class="nb"><span data-back>Cancel</span><b>New Message</b><span data-send style="font-size:17px">Send</span></div><div class="sc col"><input class="in" id="to" placeholder="To"><input class="in" id="sj" placeholder="Subject"><textarea class="in" id="bd" placeholder="Message"></textarea></div>'; return; }
        if (m) { b.innerHTML = `<div class="nb"><span data-back>‹ ${box === 'in' ? 'Inbox' : 'Sent'}</span><b></b><span data-del>🗑</span></div><div class="sc"><h2>${escH(m.sub)}</h2><p style="color:var(--tx2);margin:4px 0 14px">${box === 'in' ? 'From' : 'To'}: ${escH(m.from)}</p><p style="user-select:text;white-space:pre-wrap">${escH(m.body)}</p></div>`; return; }
        const l = all.filter(x => x.box === box);
        b.innerHTML = `<div class="nb"><b style="text-align:left;font-size:30px">Mailboxes</b><span data-new>✎</span></div><div class="seg"><span data-b="in" class="${box === 'in' ? 'on' : ''}">Inbox</span><span data-b="out" class="${box === 'out' ? 'on' : ''}">Sent</span></div><div class="sc">${l.length ? `<div class="grp">${l.map(x => `<div class="row mrow" data-m="${x.id}"><b>${x.unread ? '<span class="dot" style="display:inline-block;margin-right:6px"></span>' : ''}${escH(x.from)}</b><span>${escH(x.sub)}</span><small>${escH(x.body)}</small></div>`).join('')}</div>` : '<div class="emp" style="height:300px"><p>No Mail</p></div>'}</div>`;
      };
      draw(); t.api.back = () => { if (comp || view) { comp = false; view = null; draw(); return true; } };
      b.onclick = e => { const g = s => e.target.closest(s);
        if (g('[data-new]')) { comp = true; draw(); } else if (g('[data-back]')) { comp = false; view = null; draw(); }
        else if (g('[data-b]')) { box = g('[data-b]').dataset.b; draw(); }
        else if (g('[data-m]')) { view = +g('[data-m]').dataset.m; st.set(L().map(x => x.id === view ? { ...x, unread: 0 } : x)); draw(); }
        else if (g('[data-del]')) { st.set(L().filter(x => x.id !== view)); view = null; draw(); }
        else if (g('[data-send]')) { const to = $('#to', b).value.trim(); if (!to) return; st.set([{ id: Date.now(), box: 'out', from: to, sub: $('#sj', b).value || '(No Subject)', body: $('#bd', b).value, d: Date.now() }, ...L()]); comp = false; box = 'out'; draw(); OS.notify('Mail', 'Message sent', 'To ' + to, '✉️'); } };
    } },
  music: { name: 'Music', icon: '🎵', bg: G('#ff5f6d', '#a35bff'),
    render(b, t) {
      const au = new Audio(); let songs = [], i = -1, urls = {};
      const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const draw = async () => {
        songs = (await FS.list()).filter(f => /^audio/.test(f.type) || /\.(mp3|m4a|wav|ogg|flac|aac)$/i.test(f.name));
        b.innerHTML = `<div class="nb"><b style="text-align:left;font-size:30px">Music</b><span data-imp title="Add songs">＋</span></div><div class="sc">${songs.length ? `<div class="grp">${songs.map((f, k) => `<div class="row" data-s="${k}" style="cursor:pointer"><span>${k === i ? '🔊' : '🎵'} ${escH(f.name.replace(/\.\w+$/, ''))}</span></div>`).join('')}</div>` : '<div class="emp" style="height:300px"><p>No Songs</p><small>Tap ＋ to add songs from your PC or phone.</small><button class="btn" data-imp>Add Songs</button></div>'}</div>` +
          `<div class="player"><div class="art">🎶</div><b id="mt">${i >= 0 && songs[i] ? escH(songs[i].name.replace(/\.\w+$/, '')) : 'Not Playing'}</b><progress id="mp" value="0" max="1"></progress><div class="ctl"><span data-p="-1">⏮</span><span data-p="0">${au.paused ? '▶️' : '⏸'}</span><span data-p="1">⏭</span></div></div>`;
      };
      const play = k => { if (!songs.length) return; i = (k + songs.length) % songs.length; au.src = U(songs[i]); au.play(); draw(); };
      au.onended = () => play(i + 1); au.ontimeupdate = () => { const p = $('#mp', b); if (p && au.duration) { p.max = au.duration; p.value = au.currentTime; } };
      draw(); t.api.sync = draw; t.api.close = () => { au.pause(); Object.values(urls).forEach(URL.revokeObjectURL); };
      b.onclick = e => { const s = e.target.closest('[data-s]'), p = e.target.closest('[data-p]');
        if (e.target.closest('[data-imp]')) pickFiles('audio/*', fs => FS.import(fs)); else if (s) play(+s.dataset.s);
        else if (p) { const d = +p.dataset.p; if (d) play(i + d); else if (i < 0) play(0); else { au.paused ? au.play() : au.pause(); draw(); } } };
    } },
  contacts: { name: 'Contacts', icon: '👤', bg: G('#c7c7cc', '#8e8e93'),
    render(b, t) {
      const st = store('i_contacts', [{ id: 1, n: 'Aarav Sharma', p: '+91 98765 43210' }, { id: 2, n: 'Priya Singh', p: '+91 91234 56789' }, { id: 3, n: 'Rahul Verma', p: '+91 99887 76655' }]);
      let view = null, add = false; const L = () => st.get().sort((a, c) => a.n.localeCompare(c.n));
      const draw = () => { const c = L().find(x => x.id === view);
        if (add) b.innerHTML = '<div class="nb"><span data-back>Cancel</span><b>New Contact</b><span data-save style="font-size:17px">Done</span></div><div class="sc col"><input class="in" id="cn" placeholder="Name"><input class="in" id="cp" placeholder="Phone"></div>';
        else if (c) b.innerHTML = `<div class="nb"><span data-back>‹ Contacts</span><b></b><span data-del>🗑</span></div><div class="sc"><div class="av">${escH(c.n[0])}</div><h2 style="text-align:center">${escH(c.n)}</h2><div class="grp" style="margin-top:16px"><div class="row">mobile<small>${escH(c.p)}</small></div></div></div>`;
        else b.innerHTML = `<div class="nb"><b style="text-align:left;font-size:30px">Contacts</b><span data-new>＋</span></div><div class="sc"><div class="grp">${L().map(x => `<div class="row" data-c="${x.id}" style="cursor:pointer">${escH(x.n)}</div>`).join('')}</div></div>`; };
      draw(); t.api.back = () => { if (add || view) { add = false; view = null; draw(); return true; } };
      b.onclick = e => { const g = s => e.target.closest(s);
        if (g('[data-new]')) { add = true; draw(); } else if (g('[data-back]')) { add = false; view = null; draw(); }
        else if (g('[data-c]')) { view = +g('[data-c]').dataset.c; draw(); } else if (g('[data-del]')) { st.set(st.get().filter(x => x.id !== view)); view = null; draw(); }
        else if (g('[data-save]')) { const n = $('#cn', b).value.trim(); if (n) { st.set([...st.get(), { id: Date.now(), n, p: $('#cp', b).value }]); add = false; draw(); } } };
    } },
  reminders: { name: 'Reminders', icon: '☑️', bg: '#fff',
    render(b) {
      const st = store('i_rem', [{ id: 1, t: 'Buy groceries', done: 0 }, { id: 2, t: 'Call mom', done: 0 }]);
      const draw = () => { const l = st.get(); b.innerHTML = `<h1 class="lt" style="color:#0a84ff">Reminders</h1><div class="sc"><input class="in" id="rn" placeholder="New reminder — press Enter"><div class="grp">${l.map(x => `<div class="row" data-r="${x.id}" style="cursor:pointer;${x.done ? 'opacity:.5;text-decoration:line-through' : ''}"><span class="dot r${x.done ? ' on' : ''}"></span><span style="flex:1">${escH(x.t)}</span><span data-x="${x.id}">✕</span></div>`).join('') || '<div class="row"><small>All done 🎉</small></div>'}</div></div>`; };
      draw(); b.onclick = e => { const x = e.target.closest('[data-x]'), r = e.target.closest('[data-r]');
        if (x) { st.set(st.get().filter(y => y.id != x.dataset.x)); draw(); } else if (r) { st.set(st.get().map(y => y.id == r.dataset.r ? { ...y, done: y.done ? 0 : 1 } : y)); draw(); } };
      b.onkeydown = e => { if (e.target.id === 'rn' && e.key === 'Enter' && e.target.value.trim()) { st.set([...st.get(), { id: Date.now(), t: e.target.value.trim(), done: 0 }]); draw(); $('#rn', b).focus(); } };
    } },
  voicememos: { name: 'Voice Memos', icon: '🎙️', bg: G('#2c2c2e', '#000'), dark: true,
    render(b, t) {
      let rec = null, chunks = [], urls = []; const memos = async () => (await FS.list()).filter(f => f.kind !== 'image' && /^Recording/.test(f.name));
      const draw = async () => { const l = await memos(); urls.forEach(URL.revokeObjectURL); urls = l.map(f => URL.createObjectURL(f.blob));
        b.innerHTML = `<h1 class="lt">Voice Memos</h1><div class="sc"><div class="rec${rec ? ' on' : ''}" data-rec><i></i></div><p style="text-align:center;color:var(--tx2)">${rec ? 'Recording… tap to stop' : 'Tap to record'}</p><div class="grp" style="margin-top:14px">${l.map((f, k) => `<div class="row" style="flex-direction:column;align-items:stretch"><span>${escH(f.name)} <span data-d="${f.id}" style="float:right">🗑</span></span><audio controls src="${urls[k]}"></audio></div>`).join('') || '<div class="row"><small>No recordings</small></div>'}</div></div>`; };
      draw(); t.api.sync = () => { if (!rec) draw(); }; t.api.close = () => { rec && rec.state !== 'inactive' && rec.stop(); urls.forEach(URL.revokeObjectURL); };
      b.onclick = async e => { const d = e.target.closest('[data-d]');
        if (d) { await FS.del(d.dataset.d); draw(); } else if (e.target.closest('[data-rec]')) {
          if (rec) { rec.stop(); return; }
          try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); chunks = []; rec = new MediaRecorder(s); rec.ondataavailable = x => chunks.push(x.data);
            rec.onstop = async () => { s.getTracks().forEach(k => k.stop()); const n = (await memos()).length + 1; rec = null; await FS.import([new File(chunks, `Recording ${n}.webm`, { type: 'audio/webm' })]); draw(); };
            rec.start(); draw(); } catch (er) { OS.notify('Voice Memos', 'Microphone unavailable', 'Allow microphone access in the browser.', '🎙️'); } } };
    } }
});

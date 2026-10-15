/* ===== Android (Virtual) — wallpapers and apps =====
   App: { name, icon, bg, html?, dark?, render(body, task, arg) }
   task.api.back() can return true when the app handled "Back" itself. */

/* ---------- helpers ---------- */
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };

/* ---------- wallpapers (built-in + your own photos) ---------- */
const BUILTIN_WALLS = {
  a1: { name: 'Bloom', img: "url('assets/bloom.svg')", bg: '#cfe0ff' },
  a2: { name: 'Aurora', img: "url('assets/aurora.svg')", bg: '#0a1a3a' },
  a3: { name: 'Dunes', img: "url('assets/dunes.svg')", bg: '#7a3a8a' }
};
let CUSTOM_WALLS = jget('a_walls1', []);
const saveWalls = () => jset('a_walls1', CUSTOM_WALLS);
const wallIds = () => [...Object.keys(BUILTIN_WALLS), ...CUSTOM_WALLS.map(w => w.id)];
function wallInfo(id) {
  if (BUILTIN_WALLS[id]) return BUILTIN_WALLS[id];
  const c = CUSTOM_WALLS.find(w => w.id === id);
  return c ? { name: c.name, img: 'url("' + c.data + '")', bg: '#000', custom: true } : BUILTIN_WALLS.a1;
}
function applyWall(el, id, fit) {
  const w = wallInfo(id); el.style.backgroundColor = w.bg; el.style.backgroundImage = w.img;
  const m = { fill: ['cover', 'center', 'no-repeat'], fit: ['contain', 'center', 'no-repeat'], stretch: ['100% 100%', 'center', 'no-repeat'], center: ['auto', 'center', 'no-repeat'], tile: ['auto', 'top left', 'repeat'] }[w.custom ? (fit || 'fill') : 'fill'];
  el.style.backgroundSize = m[0]; el.style.backgroundPosition = m[1]; el.style.backgroundRepeat = m[2];
}
/* shrink an image (File or data URL) so it fits in localStorage; cb(dataURL) */
function shrink(src, maxW, q, cb, err) {
  const go = url => { const img = new Image(); img.onerror = () => err && err('This image could not be opened.'); img.onload = () => { const sc = Math.min(1, maxW / Math.max(img.width, img.height)), cv = document.createElement('canvas'); cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/jpeg', q)); }; img.src = url; };
  if (typeof src === 'string') return go(src);
  const rd = new FileReader(); rd.onerror = () => err && err('Could not read this file.'); rd.onload = () => go(rd.result); rd.readAsDataURL(src);
}
function addWallData(name, src, cb) {
  const tryQ = [[1600, .8], [1200, .65], [800, .55]]; let i = 0;
  const step = () => { if (i >= tryQ.length) return cb(null, 'Browser storage is full. Remove an older wallpaper and try again.');
    const [mw, q] = tryQ[i++]; shrink(src, mw, q, data => { const w = { id: 'c' + Date.now(), name, data }; CUSTOM_WALLS.push(w); if (saveWalls()) cb(w.id); else { CUSTOM_WALLS.pop(); step(); } }, e => cb(null, e)); };
  step();
}
function addCustomWall(file, cb) { if (!file || !/^image\//.test(file.type)) return cb(null, 'Please choose an image file.'); addWallData(file.name.replace(/\.[^.]+$/, ''), file, cb); }

const APPS = {}; const mk = (id, o) => APPS[id] = o;
const PHOTOS = { list: () => jget('a_photos1', []), add(name, data) { const l = this.list(); l.unshift({ name, data }); jset('a_photos1', l.slice(0, 12)); } };

/* ---------- Phone ---------- */
mk('phone', { name: 'Phone', icon: '📞', bg: 'linear-gradient(135deg,#34a853,#1e8e3e)',
render(body, t) {
  let num = '', tab = 'keypad', timer = null; const recents = jget('a_calls1', []);
  const draw = () => {
    body.innerHTML = `<div class="ab"><b>Phone</b></div><div class="ck"><button class="${tab === 'keypad' ? 'on' : ''}" data-t="keypad">Keypad</button><button class="${tab === 'recent' ? 'on' : ''}" data-t="recent">Recents</button></div>` +
      (tab === 'keypad' ? `<div class="dial"><div class="dial-n">${escH(num) || '&nbsp;'}</div><div class="keys">${'123456789*0#'.split('').map(k => `<button data-k="${k}">${k}</button>`).join('')}</div><div style="display:flex;gap:26px;align-items:center"><button class="call" data-call>📞</button><button data-k="⌫" style="font-size:20px;width:44px;height:44px">⌫</button></div></div>`
        : `<div style="flex:1;overflow:auto">${recents.length ? recents.map(c => `<div class="li" data-num="${escH(c.n)}"><div class="av">📞</div><div class="grow"><b>${escH(c.n)}</b><small>${new Date(c.t).toLocaleString()}</small></div></div>`).join('') : '<div class="empty">No recent calls</div>'}</div>`);
  };
  const endCall = () => { clearInterval(timer); const s = body.querySelector('.callscr'); if (s) s.remove(); };
  const call = n => {
    if (!n) return; recents.unshift({ n, t: Date.now() }); jset('a_calls1', recents.slice(0, 20)); let sec = 0;
    const s = document.createElement('div'); s.className = 'callscr'; s.innerHTML = `<div class="av" style="width:90px;height:90px;font-size:40px">👤</div><h2>${escH(n)}</h2><div class="st">Calling…</div><button class="call end" data-end>📞</button>`; body.appendChild(s);
    timer = setInterval(() => { sec++; const st = s.querySelector('.st'); if (st) st.textContent = sec < 3 ? 'Calling…' : `${String(Math.floor((sec - 3) / 60)).padStart(2, '0')}:${String((sec - 3) % 60).padStart(2, '0')}`; }, 1000);
  };
  body.onclick = e => {
    const d = e.target.closest('[data-t],[data-k],[data-call],[data-end],[data-num]'); if (!d) return; const x = d.dataset;
    if (x.t) tab = x.t; if (x.k) num = x.k === '⌫' ? num.slice(0, -1) : num + x.k; if (x.call !== undefined) return call(num);
    if (x.end !== undefined) { endCall(); return draw(); } if (x.num) { endCall(); return call(x.num); } draw();
  };
  t.api = { back: () => { if (body.querySelector('.callscr')) { endCall(); draw(); return true; } return false; } }; t.onclose = () => clearInterval(timer); draw();
}});

/* ---------- Messages ---------- */
mk('messages', { name: 'Messages', icon: '💬', bg: 'linear-gradient(135deg,#4a90f5,#1a56d6)',
render(body, t) {
  const people = [{ id: 'priya', n: 'Priya', e: '👩' }, { id: 'rahul', n: 'Rahul', e: '👨' }, { id: 'bot', n: 'Assistant', e: '🤖' }]; const chats = jget('a_msgs1', {}); let cur = null;
  const reply = s => { s = s.toLowerCase(); if (/hi|hello|hey|namaste/.test(s)) return 'Hello! 👋 Kaise ho?'; if (/time/.test(s)) return 'Abhi ' + new Date().toLocaleTimeString() + ' baj rahe hain.'; if (/joke/.test(s)) return 'Programmer ko chai kyu pasand hai? Kyunki usme "Java" hota hai ☕'; if (/thank/.test(s)) return 'Anytime! 😊'; return ['Interesting! 🙂', 'Achha, phir?', 'Haan bilkul.', 'Ye to mast hai!', 'Hmm, sochne wali baat hai 🤔'][Math.floor(Math.random() * 5)]; };
  const draw = () => {
    if (!cur) { body.innerHTML = `<div class="ab"><b>Messages</b></div>` + people.map(p => { const m = chats[p.id] || []; return `<div class="li" data-p="${p.id}"><div class="av">${p.e}</div><div class="grow"><b>${p.n}</b><small>${escH(m.length ? m[m.length - 1].t : 'Say hi!')}</small></div></div>`; }).join(''); return; }
    const p = people.find(x => x.id === cur), m = chats[cur] || [];
    body.innerHTML = `<div class="ab"><button data-back>‹</button><div class="av" style="width:32px;height:32px;font-size:15px">${p.e}</div><b>${p.n}</b></div><div class="ms"><div class="msb">${m.map(x => `<div class="mm ${x.me ? 'me' : ''}">${escH(x.t)}</div>`).join('') || '<div class="empty">Demo chat — messages stay in your browser.</div>'}</div><div class="msi"><input placeholder="Text message" autocomplete="off"><button class="btn pri" data-send>Send</button></div></div>`;
    const b = body.querySelector('.msb'); b.scrollTop = b.scrollHeight;
  };
  const send = () => { const i = body.querySelector('.msi input'), v = i.value.trim(); if (!v) return; const id = cur; (chats[id] = chats[id] || []).push({ me: true, t: v }); jset('a_msgs1', chats); draw(); body.querySelector('.msi input').focus();
    setTimeout(() => { (chats[id] = chats[id] || []).push({ me: false, t: reply(v) }); jset('a_msgs1', chats); if (body.isConnected && cur === id) { draw(); body.querySelector('.msi input').focus(); } else OS.notify('Messages', people.find(q => q.id === id).n, chats[id][chats[id].length - 1].t, '💬'); }, 900); };
  body.onclick = e => { const p = e.target.closest('[data-p]'); if (p) { cur = p.dataset.p; draw(); } if (e.target.closest('[data-back]')) { cur = null; draw(); } if (e.target.closest('[data-send]')) send(); };
  body.onkeydown = e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') send(); };
  t.api = { back: () => { if (cur) { cur = null; draw(); return true; } return false; } }; draw();
}});

/* ---------- Chrome ---------- */
mk('chrome', { name: 'Chrome', icon: '🌐', bg: '#fff', html: '<svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="10" fill="#ea4335"/><path d="M12 12L4.2 7.5A10 10 0 0 0 12 22z" fill="#34a853"/><path d="M12 12l7.8-4.5A10 10 0 0 0 12 2z" fill="#fbbc05" opacity="0"/><path d="M12 12h8.8A10 10 0 0 1 12 22z" fill="#fbbc05"/><circle cx="12" cy="12" r="4.2" fill="#fff"/><circle cx="12" cy="12" r="3" fill="#4285f4"/></svg>',
render(body, t, arg) {
  const home = `<body style="font-family:Roboto,Segoe UI,sans-serif;background:linear-gradient(135deg,#e8f1ff,#f6e9ff);display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:0 20px"><h1 style="font-weight:300;font-size:34px;color:#3a6df0">New tab</h1><p style="color:#666">Type a web address above. Some websites do not allow embedding — that is normal.</p></body>`;
  body.innerHTML = `<div class="ab"><button data-a="b">‹</button><input placeholder="Search or type URL"><button data-a="r">⟳</button></div><iframe class="web"></iframe>`;
  const fr = body.querySelector('iframe'), inp = body.querySelector('input'); let h = [], i = -1;
  const load = (u, push = true) => { if (!u) { fr.srcdoc = home; inp.value = ''; return; } if (!/^https?:\/\//.test(u)) u = u.includes('.') && !u.includes(' ') ? 'https://' + u : 'https://www.bing.com/search?q=' + encodeURIComponent(u); fr.removeAttribute('srcdoc'); fr.src = u; inp.value = u; if (push) { h = h.slice(0, i + 1); h.push(u); i++; } };
  inp.onkeydown = e => { if (e.key === 'Enter') load(inp.value.trim()); };
  body.querySelector('.ab').onclick = e => { const a = e.target.dataset.a; if (a === 'b' && i > 0) load(h[--i], false); if (a === 'r') fr.src = fr.src; };
  t.api = { back: () => { if (i > 0) { load(h[--i], false); return true; } return false; } }; load((arg && arg.url) || ''); if (arg && arg.focus) inp.focus();
}});

/* ---------- YouTube (embedded player or a video from your PC) ---------- */
mk('youtube', { name: 'YouTube', icon: '', bg: '#fff', html: '<svg viewBox="0 0 24 24" width="32" height="32"><rect x="1" y="5" width="22" height="14" rx="4.5" fill="#f00"/><path d="M10 9l5.5 3-5.5 3z" fill="#fff"/></svg>', dark: false,
render(body, t) {
  const VIDS = [{ id: 'aqz-KE-bpKQ', t: 'Big Buck Bunny', ch: 'Blender Foundation' }, { id: 'eRsGyueVLvQ', t: 'Sintel', ch: 'Blender Foundation' }, { id: 'R6MlUcmOul8', t: 'Tears of Steel', ch: 'Blender Foundation' }];
  let playing = null, full = false;
  const idOf = s => { const m = s.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(s) ? s : null); };
  const player = () => playing.local ? `<video controls autoplay playsinline src="${playing.url}"></video>` : `<iframe src="https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  const draw = () => {
    body.innerHTML = `<div class="yt ${playing ? 'hp' : ''}">${playing ? `<div class="yt-player">${player()}<div class="yt-ctl"><button data-a="rot" title="Rotate phone">⟳</button><button data-a="full" title="Full screen">⛶</button></div></div>` : ''}
      <div class="yt-list"><div class="ab"><span class="yt-logo"><i></i>YouTube</span></div>
      <div class="yt-row"><input class="yt-in" placeholder="Paste a YouTube link" style="height:36px;border-radius:18px;border:1px solid var(--bd);background:var(--bg2);color:var(--tx);padding:0 14px;outline:none"><button class="btn" data-a="pc" title="Play a video file from your PC">📁 My PC</button><input type="file" id="ytf" accept="video/*" hidden></div>
      <div class="hint" style="padding:0 16px 6px">Online videos need internet. If a video says “configuration error”, open the site from GitHub Pages or localhost, or use “My PC”.</div>
      ${VIDS.map((v, i) => `<div class="yt-card" data-v="${i}"><div class="yt-th"><img src="https://i.ytimg.com/vi/${v.id}/mqdefault.jpg" alt="" onerror="this.style.display='none'"></div><div><b>${v.t}</b><small>${v.ch}</small></div></div>`).join('')}</div></div>`;
    const yt = body.querySelector('.yt'); yt.classList.toggle('full', full);
  };
  const play = v => { playing = v; full = false; OS.setImmersive(false); draw(); };
  body.onclick = e => {
    const c = e.target.closest('[data-v]'), a = e.target.closest('[data-a]');
    if (c) return play({ id: VIDS[+c.dataset.v].id });
    if (!a) return; const k = a.dataset.a;
    if (k === 'rot') OS.rotate();
    if (k === 'full') { full = !full; body.querySelector('.yt').classList.toggle('full', full); OS.setImmersive(full); }
    if (k === 'pc') body.querySelector('#ytf').click();
  };
  body.onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('yt-in')) { const id = idOf(e.target.value.trim()); if (id) play({ id }); else OS.notify('YouTube', 'Invalid link', 'Paste a full YouTube link or an 11-character video id.', '▶️'); } };
  body.onchange = e => { if (e.target.id === 'ytf' && e.target.files[0]) play({ local: true, url: URL.createObjectURL(e.target.files[0]) }); };
  t.api = { back: () => { if (full) { full = false; body.querySelector('.yt').classList.remove('full'); OS.setImmersive(false); return true; } if (playing) { playing = null; draw(); return true; } return false; } };
  t.onclose = () => OS.setImmersive(false); draw();
}});

/* ---------- Camera ---------- */
mk('camera', { name: 'Camera', icon: '📷', bg: 'linear-gradient(135deg,#5f6368,#202124)', dark: true, bgc: '#000',
render(body, t) {
  body.innerHTML = `<div class="cam"><video autoplay playsinline muted></video><div class="m">Starting camera…</div><div class="bar"><div class="thumb" data-g></div><button class="shut" data-snap></button><span style="width:40px"></span></div></div>`;
  const v = body.querySelector('video'), m = body.querySelector('.m'), th = body.querySelector('.thumb'); let stream;
  const last = () => { const l = PHOTOS.list(); th.style.backgroundImage = l[0] ? `url("${l[0].data}")` : ''; }; last();
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) m.textContent = 'Camera is not available here (needs https or localhost).';
  else navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(s => { stream = s; v.srcObject = s; m.style.display = 'none'; }).catch(() => m.textContent = 'Camera permission denied or no camera found.');
  t.onclose = () => stream && stream.getTracks().forEach(x => x.stop());
  body.onclick = e => {
    if (e.target.closest('[data-g]')) return OS.open('gallery');
    if (e.target.closest('[data-snap]') && v.videoWidth) { const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0); shrink(c.toDataURL('image/jpeg', .9), 640, .7, d => { PHOTOS.add('Photo ' + new Date().toLocaleTimeString(), d); last(); }); }
  };
}});

/* ---------- Gallery ---------- */
mk('gallery', { name: 'Gallery', icon: '🖼️', bg: 'linear-gradient(135deg,#ffb74d,#e91e63)',
render(body, t) {
  let view = null; const items = () => [...PHOTOS.list().map((p, i) => ({ kind: 'photo', name: p.name, data: p.data })), ...wallIds().map(id => ({ kind: 'wall', id, name: wallInfo(id).name }))];
  const draw = () => {
    const l = items();
    if (view === null) { body.innerHTML = `<div class="ab"><b>Gallery</b><span class="sp"></span><button data-imp title="Import images from your PC">＋</button><input type="file" id="gf" accept="image/*" multiple hidden></div><div class="gal">${l.map((x, i) => `<i data-i="${i}"></i>`).join('')}</div>`; body.querySelectorAll('.gal i').forEach(el => { const x = l[+el.dataset.i]; if (x.kind === 'photo') el.style.backgroundImage = `url("${x.data}")`; else applyWall(el, x.id, 'fill'); }); return; }
    const x = l[view]; body.innerHTML = `<div class="ab"><button data-back>‹</button><b>${escH(x.name)}</b><span class="sp"></span><button class="btn pri" data-set>Set wallpaper</button></div><div class="gv"></div>`;
    const g = body.querySelector('.gv'); if (x.kind === 'photo') g.style.backgroundImage = `url("${x.data}")`; else applyWall(g, x.id, 'fit');
  };
  body.onclick = e => {
    const i = e.target.closest('[data-i]'); if (i) { view = +i.dataset.i; draw(); }
    if (e.target.closest('[data-back]')) { view = null; draw(); } if (e.target.closest('[data-imp]')) body.querySelector('#gf').click();
    if (e.target.closest('[data-set]')) { const x = items()[view]; if (x.kind === 'wall') OS.set({ wall: x.id }); else addWallData(x.name, x.data, (id, err) => id ? (OS.set({ wall: id }), OS.notify('Gallery', 'Wallpaper set', x.name, '🖼️')) : OS.notify('Gallery', 'Could not set wallpaper', err, '🖼️')); }
  };
  body.onchange = e => { if (e.target.id === 'gf') { let n = e.target.files.length; [...e.target.files].forEach(f => shrink(f, 640, .7, d => { PHOTOS.add(f.name, d); if (--n === 0) draw(); }, er => OS.notify('Gallery', 'Import failed', er, '🖼️'))); } };
  t.api = { back: () => { if (view !== null) { view = null; draw(); return true; } return false; } }; draw();
}});

/* ---------- Settings ---------- */
mk('settings', { name: 'Settings', icon: '⚙️', bg: 'linear-gradient(135deg,#78909c,#455a64)',
render(body, t) {
  let pane = null; const fits = [['fill', 'Fill'], ['fit', 'Fit'], ['stretch', 'Stretch'], ['center', 'Center'], ['tile', 'Tile']];
  const sw = (k, on) => `<div class="sw ${on ? 'on' : ''}" data-sw="${k}"></div>`;
  const list = [['network', '📶', 'Network & internet', 'Wi-Fi, Bluetooth, Airplane mode'], ['display', '🌓', 'Display', 'Dark theme, brightness, rotate'], ['wallpaper', '🖼️', 'Wallpaper & style', 'Pick or upload your own photo'], ['sound', '🔊', 'Sound & vibration', 'Volume'], ['about', '📱', 'About phone', 'Virtual Pixel']];
  const draw = () => {
    const s = OS.settings; let h = '';
    if (!pane) h = '<div class="ab"><b>Settings</b></div>' + list.map(x => `<div class="li" data-pane="${x[0]}"><div class="av" style="background:#e8f0fe;color:#1a73e8">${x[1]}</div><div class="grow"><b>${x[2]}</b><small>${x[3]}</small></div></div>`).join('');
    else {
      h = `<div class="ab"><button data-back>‹</button><b>${list.find(x => x[0] === pane)[2]}</b></div>`;
      if (pane === 'network') h += `<div class="row"><span>Wi-Fi<small>${s.wifi && !s.plane ? 'Connected to Virtual-WiFi' : 'Off'}</small></span>${sw('wifi', s.wifi && !s.plane)}</div><div class="row"><span>Bluetooth</span>${sw('bt', s.bt && !s.plane)}</div><div class="row"><span>Airplane mode</span>${sw('plane', s.plane)}</div>`;
      if (pane === 'display') h += `<div class="row"><span>Dark theme</span>${sw('dark', s.dark)}</div><div class="row"><span>Brightness</span><input type="range" id="br" min="30" max="100" value="${s.brightness}"></div><div class="row" data-rot><span>Rotate screen<small>Landscape is great for videos</small></span><button class="btn">Rotate</button></div>`;
      if (pane === 'wallpaper') h += `<div class="walls">${wallIds().map(id => `<div class="wall ${s.wall === id ? 'on' : ''}" data-wall="${id}">${wallInfo(id).custom ? `<button class="wdel" data-del="${id}">✕</button>` : ''}</div>`).join('')}<div class="wall add" data-add>＋<span>Your photo</span></div></div><input type="file" id="wf" accept="image/*" hidden><div class="row"><span>Fit (your photos)</span><select id="fit">${fits.map(f => `<option value="${f[0]}" ${s.fit === f[0] ? 'selected' : ''}>${f[1]}</option>`).join('')}</select></div><div class="hint" id="wm" style="padding:0 16px"></div>`;
      if (pane === 'sound') h += `<div class="row"><span>Media volume</span><input type="range" id="vol" min="0" max="100" value="${s.vol}"></div>`;
      if (pane === 'about') h += [['Device name', 'Virtual Pixel'], ['Software', 'Android (Virtual) 0.1'], ['Screen', '360 × 780 dp (rotates to landscape)'], ['Built with', 'HTML, CSS and JavaScript'], ['Note', 'Educational demo — not affiliated with Google']].map(r => `<div class="row" style="cursor:default"><span>${r[0]}<small>${r[1]}</small></span></div>`).join('');
    }
    body.innerHTML = h; body.querySelectorAll('.wall[data-wall]').forEach(el => applyWall(el, el.dataset.wall, 'fill'));
  };
  body.onclick = e => {
    const x = e.target.closest('[data-pane],[data-back],[data-sw],[data-wall],[data-del],[data-add],[data-rot]'); if (!x) return; const d = x.dataset;
    if (d.pane) pane = d.pane; if (d.back !== undefined) pane = null; if (d.rot !== undefined) return OS.rotate();
    if (d.sw) OS.set({ [d.sw]: !OS.settings[d.sw] }); if (d.wall) OS.set({ wall: d.wall });
    if (d.del) { e.stopPropagation(); CUSTOM_WALLS = CUSTOM_WALLS.filter(w => w.id !== d.del); saveWalls(); if (OS.settings.wall === d.del) OS.set({ wall: 'a1' }); }
    if (d.add !== undefined) return body.querySelector('#wf').click(); draw();
  };
  body.onchange = e => { if (e.target.id === 'fit') OS.set({ fit: e.target.value }); if (e.target.id === 'wf' && e.target.files[0]) addCustomWall(e.target.files[0], (id, err) => { if (id) { OS.set({ wall: id }); draw(); } else { const m = body.querySelector('#wm'); if (m) m.textContent = err; } }); };
  body.oninput = e => { if (e.target.id === 'br') OS.set({ brightness: +e.target.value }); if (e.target.id === 'vol') OS.set({ vol: +e.target.value }); };
  t.api = { back: () => { if (pane) { pane = null; draw(); return true; } return false; } }; draw();
}});

/* ---------- Clock ---------- */
mk('clock', { name: 'Clock', icon: '⏰', bg: 'linear-gradient(135deg,#5c6bc0,#283593)',
render(body, t) {
  let tab = 'clock', sw = { run: false, t0: 0, acc: 0 }, tm = { end: 0, mins: 5 };
  const zones = [['Local', undefined], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo']];
  const fmt = ms => { const q = Math.floor(ms / 10); return `${String(Math.floor(q / 6000)).padStart(2, '0')}:${String(Math.floor(q / 100) % 60).padStart(2, '0')}.${String(q % 100).padStart(2, '0')}`; };
  const draw = () => { body.innerHTML = `<div class="ab"><b>Clock</b></div><div class="ck">${['clock', 'stopwatch', 'timer'].map(x => `<button class="${x === tab ? 'on' : ''}" data-t="${x}">${x[0].toUpperCase() + x.slice(1)}</button>`).join('')}</div><div class="ckb" id="ckb"></div>`; upd(true); };
  const upd = full => {
    const el = body.querySelector('#ckb'); if (!el) return;
    if (tab === 'clock') { const d = new Date(), h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
      el.innerHTML = `<svg viewBox="0 0 120 120" width="150" height="150"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2"/>${[...Array(12)].map((_, i) => `<line x1="60" y1="8" x2="60" y2="${i % 3 ? 12 : 15}" stroke="currentColor" stroke-width="2" transform="rotate(${i * 30} 60 60)"/>`).join('')}<line x1="60" y1="60" x2="60" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round" transform="rotate(${h * 30 + m / 2} 60 60)"/><line x1="60" y1="60" x2="60" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round" transform="rotate(${m * 6} 60 60)"/><line x1="60" y1="66" x2="60" y2="14" stroke="#ea4335" stroke-width="1.5" transform="rotate(${s * 6} 60 60)"/></svg>
      <div style="width:100%;max-width:300px">${zones.map(z => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--bd)"><span>${z[0]}</span><b>${d.toLocaleTimeString([], { timeZone: z[1], hour: '2-digit', minute: '2-digit' })}</b></div>`).join('')}</div>`; }
    else if (tab === 'stopwatch') { if (full || !el.querySelector('.big')) el.innerHTML = `<div class="big"></div><div><button class="btn pri" data-sw="go">${sw.run ? 'Pause' : 'Start'}</button> <button class="btn" data-sw="reset">Reset</button></div>`; el.querySelector('.big').textContent = fmt(sw.acc + (sw.run ? Date.now() - sw.t0 : 0)); }
    else { const left = tm.end ? Math.max(0, tm.end - Date.now()) : tm.mins * 60000; if (tm.end && left === 0) { tm.end = 0; OS.notify('Clock', 'Timer finished', tm.mins + ' minute timer is done.', '⏰'); }
      if (full || !el.querySelector('.big')) el.innerHTML = `<div class="big"></div><div>${tm.end ? '' : 'Minutes <input type="number" id="tmin" min="1" max="180" value="' + tm.mins + '" style="width:60px"> '}<button class="btn pri" data-tm="go">${tm.end ? 'Cancel' : 'Start'}</button></div>`; el.querySelector('.big').textContent = fmt(left); }
  };
  body.onclick = e => { const d = e.target.dataset;
    if (d.t) { tab = d.t; draw(); } if (d.sw === 'go') { if (sw.run) { sw.acc += Date.now() - sw.t0; sw.run = false; } else { sw.t0 = Date.now(); sw.run = true; } draw(); }
    if (d.sw === 'reset') { sw = { run: false, t0: 0, acc: 0 }; draw(); } if (d.tm === 'go') { if (tm.end) tm.end = 0; else { tm.mins = Math.max(1, +body.querySelector('#tmin').value || 1); tm.end = Date.now() + tm.mins * 60000; } draw(); } };
  const iv = setInterval(() => upd(false), 150); t.onclose = () => clearInterval(iv); draw();
}});

/* ---------- Calculator ---------- */
mk('calculator', { name: 'Calculator', icon: '🧮', bg: 'linear-gradient(135deg,#26a69a,#00695c)', dark: true, bgc: '#101215',
render(body) {
  const keys = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
  body.innerHTML = `<div class="calc"><div class="calc-d"><div class="calc-e"></div><div class="calc-v">0</div></div><div class="calc-k">${keys.map(k => `<button class="${'AC±%÷×−+'.includes(k) && k !== '+' || k === '+' ? 'o' : ''} ${k === '=' ? 'eq' : ''} ${k === '0' ? 'z' : ''}">${k}</button>`).join('')}</div></div>`;
  const ex = body.querySelector('.calc-e'), d = body.querySelector('.calc-v'); let cur = '0', acc = null, op = null, fresh = false;
  const f = (a, b, o) => o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : o === '÷' ? (b === 0 ? NaN : a / b) : b; const fm = n => isNaN(n) ? 'Error' : String(+n.toPrecision(10));
  body.querySelector('.calc-k').onclick = e => { const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return;
    if (/^\d$/.test(k)) { cur = (cur === '0' || fresh) ? k : cur + k; fresh = false; } else if (k === '.') { if (fresh) { cur = '0'; fresh = false; } if (!cur.includes('.')) cur += '.'; }
    else if (k === 'AC') { cur = '0'; acc = op = null; ex.textContent = ''; } else if (k === '±') cur = String(-parseFloat(cur)); else if (k === '%') cur = String(parseFloat(cur) / 100);
    else if (k === '=') { if (op !== null) { ex.textContent = `${acc} ${op} ${cur}`; cur = fm(f(acc, parseFloat(cur), op)); acc = op = null; fresh = true; } }
    else { if (op !== null && !fresh) { acc = f(acc, parseFloat(cur), op); cur = fm(acc); } else acc = parseFloat(cur); op = k; ex.textContent = `${acc} ${k}`; fresh = true; }
    d.textContent = cur; d.style.fontSize = cur.length > 9 ? '30px' : '44px'; };
}});

/* ---------- Calendar ---------- */
mk('calendar', { name: 'Calendar', icon: '', bg: '#fff', html: () => { const d = new Date(); return `<span style="display:flex;flex-direction:column;align-items:center;line-height:1"><span style="font-size:10px;color:#1a73e8;font-weight:700">${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][d.getMonth()]}</span><span style="font-size:24px;color:#202124">${d.getDate()}</span></span>`; },
render(body) {
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; const evs = jget('a_events1', {}), now = new Date(); let off = 0, sel = now.toDateString();
  const draw = () => {
    const v = new Date(now.getFullYear(), now.getMonth() + off, 1), st = new Date(v); st.setDate(1 - v.getDay());
    let c = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(x => `<b>${x}</b>`).join('');
    for (let i = 0; i < 42; i++) { const d = new Date(st); d.setDate(st.getDate() + i); const k = d.toDateString(); c += `<span class="${d.getMonth() !== v.getMonth() ? 'dim' : ''} ${k === now.toDateString() ? 't' : ''} ${k === sel ? 's' : ''} ${(evs[k] || []).length ? 'ev' : ''}" data-k="${k}">${d.getDate()}</span>`; }
    body.innerHTML = `<div class="ab"><b>${MN[v.getMonth()]} ${v.getFullYear()}</b><span class="sp"></span><button data-n="-">‹</button><button data-n="+">›</button></div><div class="cal"><div class="cal-g">${c}</div><div class="cal-ev"><b>${escH(sel)}</b>${(evs[sel] || []).map((x, i) => `<div>${escH(x)}<button data-x="${i}">✕</button></div>`).join('') || '<div class="hint">No events</div>'}</div></div><button class="fab" data-add>＋</button>`;
  };
  body.onclick = e => { const x = e.target.closest('[data-k],[data-n],[data-x],[data-add]'); if (!x) return; const d = x.dataset; if (d.k) sel = d.k; if (d.n === '-') off--; if (d.n === '+') off++;
    if (d.add !== undefined) { const s = prompt('Event title:'); if (s) (evs[sel] = evs[sel] || []).push(s); } if (d.x !== undefined) evs[sel].splice(+d.x, 1); jset('a_events1', evs); draw(); };
  draw();
}});

/* ---------- Notes ---------- */
mk('notes', { name: 'Notes', icon: '📝', bg: 'linear-gradient(135deg,#ffd54f,#f9a825)',
render(body, t) {
  let notes = jget('a_notes1', [{ id: 1, text: 'Welcome to Notes\nEverything you type is saved in your browser.', t: Date.now() }]), cur = null; const save = () => jset('a_notes1', notes);
  const title = n => (n.text.split('\n')[0] || 'New note').slice(0, 40);
  const draw = () => {
    if (cur === null) { body.innerHTML = `<div class="ab"><b>Notes</b></div>${notes.map(n => `<div class="li" data-id="${n.id}"><div class="av" style="background:#fff3c4;color:#b06f00">📝</div><div class="grow"><b>${escH(title(n))}</b><small>${new Date(n.t).toLocaleDateString()}</small></div></div>`).join('') || '<div class="empty">No notes</div>'}<button class="fab" data-new>＋</button>`; return; }
    const n = notes.find(x => x.id === cur); body.innerHTML = `<div class="ab"><button data-back>‹</button><b>Note</b><span class="sp"></span><button data-del title="Delete">🗑</button></div><div class="nt"><textarea placeholder="Start typing…">${escH(n.text)}</textarea></div>`;
  };
  body.onclick = e => { const x = e.target.closest('[data-id],[data-new],[data-back],[data-del]'); if (!x) return; const d = x.dataset;
    if (d.id) { cur = +d.id; draw(); } if (d.new !== undefined) { const n = { id: Date.now(), text: '', t: Date.now() }; notes.unshift(n); cur = n.id; save(); draw(); body.querySelector('textarea').focus(); }
    if (d.back !== undefined) { cur = null; draw(); } if (d.del !== undefined) { notes = notes.filter(n => n.id !== cur); cur = null; save(); draw(); } };
  body.oninput = e => { if (e.target.tagName !== 'TEXTAREA') return; const n = notes.find(x => x.id === cur); if (n) { n.text = e.target.value; n.t = Date.now(); save(); } };
  t.api = { back: () => { if (cur !== null) { cur = null; draw(); return true; } return false; } }; draw();
}});

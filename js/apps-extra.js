/* ===== Extra apps: Mail, Calendar, Store, Photos, Clock, Camera, Weather, Recycle Bin ===== */
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- Mail ---------- */
APPS.mail = { name: 'Mail', icon: '✉️', w: 860, h: 520,
render(body, win) {
  const boxes = { Inbox: [
    { f: 'Windows 11 Web Team', s: 'Welcome to your new PC 🎉', t: 'Hi Student,\n\nWelcome to Windows 11 Web. This is a demo mailbox — no real emails are sent or received.\n\nHave fun exploring!' },
    { f: 'Microsoft Store', s: 'New apps this week', t: 'Check out new demo apps in the Store.\nOpen Start > Microsoft Store.' },
    { f: 'Learning Club', s: 'Your HTML/CSS/JS practice task', t: 'Tip: open js/apps.js and add your own app to the APPS object. It will appear in the Start menu automatically.' },
    { f: 'Windows Security', s: 'Virus protection is out of date', t: 'Tap the notification in the taskbar to update Microsoft Defender Antivirus (demo).' }],
    Sent: [], Drafts: [] };
  let box = 'Inbox', cur = 0;
  const draw = () => {
    const list = boxes[box];
    body.innerHTML = `<div class="ml"><div class="ml-side"><button class="btn primary" data-c="new">✏️ New mail</button>${Object.keys(boxes).map(b => `<div class="${b === box ? 'on' : ''}" data-b="${b}">${b} <small>${boxes[b].length || ''}</small></div>`).join('')}</div>
      <div class="ml-list">${list.length ? list.map((m, i) => `<div class="ml-it ${i === cur ? 'on' : ''}" data-i="${i}"><b>${escH(m.f)}</b><div>${escH(m.s)}</div><small>${escH(m.t.slice(0, 40))}…</small></div>`).join('') : '<div class="fx-empty">Nothing here.</div>'}</div>
      <div class="ml-read">${list[cur] ? `<h3>${escH(list[cur].s)}</h3><div class="ml-from">${escH(list[cur].f)}</div><pre>${escH(list[cur].t)}</pre>` : ''}</div></div>`;
  };
  body.onclick = e => {
    const b = e.target.closest('[data-b]'), i = e.target.closest('[data-i]');
    if (b) { box = b.dataset.b; cur = 0; draw(); }
    if (i) { cur = +i.dataset.i; draw(); }
    if (e.target.dataset.c === 'new') {
      const to = prompt('To:', 'friend@example.com'); if (!to) return;
      const sub = prompt('Subject:', 'Hello'); if (sub === null) return;
      const txt = prompt('Message:', 'Hi!'); if (txt === null) return;
      boxes.Sent.unshift({ f: 'To: ' + to, s: sub, t: txt }); box = 'Sent'; cur = 0; draw(); OS.notify('Mail', 'Message sent', 'Demo only — nothing was actually sent.');
    }
  };
  draw();
}};

/* ---------- Calendar ---------- */
APPS.calendar = { name: 'Calendar', icon: '📅', w: 820, h: 540, single: true,
render(body, win) {
  const MN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const evs = jget('w11_events', {}), now = new Date();
  let off = 0, sel = now.toDateString();
  const draw = () => {
    const v = new Date(now.getFullYear(), now.getMonth() + off, 1), st = new Date(v); st.setDate(1 - v.getDay());
    let cells = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cl-h">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = new Date(st); d.setDate(st.getDate() + i); const k = d.toDateString();
      cells += `<div class="cl-d ${d.getMonth() !== v.getMonth() ? 'dim' : ''} ${k === now.toDateString() ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-k="${k}">${d.getDate()}${(evs[k] || []).length ? '<i></i>' : ''}</div>`;
    }
    body.innerHTML = `<div class="cl"><div class="cl-main"><div class="cl-bar"><b>${MN[v.getMonth()]} ${v.getFullYear()}</b><span><button class="btn" data-n="0">Today</button> <button class="btn" data-n="-">◀</button> <button class="btn" data-n="+">▶</button></span></div><div class="cl-grid">${cells}</div></div>
      <div class="cl-side"><h3>${escH(sel)}</h3>${(evs[sel] || []).map((t, i) => `<div class="cl-ev">${escH(t)}<button data-x="${i}">✕</button></div>`).join('') || '<div class="hint">No events.</div>'}<button class="btn primary" data-add>＋ Add event</button></div></div>`;
  };
  body.onclick = e => {
    const d = e.target.dataset, k = e.target.closest('[data-k]');
    if (k) sel = k.dataset.k;
    if (d.n === '0') { off = 0; sel = now.toDateString(); } if (d.n === '-') off--; if (d.n === '+') off++;
    if (d.add !== undefined) { const t = prompt('Event title:'); if (t) (evs[sel] = evs[sel] || []).push(t); }
    if (d.x !== undefined) evs[sel].splice(+d.x, 1);
    jset('w11_events', evs); draw();
  };
  draw();
}};

/* ---------- Microsoft Store (demo) ---------- */
APPS.store = { name: 'Microsoft Store', icon: '🛍️', w: 860, h: 540, single: true,
render(body, win) {
  const items = [['🎵', 'Spotify', 'Music'], ['💬', 'WhatsApp', 'Social'], ['🎬', 'Netflix', 'Entertainment'], ['📝', 'Notion', 'Productivity'], ['🎮', 'Minecraft', 'Games'], ['🧑‍💻', 'VS Code', 'Developer tools'], ['🎨', 'Figma', 'Design'], ['📹', 'Zoom', 'Business'], ['🐍', 'Python', 'Developer tools'], ['🗺️', 'Maps', 'Travel']];
  const inst = jget('w11_store', []);
  const draw = () => {
    body.innerHTML = `<div class="st"><div class="st-hero"><h2>Microsoft Store</h2><p>Demo store — apps are simulated for learning.</p></div><div class="st-grid">${items.map((a, i) => `<div class="st-card"><span>${a[0]}</span><b>${a[1]}</b><small>${a[2]}</small><button class="btn ${inst.includes(a[1]) ? '' : 'primary'}" data-i="${i}">${inst.includes(a[1]) ? 'Installed ✓' : 'Get'}</button></div>`).join('')}</div></div>`;
  };
  body.onclick = e => {
    const i = e.target.dataset.i; if (i === undefined) return;
    const a = items[i]; if (inst.includes(a[1])) return;
    e.target.textContent = 'Installing…'; e.target.disabled = true;
    setTimeout(() => { inst.push(a[1]); jset('w11_store', inst); if (body.isConnected) draw(); OS.notify('Microsoft Store', a[1] + ' installed', 'This is a simulated install (demo).'); }, 1400);
  };
  draw();
}};

/* ---------- Photos ---------- */
APPS.photos = { name: 'Photos', icon: '🏞️', w: 880, h: 560,
render(body, win) {
  const extra = []; let cur = -1;
  const all = () => [...wallIds().map(id => ({ id, name: wallInfo(id).name })), ...extra];
  const paint = (el, it, fit) => { if (it.id) applyWall(el, it.id, fit); else { el.style.backgroundImage = `url("${it.url}")`; el.style.backgroundSize = fit === 'fit' ? 'contain' : 'cover'; el.style.backgroundPosition = 'center'; el.style.backgroundRepeat = 'no-repeat'; el.style.backgroundColor = '#000'; } };
  const draw = () => {
    const l = all();
    if (cur < 0) body.innerHTML = `<div class="ph"><div class="ph-bar"><b>Photos</b><span><button class="btn primary" data-o>📂 Open from PC</button></span><input type="file" id="pf" accept="image/*" multiple hidden></div><div class="ph-grid">${l.map((it, i) => `<div class="ph-th" data-i="${i}" title="${escH(it.name)}"></div>`).join('')}</div></div>`;
    else body.innerHTML = `<div class="ph"><div class="ph-bar"><button class="btn" data-back>← Back</button><b>${escH(l[cur].name)}</b><span><button class="btn" data-prev>◀</button> <button class="btn" data-next>▶</button> <button class="btn primary" data-set>Set as background</button></span></div><div class="ph-view"></div></div>`;
    if (cur < 0) body.querySelectorAll('.ph-th').forEach(el => paint(el, l[+el.dataset.i], 'fill')); else paint(body.querySelector('.ph-view'), l[cur], 'fit');
  };
  body.onclick = e => {
    const d = e.target.dataset, th = e.target.closest('[data-i]'), l = all();
    if (th) cur = +th.dataset.i;
    if (d.back !== undefined) cur = -1;
    if (d.prev !== undefined) cur = (cur - 1 + l.length) % l.length;
    if (d.next !== undefined) cur = (cur + 1) % l.length;
    if (d.o !== undefined) return body.querySelector('#pf').click();
    if (d.set !== undefined) { const it = l[cur]; if (it.id) OS.set({ wall: it.id }); else addCustomWall(it.file, (id, err) => id ? (OS.set({ wall: id }), OS.notify('Photos', 'Background changed', it.name)) : OS.notify('Photos', 'Could not set background', err)); return; }
    draw();
  };
  body.onchange = e => { if (e.target.id === 'pf') { [...e.target.files].forEach(f => extra.push({ name: f.name, file: f, url: URL.createObjectURL(f) })); draw(); } };
  draw();
}};

/* ---------- Clock ---------- */
APPS.clock = { name: 'Clock', icon: '⏰', w: 480, h: 520, single: true,
render(body, win) {
  let tab = 'world', sw = { run: false, t0: 0, acc: 0 }, tm = { end: 0, mins: 5 };
  const zones = [['Local', undefined], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo'], ['Sydney', 'Australia/Sydney']];
  const fmt = ms => { const t = Math.floor(ms / 10), c = t % 100, s = Math.floor(t / 100) % 60, m = Math.floor(t / 6000); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`; };
  const draw = () => {
    const tabs = ['world', 'stopwatch', 'timer'];
    body.innerHTML = `<div class="ck"><div class="ck-tabs">${tabs.map(t => `<button class="${t === tab ? 'on' : ''}" data-t="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div><div class="ck-body" id="ckb"></div></div>`;
    upd(true);
  };
  const upd = full => {
    const el = body.querySelector('#ckb'); if (!el) return;
    if (tab === 'world') {
      const d = new Date(), h = d.getHours() % 12, m = d.getMinutes(), s = d.getSeconds();
      el.innerHTML = `<svg viewBox="0 0 120 120" width="190" height="190"><circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="2"/>${[...Array(12)].map((_, i) => `<line x1="60" y1="8" x2="60" y2="${i % 3 ? 12 : 15}" stroke="currentColor" stroke-width="2" transform="rotate(${i * 30} 60 60)"/>`).join('')}
        <line x1="60" y1="60" x2="60" y2="32" stroke="currentColor" stroke-width="4" stroke-linecap="round" transform="rotate(${h * 30 + m / 2} 60 60)"/><line x1="60" y1="60" x2="60" y2="20" stroke="currentColor" stroke-width="3" stroke-linecap="round" transform="rotate(${m * 6} 60 60)"/><line x1="60" y1="66" x2="60" y2="14" stroke="#e81123" stroke-width="1.5" transform="rotate(${s * 6} 60 60)"/></svg>
        <div class="ck-zones">${zones.map(z => `<div><span>${z[0]}</span><b>${d.toLocaleTimeString([], { timeZone: z[1], hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></div>`).join('')}</div>`;
    } else if (tab === 'stopwatch') {
      const ms = sw.acc + (sw.run ? Date.now() - sw.t0 : 0);
      if (full || !el.querySelector('.ck-big')) el.innerHTML = `<div class="ck-big"></div><div><button class="btn primary" data-sw="go">${sw.run ? 'Pause' : 'Start'}</button> <button class="btn" data-sw="reset">Reset</button></div>`;
      el.querySelector('.ck-big').textContent = fmt(ms);
    } else {
      const left = tm.end ? Math.max(0, tm.end - Date.now()) : tm.mins * 60000;
      if (tm.end && left === 0) { tm.end = 0; OS.notify('Clock', 'Timer finished', `${tm.mins} minute timer is done.`); }
      if (full || !el.querySelector('.ck-big')) el.innerHTML = `<div class="ck-big"></div><div>${tm.end ? '' : 'Minutes: <input type="number" id="tmin" min="1" max="180" value="' + tm.mins + '" style="width:70px"> '}<button class="btn primary" data-tm="go">${tm.end ? 'Cancel' : 'Start'}</button></div>`;
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
  const iv = setInterval(() => upd(false), 100); win.onclose = () => clearInterval(iv);
  draw();
}};

/* ---------- Camera ---------- */
APPS.camera = { name: 'Camera', icon: '📷', w: 640, h: 500, single: true,
render(body, win) {
  body.innerHTML = `<div class="cam"><video autoplay playsinline muted></video><div class="cam-msg">Starting camera…</div><div class="cam-bar"><button class="btn primary" data-snap>📸 Take photo</button></div><div class="cam-shots"></div></div>`;
  const v = body.querySelector('video'), msg = body.querySelector('.cam-msg'), shots = body.querySelector('.cam-shots');
  let stream;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) msg.textContent = 'Camera is not available in this browser / context (needs https or localhost).';
  else navigator.mediaDevices.getUserMedia({ video: true }).then(s => { stream = s; v.srcObject = s; msg.style.display = 'none'; }).catch(() => msg.textContent = 'Camera permission was denied or no camera was found.');
  win.onclose = () => stream && stream.getTracks().forEach(t => t.stop());
  body.onclick = e => {
    if (e.target.dataset.snap === undefined || !v.videoWidth) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
    const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'photo-' + Date.now() + '.png';
    a.innerHTML = `<img src="${a.href}" height="60">`; shots.prepend(a); OS.notify('Camera', 'Photo captured', 'Click the thumbnail to download it.');
  };
}};

/* ---------- Weather (demo data) ---------- */
APPS.weather = { name: 'Weather', icon: '⛅', w: 560, h: 500, single: true,
render(body, win) {
  const cities = ['Delhi', 'Mumbai', 'Patna', 'Bengaluru', 'London', 'New York', 'Tokyo'], cond = [['☀️', 'Sunny'], ['⛅', 'Partly cloudy'], ['☁️', 'Cloudy'], ['🌧️', 'Rain'], ['⛈️', 'Thunderstorm']];
  const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const draw = c => {
    const h = hash(c + new Date().toDateString()), t = 14 + h % 22, now = cond[h % 5];
    body.innerHTML = `<div class="wx"><select id="wxc">${cities.map(x => `<option ${x === c ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <div class="wx-now"><span>${now[0]}</span><b>${t}°C</b><div>${now[1]}</div></div>
      <div class="wx-days">${['Tomorrow', '+2', '+3', '+4', '+5'].map((d, i) => { const x = hash(c + d), k = cond[x % 5]; return `<div><small>${d}</small><span>${k[0]}</span><b>${14 + x % 22}°</b></div>`; }).join('')}</div>
      <small class="hint">Demo data generated locally — not a real forecast.</small></div>`;
  };
  body.onchange = e => { if (e.target.id === 'wxc') draw(e.target.value); };
  draw('Delhi');
}};

/* ---------- Recycle Bin ---------- */
APPS.recycle = { name: 'Recycle Bin', icon: '♻️', w: 640, h: 420, single: true,
render(body, win) {
  const draw = () => {
    const bin = FS.bin();
    body.innerHTML = `<div class="rb"><div class="ph-bar"><b>Recycle Bin</b><span><button class="btn" data-empty ${bin.length ? '' : 'disabled'}>Empty Recycle Bin</button></span></div>
      <div class="rb-list">${bin.length ? bin.map((b, i) => `<div class="rb-it"><span>${typeof b.val === 'object' ? '📁' : '📄'} ${escH(b.name)}</span><small>${escH(b.path.join(' › '))}</small><button class="btn" data-r="${i}">Restore</button> <button class="btn" data-d="${i}">Delete</button></div>`).join('') : '<div class="fx-empty">Recycle Bin is empty.</div>'}</div></div>`;
  };
  body.onclick = e => {
    const d = e.target.dataset, bin = FS.bin();
    if (d.empty !== undefined && confirm('Permanently delete all items?')) bin.length = 0;
    if (d.d !== undefined) bin.splice(+d.d, 1);
    if (d.r !== undefined) { const b = bin[+d.r], dir = FS.get(b.path); if (dir) { dir[b.name in dir ? b.name + ' (restored)' : b.name] = b.val; bin.splice(+d.r, 1); } else OS.notify('Recycle Bin', 'Cannot restore', 'The original folder no longer exists.'); }
    FS.save(); draw();
  };
  draw();
}};

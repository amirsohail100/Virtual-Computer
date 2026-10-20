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
      let h = ''; for (let i = 0; i < 36; i++) { const c = `hsl(${i * 37 % 360},70%,${55 + i % 3 * 8}%)`; h += `<div data-c="${c}" style="background:${c}"></div>`; }
      b.innerHTML = `<h1 class="lt">Photos</h1><div class="sc" style="padding:0"><div class="ph">${h}</div></div><div class="big" hidden></div>`;
      const big = $('.big', b);
      b.onclick = e => { const c = e.target.closest('[data-c]'); if (c) { big.style.background = c.dataset.c; big.hidden = false; } else if (e.target === big) big.hidden = true; };
      t.api.back = () => { if (!big.hidden) { big.hidden = true; return true; } };
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
      const draw = () => { const s = OS.settings, row = (n, k) => `<div class="row">${n}${tg(k, s[k])}</div>`;
        b.innerHTML = `<h1 class="lt">Settings</h1><div class="sc"><div class="grp">${row('Airplane Mode', 'plane')}${row('Wi‑Fi', 'wifi')}${row('Bluetooth', 'bt')}${row('Cellular', 'cell')}${row('Personal Hotspot', 'hot')}</div><div class="grp">${row('Do Not Disturb', 'dnd')}${row('Dark Mode', 'dark')}<div class="row">Brightness<input type="range" id="br" min="30" max="100" value="${s.brightness}"></div></div><div class="grp"><div class="row">Name<small>iPhone</small></div><div class="row">Software Version<small>iOS (Virtual)</small></div></div></div>`; };
      draw(); t.api.sync = () => { const a = document.activeElement; if (!(a && a.type === 'range' && b.contains(a))) draw(); };
      b.onclick = e => { const g = e.target.closest('.tg'); if (g) OS.set({ [g.dataset.k]: !OS.settings[g.dataset.k] }); };
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

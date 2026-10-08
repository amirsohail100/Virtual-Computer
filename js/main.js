/* ===== Windows 11 Web — OS core: windows, taskbar, start menu, settings ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const OS = (() => {
  const wins = new Map();
  let z = 10, counter = 0, focused = null;
  const pinned = ['explorer', 'edge', 'notepad', 'calc', 'paint', 'terminal', 'settings'];
  const desktopIcons = [['🖥️', 'This PC', 'explorer', { path: [] }], ['📁', 'Documents', 'explorer', null], ['🌐', 'Microsoft Edge', 'edge'],
                        ['📝', 'Notepad', 'notepad'], ['⬛', 'Terminal', 'terminal'], ['🗑️', 'Recycle Bin', null]];

  /* ---------- Settings ---------- */
  let settings = { dark: false, wall: '1', accent: '#0067c0', brightness: 100 };
  try { settings = { ...settings, ...JSON.parse(localStorage.getItem('w11_settings')) }; } catch (e) {}
  function apply() {
    document.body.classList.toggle('dark', settings.dark);
    document.documentElement.style.setProperty('--accent', settings.accent);
    $('#desktop').dataset.wall = settings.wall;
    $('#dim').style.background = `rgba(0,0,0,${(100 - settings.brightness) / 140})`;
    $('#brightness').value = settings.brightness;
    $('[data-q=dark]').classList.toggle('on', settings.dark);
  }
  function set(patch) { Object.assign(settings, patch); localStorage.setItem('w11_settings', JSON.stringify(settings)); apply(); }

  /* ---------- Window manager ---------- */
  function open(id, arg) {
    const app = APPS[id]; if (!app) return;
    if (app.single) for (const w of wins.values()) if (w.app === id) { restore(w); return w; }
    const n = counter++, el = document.createElement('div');
    el.className = 'win';
    const w = { id: 'w' + n, app: id, el, min: false, max: false, title: app.name };
    el.style.width = Math.min(app.w || 640, innerWidth - 16) + 'px';
    el.style.height = Math.min(app.h || 420, innerHeight - 70) + 'px';
    el.style.left = Math.max(0, Math.min(60 + (n % 8) * 28, innerWidth - 300)) + 'px';
    el.style.top = (24 + (n % 8) * 28) + 'px';
    el.innerHTML = `<div class="tb"><span class="ti">${app.icon}</span><span class="tt">${app.name}</span><div class="tc"><button class="mn" title="Minimize">—</button><button class="mx" title="Maximize">▢</button><button class="cl" title="Close">✕</button></div></div><div class="wb"></div><div class="rz"></div>`;
    w.setTitle = t => { w.title = t; $('.tt', el).textContent = t; renderTaskbar(); };
    $('#windows').appendChild(el);
    wins.set(w.id, w);
    el.addEventListener('pointerdown', () => focus(w), true);
    $('.mn', el).onclick = () => minimize(w);
    $('.mx', el).onclick = () => toggleMax(w);
    $('.cl', el).onclick = () => close(w.id);
    $('.tb', el).ondblclick = e => { if (!e.target.closest('.tc')) toggleMax(w); };
    dragify(w); resizify(w);
    app.render($('.wb', el), w, arg);
    focus(w); renderTaskbar();
    return w;
  }
  function focus(w) {
    if (w.min) { w.min = false; w.el.style.display = ''; }
    w.el.style.zIndex = ++z; focused = w.id;
    wins.forEach(o => o.el.classList.toggle('active', o === w));
    renderTaskbar();
  }
  function restore(w) { focus(w); }
  function minimize(w) {
    w.min = true; w.el.style.display = 'none';
    const next = [...wins.values()].filter(o => !o.min).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0];
    focused = next ? next.id : null; wins.forEach(o => o.el.classList.toggle('active', o === next)); renderTaskbar();
  }
  function toggleMax(w) { w.max = !w.max; w.el.classList.toggle('max', w.max); $('.mx', w.el).textContent = w.max ? '❐' : '▢'; }
  function close(id) {
    const w = wins.get(id); if (!w) return;
    if (w.onclose) w.onclose();
    w.el.remove(); wins.delete(id); if (focused === id) focused = null; renderTaskbar();
  }
  function dragify(w) {
    const tb = $('.tb', w.el);
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.tc')) return;
      let sx = e.clientX, sy = e.clientY;
      if (w.max) { // drag se un-maximize
        toggleMax(w); w.el.style.left = (e.clientX - w.el.offsetWidth / 2) + 'px'; w.el.style.top = '0px';
      }
      const ox = parseFloat(w.el.style.left) || 0, oy = parseFloat(w.el.style.top) || 0;
      tb.setPointerCapture(e.pointerId);
      const mv = ev => { w.el.style.left = (ox + ev.clientX - sx) + 'px'; w.el.style.top = Math.max(0, oy + ev.clientY - sy) + 'px'; };
      const up = () => { tb.removeEventListener('pointermove', mv); tb.removeEventListener('pointerup', up); };
      tb.addEventListener('pointermove', mv); tb.addEventListener('pointerup', up);
    });
  }
  function resizify(w) {
    const h = $('.rz', w.el);
    h.addEventListener('pointerdown', e => {
      e.stopPropagation(); focus(w); h.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight;
      const mv = ev => { w.el.style.width = Math.max(260, ow + ev.clientX - sx) + 'px'; w.el.style.height = Math.max(160, oh + ev.clientY - sy) + 'px'; };
      const up = () => { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); };
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up);
    });
  }

  /* ---------- Taskbar ---------- */
  function renderTaskbar() {
    const ids = [...pinned];
    wins.forEach(w => { if (!ids.includes(w.app)) ids.push(w.app); });
    $('#taskApps').innerHTML = ids.map(id => {
      const ws = [...wins.values()].filter(w => w.app === id);
      const cls = ws.length ? ' open' + (ws.some(w => w.id === focused && !w.min) ? ' focus' : '') : '';
      return `<button class="tapp${cls}" data-app="${id}" title="${APPS[id].name}">${APPS[id].icon}</button>`;
    }).join('');
  }
  $('#taskApps').addEventListener('click', e => {
    const b = e.target.closest('.tapp'); if (!b) return;
    const id = b.dataset.app, ws = [...wins.values()].filter(w => w.app === id);
    closeFlyouts();
    if (!ws.length) return open(id);
    const top = ws.sort((a, c) => c.el.style.zIndex - a.el.style.zIndex)[0];
    (top.id === focused && !top.min) ? minimize(top) : focus(top);
  });

  /* ---------- Flyouts ---------- */
  const flyouts = ['#start', '#quick', '#calendar'];
  function closeFlyouts(except) { flyouts.forEach(f => { if (f !== except) $(f).classList.add('hidden'); }); $('#ctx').classList.add('hidden'); }
  function toggle(sel) { const el = $(sel), was = el.classList.contains('hidden'); closeFlyouts(); el.classList.toggle('hidden', !was); return was; }

  function buildStart() {
    const apps = Object.entries(APPS).filter(([id]) => id !== 'notepad' || true);
    const item = ([id, a]) => `<button class="gitem" data-app="${id}"><span class="em">${a.icon}</span>${a.name}</button>`;
    $('#pinnedGrid').innerHTML = apps.map(item).join('');
    $('#recList').innerHTML = [['📄', 'readme.txt'], ['📄', 'todo.txt']].map(r => `<button class="recitem" data-file="${r[1]}"><span class="em">${r[0]}</span>${r[1]}</button>`).join('');
  }
  $('#start').addEventListener('click', e => {
    const g = e.target.closest('[data-app]'), f = e.target.closest('[data-file]');
    if (g) { open(g.dataset.app); closeFlyouts(); }
    if (f) { const p = [...HOME, 'Documents'], n = f.dataset.file; open('notepad', { name: n, path: p, content: FS.get(p)[n] }); closeFlyouts(); }
  });
  $('#startSearch').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    $$('#pinnedGrid .gitem').forEach(b => b.style.display = b.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
  $('#startSearch').addEventListener('keydown', e => {
    if (e.key === 'Enter') { const v = $$('#pinnedGrid .gitem').find(b => b.style.display !== 'none'); if (v) { open(v.dataset.app); closeFlyouts(); } }
  });
  $('#startBtn').onclick = e => { e.stopPropagation(); if (toggle('#start')) { $('#startSearch').value = ''; $('#startSearch').dispatchEvent(new Event('input')); $('#startSearch').focus(); } };
  $('#searchBtn').onclick = e => { e.stopPropagation(); if (toggle('#start')) $('#startSearch').focus(); };
  $('#trayQuick').onclick = e => { e.stopPropagation(); toggle('#quick'); };
  $('#trayClock').onclick = e => { e.stopPropagation(); if (toggle('#calendar')) buildCalendar(); };
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.flyout,#taskbar,#ctx')) closeFlyouts(); });

  /* quick settings */
  $('#quick').addEventListener('click', e => {
    const t = e.target.closest('.q-tile'); if (!t) return;
    const q = t.dataset.q;
    if (q === 'dark') return set({ dark: !settings.dark });
    t.classList.toggle('on');
    if (q === 'night') $('#night').style.display = t.classList.contains('on') ? 'block' : 'none';
  });
  $('#brightness').oninput = e => set({ brightness: +e.target.value });

  /* power */
  $('#btnLock').onclick = () => { closeFlyouts(); $('#lock').classList.remove('up'); };
  $('#btnRestart').onclick = () => location.reload();
  $('#btnShutdown').onclick = () => { closeFlyouts(); $('#off').classList.remove('hidden'); };
  $('#powerOn').onclick = () => { $('#off').classList.add('hidden'); $('#lock').classList.remove('up'); };

  /* ---------- Clock & calendar ---------- */
  function tick() {
    const d = new Date();
    const t = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#tbTime').textContent = t; $('#tbDate').textContent = d.toLocaleDateString();
    $('#lockTime').textContent = t.replace(/\s?[AP]M/i, '');
    $('#lockDate').textContent = d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }
  function buildCalendar() {
    const d = new Date(), y = d.getFullYear(), m = d.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    let h = `<h3>${d.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</h3><div class="cal-grid">` +
      ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(x => `<span class="dh">${x}</span>`).join('') + '<span></span>'.repeat(first);
    for (let i = 1; i <= days; i++) h += `<span class="${i === d.getDate() ? 'today' : ''}">${i}</span>`;
    $('#calendar').innerHTML = h + '</div>';
  }

  /* ---------- Desktop ---------- */
  function buildDesktop() {
    $('#icons').innerHTML = desktopIcons.map((d, i) => `<div class="dicon" data-i="${i}"><span class="em">${d[0]}</span>${d[1]}</div>`).join('');
  }
  $('#icons').addEventListener('click', e => { $$('.dicon').forEach(x => x.classList.remove('sel')); const d = e.target.closest('.dicon'); if (d) d.classList.add('sel'); });
  $('#icons').addEventListener('dblclick', e => {
    const d = e.target.closest('.dicon'); if (!d) return;
    const [, name, app, arg] = desktopIcons[d.dataset.i];
    if (!app) return alert(name + ' is empty.');
    open(app, arg === undefined ? null : arg);
  });
  $('#desktop').addEventListener('pointerdown', e => { if (e.target.id === 'desktop' || e.target.id === 'icons') $$('.dicon').forEach(x => x.classList.remove('sel')); });

  /* right-click menu */
  document.addEventListener('contextmenu', e => {
    e.preventDefault();
    if (e.target.closest('.win,#taskbar,.flyout')) return;
    const c = $('#ctx');
    c.innerHTML = `<div data-c="refresh">Refresh</div><div data-c="wall">Next wallpaper</div><div data-c="dark">Toggle dark mode</div><hr><div data-c="term">Open in Terminal</div><div data-c="pers">Personalize</div>`;
    c.classList.remove('hidden');
    c.style.left = Math.min(e.clientX, innerWidth - 210) + 'px'; c.style.top = Math.min(e.clientY, innerHeight - 200) + 'px';
  });
  $('#ctx').addEventListener('click', e => {
    const a = e.target.dataset.c; if (!a) return;
    if (a === 'refresh') { $('#icons').style.opacity = 0; setTimeout(() => $('#icons').style.opacity = 1, 120); }
    if (a === 'wall') set({ wall: String(settings.wall % 4 + 1) });
    if (a === 'dark') set({ dark: !settings.dark });
    if (a === 'term') open('terminal');
    if (a === 'pers') open('settings');
    closeFlyouts();
  });

  /* keyboard: Win/Meta key & Esc */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeFlyouts();
    if (e.key === 'Meta') { e.preventDefault(); $('#startBtn').click(); }
  });

  /* ---------- Lock screen ---------- */
  const unlock = () => $('#lock').classList.add('up');
  $('#lock').addEventListener('click', unlock);
  document.addEventListener('keydown', () => { if (!$('#lock').classList.contains('up')) unlock(); });

  /* ---------- Boot ---------- */
  buildDesktop(); buildStart(); renderTaskbar(); apply(); tick(); setInterval(tick, 1000);

  return { open, close, list: () => [...wins.values()], get settings() { return settings; }, set };
})();

/* ===== File Explorer (Windows 11 style) ===== */
const FX = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sv = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const TI = {
    new: sv('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'),
    cut: sv('<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16L19 3M16 16L5 3"/>'),
    copy: sv('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'),
    paste: sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/>'),
    rename: sv('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M12 5v14"/>'),
    share: sv('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
    del: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    sort: sv('<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>'),
    view: sv('<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    more: sv('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>'),
    back: sv('<path d="M19 12H5M11 6l-6 6 6 6"/>'), fwd: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    up: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: sv('<path d="M6 9l6 6 6-6"/>', 12),
    refresh: sv('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'), search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', 15)
  };

  /* ---- colourful folder / drive / file icons ---- */
  const COL = { Desktop: ['#1479c4', '#2aa7f5'], Documents: ['#5f7385', '#8fa3b6'], Downloads: ['#0f8a76', '#26b8a0'], Music: ['#c85a14', '#f08a3c'],
                Pictures: ['#1262c4', '#3b97f2'], Videos: ['#5a35b0', '#8a62e0'], _: ['#d9a21b', '#f6c744'] };
  const GL = {
    Desktop: '<rect x="13" y="24" width="22" height="12" rx="1.5" fill="#fff" opacity=".92"/>',
    Documents: '<path d="M17 26h14M17 30h14M17 34h9" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
    Downloads: '<path d="M24 23v11M19 30l5 5 5-5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    Music: '<circle cx="21" cy="34" r="3.2" fill="#fff"/><path d="M24 34V23l7 2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    Pictures: '<path d="M12 37l9-10 6 6 4-4 7 8z" fill="#fff" opacity=".95"/>',
    Videos: '<path d="M20 23l13 7-13 7z" fill="#fff"/>', _: ''
  };
  const folderSvg = (kind, size = 44) => { const c = COL[kind] || COL._; return `<svg viewBox="0 0 48 48" width="${size}" height="${size}"><path d="M4 11a3 3 0 0 1 3-3h10l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="${c[0]}"/><path d="M4 18a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="${c[1]}"/>${GL[kind] || ''}</svg>`; };
  const driveSvg = (win, size = 48) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${win ? '<g fill="#29a3ff"><rect x="6" y="4" width="8" height="8" rx="1"/><rect x="15" y="4" width="8" height="8" rx="1"/><rect x="6" y="13" width="8" height="8" rx="1"/><rect x="15" y="13" width="8" height="8" rx="1"/></g>' : ''}<rect x="5" y="24" width="38" height="16" rx="3" fill="#aab4bc"/><rect x="5" y="24" width="38" height="7" rx="3" fill="#e6ebef"/><circle cx="11" cy="35" r="1.8" fill="#2ecc71"/><rect x="17" y="33.5" width="21" height="3" rx="1.5" fill="#6f7c86"/></svg>`;
  const fileSvg = (name, size = 44) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}"><path d="M10 4h19l9 9v29a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#eef2f6"/><path d="M29 4l9 9h-7a2 2 0 0 1-2-2z" fill="#b8c4d0"/><path d="M14 22h20M14 28h20M14 34h13" stroke="#7a8b9c" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  const iconFor = (name, node, atRoot) => typeof node === 'object' ? (atRoot ? driveSvg(name.includes('C:')) : folderSvg(COL[name] ? name : '_')) : fileSvg(name);

  const TIMES = { sizes: { 'Local Disk (C:)': [25.6, 99.8], 'Local Disk (D:)': [109, 137] } };
  const QUICK = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];
  let CLIP = null;

  function render(body, win, arg) {
    let path = arg && arg.path ? [...arg.path] : [];
    let hist = [path], hi = 0, sel = null, view = 'large', sort = { by: 'name', dir: 1 }, q = '';
    body.innerHTML = `<div class="fx" tabindex="0">
      <div class="fx-tools">
        <button data-a="new" title="New">${TI.new}<span>New</span>${TI.down}</button><i></i>
        <button data-a="cut" title="Cut">${TI.cut}</button><button data-a="copy" title="Copy">${TI.copy}</button><button data-a="paste" title="Paste">${TI.paste}</button>
        <button data-a="rename" title="Rename">${TI.rename}</button><button data-a="share" title="Share">${TI.share}</button><button data-a="del" title="Delete">${TI.del}</button><i></i>
        <button data-a="sort" title="Sort">${TI.sort}<span>Sort</span>${TI.down}</button>
        <button data-a="view" title="View">${TI.view}<span>View</span>${TI.down}</button><i></i><button data-a="more" title="See more">${TI.more}</button>
      </div>
      <div class="fx-nav">
        <button data-a="back" title="Back">${TI.back}</button><button data-a="fwd" title="Forward">${TI.fwd}</button><button data-a="hist" title="Recent">${TI.down}</button><button data-a="up" title="Up">${TI.up}</button>
        <div class="fx-addr"></div><button data-a="refresh" class="fx-rf" title="Refresh">${TI.refresh}</button>
        <div class="fx-search">${TI.search}<input placeholder="Search"></div>
      </div>
      <div class="fx-main"><div class="fx-side"></div><div class="fx-content"></div></div>
      <div class="fx-status"><span></span><div class="fx-vt"><button data-v="list" title="Details">☰</button><button data-v="large" title="Large icons">▦</button></div></div>
      <div class="fx-menu hidden"></div></div>`;
    const $q = s => body.querySelector(s);
    const root = $q('.fx'), side = $q('.fx-side'), cont = $q('.fx-content'), addr = $q('.fx-addr'), stat = $q('.fx-status span'), menu = $q('.fx-menu'), sin = $q('.fx-search input');
    const key = p => p.join('/');
    const special = () => path[0] && path[0][0] === '@';
    const nodeOf = p => p.length ? FS.get(p) : FS.root();
    const isDir = () => !special() && path.length > 0 && typeof FS.get(path) === 'object';
    const title = () => !path.length ? 'This PC' : special() ? ({ '@quick': 'Quick access', '@network': 'Network', '@linux': 'Linux' })[path[0]] : path[path.length - 1];

    function go(p, noPush) {
      path = p; sel = null; q = ''; sin.value = '';
      if (!noPush) { hist = hist.slice(0, hi + 1); hist.push(p); hi++; }
      draw();
    }
    function openItem(parent, name) {
      const n = nodeOf(parent)[name];
      if (typeof n === 'object') return go([...parent, name]);
      RECENT.add(name, parent);
      OS.open('notepad', { name, path: [...parent], content: n });
    }
    function uniq(dir, base) { let n = base, i = 2; while (n in dir) n = base.replace(/(\.[^.]*)?$/, ` (${i++})$1`); return n; }

    function drawSide() {
      const it = (ico, label, p, ind) => `<div class="fx-si ${key(p) === key(path) ? 'on' : ''}" style="padding-left:${8 + ind * 18}px" data-p='${JSON.stringify(p)}'><span class="chev">›</span>${ico}<span>${label}</span></div>`;
      const mini = k => folderSvg(k, 18);
      side.innerHTML = it('<span class="star">★</span>', 'Quick access', ['@quick'], 0) +
        `<div class="fx-si ${!path.length ? 'on' : ''}" data-p="[]"><span class="chev open">›</span><span class="pcico">🖥️</span><span>This PC</span></div>` +
        QUICK.map(k => it(mini(k), k, [...HOME, k], 1)).join('') +
        Object.keys(FS.root()).map(d => it(driveSvg(d.includes('C:'), 18), d, [d], 1)).join('') +
        it('<span class="pcico">🌐</span>', 'Network', ['@network'], 0) + it('<span class="pcico">🐧</span>', 'Linux', ['@linux'], 0);
    }
    function sorted(entries) {
      const typ = ([k, v]) => typeof v === 'object' ? '0' : (k.split('.').pop() || '');
      return entries.sort((a, b) => {
        const fa = typeof a[1] === 'object' ? 0 : 1, fb = typeof b[1] === 'object' ? 0 : 1;
        if (fa !== fb) return fa - fb;
        const r = sort.by === 'type' ? typ(a).localeCompare(typ(b)) || a[0].localeCompare(b[0]) : a[0].localeCompare(b[0], undefined, { numeric: true });
        return r * sort.dir;
      });
    }
    const tile = (name, node, label, sub, extra = '') => `<div class="fx-tile ${sel === name ? 'sel' : ''}" data-n="${esc(name)}">${extra}</div>`;

    function drawContent() {
      let count = 0, html = '';
      if (q) {
        const res = FS.find(q.toLowerCase());
        count = res.length;
        html = `<div class="fx-sec">Search results (${res.length})</div><div class="fx-grid tiles">` + res.map((r, i) => `<div class="fx-tile ${sel === 'r' + i ? 'sel' : ''}" data-r="${i}" data-n="r${i}"><div class="ico">${r.isDir ? folderSvg('_', 40) : fileSvg(r.name, 40)}</div><div class="lbl"><b>${esc(r.name)}</b><small>${esc(r.path.join(' › ') || 'This PC')}</small></div></div>`).join('') + '</div>';
        if (!res.length) html = '<div class="fx-empty">No items match your search.</div>';
        cont._res = res;
      } else if (!path.length) {
        count = QUICK.length + Object.keys(FS.root()).length;
        html = `<div class="fx-sec">Folders (${QUICK.length})</div><div class="fx-grid tiles">` +
          QUICK.map(k => `<div class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${k}" data-home="1"><div class="ico">${folderSvg(k, 46)}</div><div class="lbl">${k}</div></div>`).join('') + '</div>' +
          `<div class="fx-sec">Devices and drives (${Object.keys(FS.root()).length})</div><div class="fx-grid tiles drives">` +
          Object.keys(FS.root()).map(d => { const [free, tot] = TIMES.sizes[d] || [50, 100], used = Math.round((1 - free / tot) * 100);
            return `<div class="fx-tile drive ${sel === d ? 'sel' : ''}" data-n="${esc(d)}"><div class="ico">${driveSvg(d.includes('C:'), 54)}</div><div class="lbl"><b>${esc(d)}</b><div class="bar"><div class="${used > 90 ? 'red' : ''}" style="width:${used}%"></div></div><small>${free} GB free of ${tot} GB</small></div></div>`; }).join('') + '</div>';
      } else if (path[0] === '@quick') {
        count = QUICK.length;
        html = `<div class="fx-sec">Pinned folders</div><div class="fx-grid tiles">` + QUICK.map(k => `<div class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${k}" data-home="1"><div class="ico">${folderSvg(k, 46)}</div><div class="lbl">${k}</div></div>`).join('') + '</div>';
      } else if (special()) {
        html = `<div class="fx-empty">${path[0] === '@network' ? 'No network devices found.' : 'Linux (WSL) is not installed in this demo.'}</div>`;
      } else {
        const node = nodeOf(path) || {}, entries = sorted(Object.entries(node)); count = entries.length;
        if (!entries.length) html = '<div class="fx-empty">This folder is empty.</div>';
        else if (view === 'list') html = `<table class="fx-tbl"><tr><th>Name</th><th>Type</th><th>Size</th></tr>` + entries.map(([k, v]) => `<tr class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${esc(k)}"><td><span class="mi">${iconFor(k, v, false).replace(/width="\d+" height="\d+"/, 'width="20" height="20"')}</span>${esc(k)}</td><td>${typeof v === 'object' ? 'File folder' : (k.split('.').pop() || 'File').toUpperCase() + ' File'}</td><td>${typeof v === 'object' ? '' : Math.max(1, Math.ceil(v.length / 1024)) + ' KB'}</td></tr>`).join('') + '</table>';
        else html = '<div class="fx-grid icons">' + entries.map(([k, v]) => `<div class="fx-tile vert ${sel === k ? 'sel' : ''}" data-n="${esc(k)}"><div class="ico">${iconFor(k, v, false)}</div><div class="lbl">${esc(k)}</div></div>`).join('') + '</div>';
      }
      cont.innerHTML = html;
      stat.textContent = `${count} item${count === 1 ? '' : 's'}  |  ${sel ? '1 item selected' : '0 items selected'}`.replace('  |  0 items selected', '');
      if (sel) stat.textContent = `${count} items  |  1 item selected`;
    }
    function drawBar() {
      const crumbs = [['This PC', []]];
      if (special()) crumbs.push([title(), path]); else path.forEach((n, i) => crumbs.push([n, path.slice(0, i + 1)]));
      addr.innerHTML = '<span class="pcico">🖥️</span>' + crumbs.map(c => `<span class="crumb" data-p='${JSON.stringify(c[1])}'>${esc(c[0])}</span>`).join('<span class="sep">›</span>');
      sin.placeholder = 'Search ' + title();
      const canEdit = isDir(), has = sel && canEdit;
      const dis = { cut: !has, copy: !has, rename: !has, del: !has, paste: !(CLIP && canEdit), new: !canEdit, share: !has, back: hi === 0, fwd: hi >= hist.length - 1, up: !path.length };
      $$('[data-a]', root).forEach(b => { if (b.dataset.a in dis) b.disabled = dis[b.dataset.a]; });
      $$('.fx-vt button', root).forEach(b => b.classList.toggle('on', b.dataset.v === view));
    }
    function draw() { win.setTitle(title()); drawSide(); drawContent(); drawBar(); }

    /* ---- popup menus ---- */
    function showMenu(btn, items) {
      menu.innerHTML = items.map(i => i === '-' ? '<hr>' : `<div data-m="${i[1]}" class="${i[2] ? 'on' : ''}">${i[0]}</div>`).join('');
      const r = btn.getBoundingClientRect(), br = root.getBoundingClientRect();
      menu.style.left = Math.min(r.left - br.left, br.width - 190) + 'px'; menu.style.top = (r.bottom - br.top + 2) + 'px';
      menu.classList.remove('hidden');
    }
    const hideMenu = () => menu.classList.add('hidden');
    function doMenu(m) {
      hideMenu();
      const dir = nodeOf(path);
      if (m === 'newFolder') { const n = uniq(dir, 'New folder'); FS.set(path, n, {}); sel = n; draw(); }
      if (m === 'newText') { const n = uniq(dir, 'New Text Document.txt'); FS.set(path, n, ''); sel = n; draw(); }
      if (m.startsWith('sort:')) { const v = m.slice(5); if (v === 'asc') sort.dir = 1; else if (v === 'desc') sort.dir = -1; else sort.by = v; draw(); }
      if (m.startsWith('view:')) { view = m.slice(5); draw(); }
      if (m === 'refresh') draw();
      if (m === 'selall') { OS.notify('File Explorer', 'Select all', 'Use Ctrl+click to select multiple items — coming in a future version.'); }
    }
    function action(a, btn) {
      const dir = isDir() ? nodeOf(path) : null;
      if (a === 'back' && hi > 0) { hi--; go(hist[hi], true); }
      if (a === 'fwd' && hi < hist.length - 1) { hi++; go(hist[hi], true); }
      if (a === 'up' && path.length) go(special() ? [] : path.slice(0, -1));
      if (a === 'refresh') draw();
      if (a === 'hist') showMenu(btn, [...new Map(hist.map(h => [key(h), h])).values()].slice(-6).reverse().map(h => [h.length ? esc(h[h.length - 1]) : 'This PC', 'goto:' + JSON.stringify(h)]));
      if (a === 'new') showMenu(btn, [['📁 Folder', 'newFolder'], ['📄 Text Document', 'newText']]);
      if (a === 'sort') showMenu(btn, [['Name', 'sort:name', sort.by === 'name'], ['Type', 'sort:type', sort.by === 'type'], '-', ['Ascending', 'sort:asc', sort.dir === 1], ['Descending', 'sort:desc', sort.dir === -1]]);
      if (a === 'view') showMenu(btn, [['Large icons', 'view:large', view === 'large'], ['Details', 'view:list', view === 'list']]);
      if (a === 'more') showMenu(btn, [['Refresh', 'refresh'], ['Select all', 'selall']]);
      if (!dir || !sel) { if (a === 'paste' && CLIP && dir) paste(dir); return; }
      if (a === 'copy' || a === 'cut') { CLIP = { path: [...path], name: sel, cut: a === 'cut' }; drawBar(); }
      if (a === 'paste') paste(dir);
      if (a === 'rename') { const n = prompt('Rename:', sel); if (n && n !== sel && !(n in dir)) { dir[n] = dir[sel]; delete dir[sel]; FS.save(); sel = n; draw(); } }
      if (a === 'share') OS.notify('File Explorer', 'Share', 'Sharing is not available in this demo.');
      if (a === 'del') { FS.del(path, sel); sel = null; draw(); }
    }
    function paste(dir) {
      if (!CLIP) return;
      const src = FS.get(CLIP.path); if (!src || !(CLIP.name in src)) { CLIP = null; return draw(); }
      const n = uniq(dir, CLIP.name); dir[n] = JSON.parse(JSON.stringify(src[CLIP.name]));
      if (CLIP.cut) { FS.remove(CLIP.path, CLIP.name); CLIP = null; } else FS.save();
      sel = n; draw();
    }

    /* ---- events ---- */
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (b && !b.disabled) { e.stopPropagation(); hideMenu(); return action(b.dataset.a, b); }
      const m = e.target.closest('[data-m]');
      if (m) { const v = m.dataset.m; return v.startsWith('goto:') ? (hideMenu(), go(JSON.parse(v.slice(5)))) : doMenu(v); }
      hideMenu();
      const vb = e.target.closest('[data-v]'); if (vb) { view = vb.dataset.v; return draw(); }
      const p = e.target.closest('[data-p]'); if (p) return go(JSON.parse(p.dataset.p));
      const t = e.target.closest('.fx-tile');
      if (t || e.target.closest('.fx-content')) {
        sel = t ? t.dataset.n : null;
        cont.querySelectorAll('.fx-tile.sel').forEach(x => x.classList.remove('sel')); if (t) t.classList.add('sel');
        const n = (stat.textContent.match(/^\d+/) || ['0'])[0]; stat.textContent = sel ? `${n} items  |  1 item selected` : `${n} items`; drawBar();
      }
    });
    root.addEventListener('dblclick', e => {
      const t = e.target.closest('.fx-tile'); if (!t) return;
      if (t.dataset.r !== undefined) { const r = cont._res[t.dataset.r]; return r.isDir ? go([...r.path, r.name]) : openItem(r.path, r.name); }
      if (t.dataset.home) return go([...HOME, t.dataset.n]);
      if (!path.length) return go([t.dataset.n]);
      openItem(path, t.dataset.n);
    });
    sin.addEventListener('input', () => { q = sin.value.trim(); sel = null; drawContent(); });
    root.addEventListener('keydown', e => {
      if (e.target === sin || !isDir()) return;
      if (e.key === 'Delete' && sel) action('del');
      if (e.key === 'F2' && sel) action('rename');
      if ((e.ctrlKey || e.metaKey) && sel && e.key.toLowerCase() === 'c') action('copy');
      if ((e.ctrlKey || e.metaKey) && sel && e.key.toLowerCase() === 'x') action('cut');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') action('paste');
    });
    draw();
  }
  return { render, folderSvg, driveSvg, fileSvg };
})();

APPS.explorer = { name: 'File Explorer', icon: '📁', w: 900, h: 560, render: FX.render };

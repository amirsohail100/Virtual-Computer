/* ===== File Explorer (Windows 11 style) — toolbar, sidebar, right-click menu, New submenu, inline rename ===== */
const FX = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sv = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const TI = {
    new: sv('<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>'), cut: sv('<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16L19 3M16 16L5 3"/>'),
    copy: sv('<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>'), paste: sv('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/>'),
    rename: sv('<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M12 5v14"/>'), share: sv('<path d="M12 15V3M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>'),
    del: sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'), sort: sv('<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>'),
    view: sv('<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    group: sv('<path d="M4 6h16M4 12h10M4 18h16"/>'), props: sv('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
    more: sv('<circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/>'),
    back: sv('<path d="M19 12H5M11 6l-6 6 6 6"/>'), fwd: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'), up: sv('<path d="M12 19V5M6 11l6-6 6 6"/>'), down: sv('<path d="M6 9l6 6 6-6"/>', 12),
    refresh: sv('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>'), search: sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', 15),
    open: sv('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'), term: sv('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/>')
  };
  const COL = { Desktop: ['#1479c4', '#2aa7f5'], Documents: ['#5f7385', '#8fa3b6'], Downloads: ['#0f8a76', '#26b8a0'], Music: ['#c85a14', '#f08a3c'], Pictures: ['#1262c4', '#3b97f2'], Videos: ['#5a35b0', '#8a62e0'], _: ['#d9a21b', '#f6c744'] };
  const GL = {
    Desktop: '<rect x="13" y="24" width="22" height="12" rx="1.5" fill="#fff" opacity=".92"/>', Documents: '<path d="M17 26h14M17 30h14M17 34h9" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
    Downloads: '<path d="M24 23v11M19 30l5 5 5-5" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>', Music: '<circle cx="21" cy="34" r="3.2" fill="#fff"/><path d="M24 34V23l7 2" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    Pictures: '<path d="M12 37l9-10 6 6 4-4 7 8z" fill="#fff" opacity=".95"/>', Videos: '<path d="M20 23l13 7-13 7z" fill="#fff"/>', _: ''
  };
  const folderSvg = (kind, size = 44) => { const c = COL[kind] || COL._; return `<svg viewBox="0 0 48 48" width="${size}" height="${size}"><path d="M4 11a3 3 0 0 1 3-3h10l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="${c[0]}"/><path d="M4 18a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="${c[1]}"/>${GL[kind] || ''}</svg>`; };
  const zipSvg = (size = 44) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}"><path d="M4 11a3 3 0 0 1 3-3h10l4 4h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#d9a21b"/><path d="M4 18a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f6c744"/><rect x="21" y="15" width="6" height="25" fill="#e9e9e9"/><path d="M21 19h6M21 23h6M21 27h6M21 31h6" stroke="#9aa0a6" stroke-width="1.6"/><rect x="21" y="33" width="6" height="5" rx="1" fill="#8a8f98"/></svg>`;
  const driveSvg = (win, size = 48) => `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${win ? '<g fill="#29a3ff"><rect x="6" y="4" width="8" height="8" rx="1"/><rect x="15" y="4" width="8" height="8" rx="1"/><rect x="6" y="13" width="8" height="8" rx="1"/><rect x="15" y="13" width="8" height="8" rx="1"/></g>' : ''}<rect x="5" y="24" width="38" height="16" rx="3" fill="#aab4bc"/><rect x="5" y="24" width="38" height="7" rx="3" fill="#e6ebef"/><circle cx="11" cy="35" r="1.8" fill="#2ecc71"/><rect x="17" y="33.5" width="21" height="3" rx="1.5" fill="#6f7c86"/></svg>`;
  const fileSvg = (name, size = 44) => {
    const t = FTYPES[extOf(name)];
    if (t && t.l === 'Z') return zipSvg(size);
    const body = `<path d="M10 4h19l9 9v29a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#eef2f6"/><path d="M29 4l9 9h-7a2 2 0 0 1-2-2z" fill="#b8c4d0"/>`;
    if (t && extOf(name) !== 'txt') return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${body}<rect x="3" y="22" width="23" height="17" rx="3" fill="${t.c}"/><text x="14.5" y="35" font-size="12" font-weight="700" text-anchor="middle" fill="#fff" font-family="sans-serif">${t.l}</text></svg>`;
    return `<svg viewBox="0 0 48 48" width="${size}" height="${size}">${body}<path d="M14 22h20M14 28h20M14 34h13" stroke="#7a8b9c" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  };
  const iconFor = (name, node, atRoot) => typeof node === 'object' ? (atRoot ? driveSvg(name.includes('C:')) : folderSvg(COL[name] ? name : '_')) : fileSvg(name);
  const SIZES = { 'Local Disk (C:)': [25.6, 99.8], 'Local Disk (D:)': [109, 137] };
  const QUICK = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'];
  let CLIP = null;

  /* open a file/folder (shared with the desktop). go = navigate callback inside an Explorer window */
  function openItem(parent, name, go) {
    const n = FS.get(parent) && FS.get(parent)[name];
    if (n === undefined) return;
    if (typeof n === 'object') return go ? go([...parent, name]) : OS.open('explorer', { path: [...parent, name] });
    const e = extOf(name);
    if (e === 'txt') { RECENT.add(name, parent); return OS.open('notepad', { name, path: parent, content: n }); }
    if (e === 'lnk') return OS.run(n) || OS.notify('Shortcut', 'The target could not be opened', n);
    OS.notify('File Explorer', e === 'zip' ? 'Compressed folder' : 'No app for this file', e === 'zip' ? 'Compressed (zipped) folders cannot be opened in this demo.' : `There is no app for .${e || 'this'} files in this demo. Text files open in Notepad.`);
  }

  function render(body, win, arg) {
    let path = arg && arg.path ? [...arg.path] : [];
    let hist = [path], hi = 0, sel = null, view = 'large', sort = { by: 'name', dir: 1 }, group = 'none', q = '';
    body.innerHTML = `<div class="fx" tabindex="0">
      <div class="fx-tools">
        <button data-a="new" title="New">${TI.new}<span>New</span>${TI.down}</button><i></i>
        <button data-a="cut" title="Cut">${TI.cut}</button><button data-a="copy" title="Copy">${TI.copy}</button><button data-a="paste" title="Paste">${TI.paste}</button>
        <button data-a="rename" title="Rename">${TI.rename}</button><button data-a="share" title="Share">${TI.share}</button><button data-a="del" title="Delete">${TI.del}</button><i></i>
        <button data-a="sort" title="Sort">${TI.sort}<span>Sort</span>${TI.down}</button><button data-a="view" title="View">${TI.view}<span>View</span>${TI.down}</button><i></i><button data-a="more" title="See more">${TI.more}</button>
      </div>
      <div class="fx-nav"><button data-a="back" title="Back">${TI.back}</button><button data-a="fwd" title="Forward">${TI.fwd}</button><button data-a="hist" title="Recent locations">${TI.down}</button><button data-a="up" title="Up">${TI.up}</button>
        <div class="fx-addr"></div><button data-a="refresh" class="fx-rf" title="Refresh">${TI.refresh}</button><div class="fx-search">${TI.search}<input placeholder="Search"></div></div>
      <div class="fx-main"><div class="fx-side"></div><div class="fx-content"></div></div>
      <div class="fx-status"><span></span><div class="fx-vt"><button data-v="list" title="Details">☰</button><button data-v="large" title="Large icons">▦</button></div></div></div>`;
    const $q = s => body.querySelector(s), root = $q('.fx'), side = $q('.fx-side'), cont = $q('.fx-content'), addr = $q('.fx-addr'), stat = $q('.fx-status span'), sin = $q('.fx-search input');
    const key = p => p.join('/'), special = () => path[0] && path[0][0] === '@', nodeOf = p => p.length ? FS.get(p) : FS.root();
    const isDir = () => !special() && path.length > 0 && typeof FS.get(path) === 'object';
    const title = () => !path.length ? 'This PC' : special() ? ({ '@quick': 'Quick access', '@network': 'Network', '@linux': 'Linux' })[path[0]] : path[path.length - 1];
    const menuAt = (btn, items) => { const r = btn.getBoundingClientRect(); OS.menu(r.left, r.bottom + 2, items); };

    function go(p, noPush) { path = p; sel = null; q = ''; sin.value = ''; if (!noPush) { hist = hist.slice(0, hi + 1); hist.push(p); hi++; } draw(); }
    const open = (parent, name) => openItem(parent, name, go);
    const afterCreate = name => { sel = name; draw(); startRename(name); };

    /* ---- inline rename ---- */
    function startRename(name) {
      if (!isDir()) return;
      const t = [...cont.querySelectorAll('.fx-tile')].find(x => x.dataset.n === name); if (!t) return;
      const inp = document.createElement('input'); inp.className = 'fx-ren'; inp.value = name; inp.spellcheck = false;
      const lbl = t.querySelector('.lbl'), td = t.querySelector('td');
      if (lbl) { lbl.innerHTML = ''; lbl.appendChild(inp); } else if (td) { const mi = td.querySelector('.mi'); td.innerHTML = ''; mi && td.appendChild(mi); td.appendChild(inp); } else return;
      let done = false;
      const commit = () => {
        if (done) return; done = true;
        const nn = inp.value.replace(/[\\/:*?"<>|]/g, '').trim(), dir = FS.get(path);
        if (!nn || nn === name) return draw();
        if (nn in dir) { OS.notify('File Explorer', 'Cannot rename', 'A file or folder with that name already exists.'); return draw(); }
        const entries = Object.entries(dir); Object.keys(dir).forEach(k => delete dir[k]); entries.forEach(([k, v]) => { dir[k === name ? nn : k] = v; });
        FS.save(); sel = nn; draw();
      };
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') commit(); if (e.key === 'Escape') { done = true; draw(); } });
      inp.addEventListener('blur', commit); inp.addEventListener('click', e => e.stopPropagation()); inp.addEventListener('dblclick', e => e.stopPropagation());
      inp.focus(); const dot = name.lastIndexOf('.'); inp.setSelectionRange(0, dot > 0 ? dot : name.length);
    }

    /* ---- drawing ---- */
    function drawSide() {
      const it = (ico, label, p, ind) => `<div class="fx-si ${key(p) === key(path) ? 'on' : ''}" style="padding-left:${8 + ind * 18}px" data-p='${JSON.stringify(p)}'><span class="chev">›</span>${ico}<span>${label}</span></div>`;
      side.innerHTML = it('<span class="star">★</span>', 'Quick access', ['@quick'], 0) + `<div class="fx-si ${!path.length ? 'on' : ''}" data-p="[]"><span class="chev open">›</span><span class="pcico">🖥️</span><span>This PC</span></div>` +
        QUICK.map(k => it(folderSvg(k, 18), k, [...HOME, k], 1)).join('') + Object.keys(FS.root()).map(d => it(driveSvg(d.includes('C:'), 18), d, [d], 1)).join('') +
        it('<span class="pcico">🌐</span>', 'Network', ['@network'], 0) + it('<span class="pcico">🐧</span>', 'Linux', ['@linux'], 0);
    }
    const sizeOf = v => typeof v === 'object' ? -1 : v.length;
    function sorted(entries) {
      return entries.sort((a, b) => {
        const fa = typeof a[1] === 'object' ? 0 : 1, fb = typeof b[1] === 'object' ? 0 : 1; if (fa !== fb) return fa - fb;
        const r = sort.by === 'type' ? typeName(a[0], a[1]).localeCompare(typeName(b[0], b[1])) || a[0].localeCompare(b[0]) : sort.by === 'size' ? sizeOf(a[1]) - sizeOf(b[1]) || a[0].localeCompare(b[0]) : a[0].localeCompare(b[0], undefined, { numeric: true });
        return r * sort.dir;
      });
    }
    const tileL = ([k, v]) => `<div class="fx-tile vert ${sel === k ? 'sel' : ''}" data-n="${esc(k)}"><div class="ico">${iconFor(k, v, false)}</div><div class="lbl">${esc(k)}</div></div>`;
    const rowL = ([k, v]) => `<tr class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${esc(k)}"><td><span class="mi">${iconFor(k, v, false).replace(/width="\d+" height="\d+"/, 'width="20" height="20"')}</span>${esc(k)}</td><td>${esc(typeName(k, v))}</td><td>${typeof v === 'object' ? '' : Math.max(1, Math.ceil(v.length / 1024)) + ' KB'}</td></tr>`;
    function drawContent() {
      let count = 0, html = '';
      if (q) {
        const r = FS.find(q.toLowerCase()); count = r.length; cont._res = r;
        html = r.length ? `<div class="fx-sec">Search results (${r.length})</div><div class="fx-grid tiles">` + r.map((x, i) => `<div class="fx-tile ${sel === 'r' + i ? 'sel' : ''}" data-r="${i}" data-n="r${i}"><div class="ico">${x.isDir ? folderSvg('_', 40) : fileSvg(x.name, 40)}</div><div class="lbl"><b>${esc(x.name)}</b><small>${esc(x.path.join(' › ') || 'This PC')}</small></div></div>`).join('') + '</div>' : '<div class="fx-empty">No items match your search.</div>';
      } else if (!path.length) {
        count = QUICK.length + Object.keys(FS.root()).length;
        html = `<div class="fx-sec">Folders (${QUICK.length})</div><div class="fx-grid tiles">` + QUICK.map(k => `<div class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${k}" data-home="1"><div class="ico">${folderSvg(k, 46)}</div><div class="lbl">${k}</div></div>`).join('') + '</div>' +
          `<div class="fx-sec">Devices and drives (${Object.keys(FS.root()).length})</div><div class="fx-grid tiles drives">` + Object.keys(FS.root()).map(d => { const [free, tot] = SIZES[d] || [50, 100], used = Math.round((1 - free / tot) * 100);
            return `<div class="fx-tile drive ${sel === d ? 'sel' : ''}" data-n="${esc(d)}"><div class="ico">${driveSvg(d.includes('C:'), 54)}</div><div class="lbl"><b>${esc(d)}</b><div class="bar"><div class="${used > 90 ? 'red' : ''}" style="width:${used}%"></div></div><small>${free} GB free of ${tot} GB</small></div></div>`; }).join('') + '</div>';
      } else if (path[0] === '@quick') {
        count = QUICK.length; html = `<div class="fx-sec">Pinned folders</div><div class="fx-grid tiles">` + QUICK.map(k => `<div class="fx-tile ${sel === k ? 'sel' : ''}" data-n="${k}" data-home="1"><div class="ico">${folderSvg(k, 46)}</div><div class="lbl">${k}</div></div>`).join('') + '</div>';
      } else if (special()) html = `<div class="fx-empty">${path[0] === '@network' ? 'No network devices found.' : 'Linux (WSL) is not installed in this demo.'}</div>`;
      else {
        const e = sorted(Object.entries(nodeOf(path) || {})); count = e.length;
        if (!e.length) html = '<div class="fx-empty">This folder is empty.</div>';
        else {
          const groups = group === 'type' ? Object.entries(e.reduce((a, x) => ((a[typeName(x[0], x[1])] = a[typeName(x[0], x[1])] || []).push(x), a), {})) : [[null, e]];
          html = groups.map(([g, list]) => (g ? `<div class="fx-sec">${esc(g)} (${list.length})</div>` : '') + (view === 'list' ? `<table class="fx-tbl"><tr><th>Name</th><th>Type</th><th>Size</th></tr>${list.map(rowL).join('')}</table>` : `<div class="fx-grid icons">${list.map(tileL).join('')}</div>`)).join('');
        }
      }
      cont.innerHTML = html; setStat(count);
    }
    const setStat = n => { const c = n === undefined ? (parseInt(stat.textContent) || 0) : n; stat.textContent = `${c} item${c === 1 ? '' : 's'}` + (sel ? '  |  1 item selected' : ''); };
    function drawBar() {
      const crumbs = [['This PC', []]]; if (special()) crumbs.push([title(), path]); else path.forEach((n, i) => crumbs.push([n, path.slice(0, i + 1)]));
      addr.innerHTML = '<span class="pcico">🖥️</span>' + crumbs.map(c => `<span class="crumb" data-p='${JSON.stringify(c[1])}'>${esc(c[0])}</span>`).join('<span class="sep">›</span>');
      sin.placeholder = 'Search ' + title();
      const canEdit = isDir(), has = sel && canEdit;
      const dis = { cut: !has, copy: !has, rename: !has, del: !has, paste: !(CLIP && canEdit), new: !canEdit, share: !has, back: hi === 0, fwd: hi >= hist.length - 1, up: !path.length };
      body.querySelectorAll('[data-a]').forEach(b => { if (b.dataset.a in dis) b.disabled = dis[b.dataset.a]; });
      body.querySelectorAll('.fx-vt button').forEach(b => b.classList.toggle('on', b.dataset.v === view));
    }
    function draw() { win.setTitle(title()); drawSide(); drawContent(); drawBar(); OS.refreshDesktop(); }

    /* ---- actions ---- */
    const chk = (label, on, fn) => ({ icon: on ? '✓' : '', label, fn: () => { fn(); draw(); } });
    const viewItems = () => [chk('Large icons', view === 'large', () => view = 'large'), chk('Details', view === 'list', () => view = 'list')];
    const sortItems = () => [chk('Name', sort.by === 'name', () => sort.by = 'name'), chk('Type', sort.by === 'type', () => sort.by = 'type'), chk('Size', sort.by === 'size', () => sort.by = 'size'), '-', chk('Ascending', sort.dir === 1, () => sort.dir = 1), chk('Descending', sort.dir === -1, () => sort.dir = -1)];
    const groupItems = () => [chk('(None)', group === 'none', () => group = 'none'), chk('Type', group === 'type', () => group = 'type')];
    function props(name) {
      let rows = [], ttl;
      if (name && isDir() && FS.get(path)[name] !== undefined) {
        const v = FS.get(path)[name]; ttl = name;
        rows = [['Name', name], ['Type of file', typeName(name, v)], ['Location', path.join('\\')], ['Size', typeof v === 'object' ? '' : v.length + ' bytes']];
        if (typeof v === 'object') { const n = Object.values(v); rows.push(['Contains', `${n.filter(x => typeof x !== 'object').length} Files, ${n.filter(x => typeof x === 'object').length} Folders`]); }
      } else {
        ttl = title(); const n = Object.values(nodeOf(path) || {});
        rows = [['Name', ttl], ['Type', !path.length ? 'System folder' : special() ? 'Special folder' : path.length === 1 ? 'Local Disk' : 'File folder'], ['Location', path.length ? path.join('\\') : 'This PC']];
        if (isDir()) rows.push(['Contains', `${n.filter(x => typeof x !== 'object').length} Files, ${n.filter(x => typeof x === 'object').length} Folders`]);
        if (path.length === 1 && SIZES[path[0]]) rows.push(['Free space', SIZES[path[0]][0] + ' GB'], ['Capacity', SIZES[path[0]][1] + ' GB']);
      }
      OS.modal({ title: esc(ttl) + ' Properties', html: '<table class="props">' + rows.filter(r => r[1] !== '').map(r => `<tr><td>${r[0]}:</td><td>${esc(r[1])}</td></tr>`).join('') + '</table>', buttons: [{ label: 'OK', primary: true }] });
    }
    const comingCode = () => OS.notify('Visual Studio Code', 'Not installed', 'VS Code is not installed in this demo.');
    function moreMenu(x, y) {
      OS.menu(x, y, [{ icon: TI.refresh, label: 'Refresh', fn: draw }, { icon: TI.paste, label: 'Paste', key: 'Ctrl+V', disabled: !(CLIP && isDir()), fn: () => paste() }, { label: 'Paste shortcut', disabled: true }, { label: 'Undo', key: 'Ctrl+Z', disabled: true }, '-',
        { label: 'Customize this folder…', disabled: true }, { icon: TI.props, label: 'Properties', key: 'Alt+Enter', fn: () => props() }]);
    }
    function emptyMenu(x, y) {
      const items = [];
      if (CLIP && isDir()) items.push({ icon: TI.paste, label: 'Paste', key: 'Ctrl+V', fn: () => paste() }, '-');
      items.push({ icon: TI.view, label: 'View', sub: viewItems() }, { icon: TI.sort, label: 'Sort by', sub: sortItems() }, { icon: TI.group, label: 'Group by', sub: groupItems() }, '-',
        isDir() ? { icon: TI.new, label: 'New', sub: newMenuItems(path, afterCreate) } : { icon: TI.new, label: 'New', disabled: true },
        { icon: TI.props, label: 'Properties', key: 'Alt+Enter', fn: () => props() }, '-',
        { icon: TI.term, label: 'Open in Windows Terminal', fn: () => OS.open('terminal') }, { icon: badge('‹›', '#1f9cf0'), label: 'Open with Code', fn: comingCode }, '-',
        { icon: TI.more, label: 'Show more options', key: 'Shift+F10', fn: () => moreMenu(x, y) });
      OS.menu(x, y, items);
    }
    function itemMenu(x, y, name) {
      const dir = isDir(), v = dir ? FS.get(path)[name] : undefined;
      OS.menu(x, y, [{ icon: TI.open, label: 'Open', fn: () => dir ? open(path, name) : (!path.length ? (name in FS.root() ? go([name]) : go([...HOME, name])) : path[0] === '@quick' ? go([...HOME, name]) : 0) }, dir && typeof v === 'object' ? { icon: TI.term, label: 'Open in Windows Terminal', fn: () => OS.open('terminal') } : null, '-',
        dir ? { icon: TI.cut, label: 'Cut', key: 'Ctrl+X', fn: () => { CLIP = { path: [...path], name, cut: true }; drawBar(); } } : null, dir ? { icon: TI.copy, label: 'Copy', key: 'Ctrl+C', fn: () => { CLIP = { path: [...path], name, cut: false }; drawBar(); } } : null,
        dir ? { icon: TI.rename, label: 'Rename', key: 'F2', fn: () => startRename(name) } : null, dir ? { icon: TI.del, label: 'Delete', key: 'Del', fn: () => { FS.del(path, name); sel = null; draw(); } } : null, dir ? '-' : null,
        { icon: TI.props, label: 'Properties', key: 'Alt+Enter', fn: () => props(dir ? name : undefined) }].filter(Boolean));
    }
    function paste() {
      const dir = isDir() ? FS.get(path) : null; if (!CLIP || !dir) return;
      const src = FS.get(CLIP.path); if (!src || !(CLIP.name in src)) { CLIP = null; return draw(); }
      const ext = typeof src[CLIP.name] === 'object' ? '' : (CLIP.name.includes('.') ? '.' + extOf(CLIP.name) : ''), base = ext ? CLIP.name.slice(0, -ext.length) : CLIP.name;
      const n = (CLIP.name in dir) ? uniqName(dir, base + ' - Copy', ext) : CLIP.name; dir[n] = JSON.parse(JSON.stringify(src[CLIP.name]));
      if (CLIP.cut) { FS.remove(CLIP.path, CLIP.name); CLIP = null; } else FS.save(); sel = n; draw();
    }
    function action(a, btn) {
      const dir = isDir() ? FS.get(path) : null;
      if (a === 'back' && hi > 0) { hi--; go(hist[hi], true); } if (a === 'fwd' && hi < hist.length - 1) { hi++; go(hist[hi], true); }
      if (a === 'up' && path.length) go(special() ? [] : path.slice(0, -1)); if (a === 'refresh') draw();
      if (a === 'hist') menuAt(btn, [...new Map(hist.map(h => [key(h), h])).values()].slice(-6).reverse().map(h => ({ label: esc(h.length ? h[h.length - 1] : 'This PC'), fn: () => go(h) })));
      if (a === 'new') menuAt(btn, newMenuItems(path, afterCreate)); if (a === 'sort') menuAt(btn, sortItems()); if (a === 'view') menuAt(btn, viewItems());
      if (a === 'more') { const r = btn.getBoundingClientRect(); moreMenu(r.left, r.bottom + 2); }
      if (a === 'paste') paste();
      if (!dir || !sel) return;
      if (a === 'copy' || a === 'cut') { CLIP = { path: [...path], name: sel, cut: a === 'cut' }; drawBar(); }
      if (a === 'rename') startRename(sel); if (a === 'share') OS.notify('File Explorer', 'Share', 'Sharing is not available in this demo.');
      if (a === 'del') { FS.del(path, sel); sel = null; draw(); }
    }

    /* ---- events ---- */
    root.addEventListener('click', e => {
      if (e.target.closest('.fx-ren')) return;
      const b = e.target.closest('[data-a]'); if (b && !b.disabled) { e.stopPropagation(); return action(b.dataset.a, b); }
      const vb = e.target.closest('[data-v]'); if (vb) { view = vb.dataset.v; return draw(); }
      const p = e.target.closest('[data-p]'); if (p) return go(JSON.parse(p.dataset.p));
      const t = e.target.closest('.fx-tile');
      if (t || e.target.closest('.fx-content')) {
        sel = t ? t.dataset.n : null; cont.querySelectorAll('.fx-tile.sel').forEach(x => x.classList.remove('sel')); if (t) t.classList.add('sel'); setStat(); drawBar();
      }
    });
    root.addEventListener('dblclick', e => {
      const t = e.target.closest('.fx-tile'); if (!t || e.target.closest('.fx-ren')) return;
      if (t.dataset.r !== undefined) { const r = cont._res[t.dataset.r]; return r.isDir ? go([...r.path, r.name]) : open(r.path, r.name); }
      if (t.dataset.home) return go([...HOME, t.dataset.n]);
      if (!path.length) return go([t.dataset.n]);
      open(path, t.dataset.n);
    });
    root.addEventListener('contextmenu', e => {
      if (e.target.tagName === 'INPUT') return;
      e.preventDefault(); e.stopPropagation();
      const t = e.target.closest('.fx-tile');
      if (t && t.dataset.r === undefined) { sel = t.dataset.n; cont.querySelectorAll('.fx-tile.sel').forEach(x => x.classList.remove('sel')); t.classList.add('sel'); setStat(); drawBar(); return itemMenu(e.clientX, e.clientY, t.dataset.n); }
      if (e.target.closest('.fx-content')) { sel = null; cont.querySelectorAll('.fx-tile.sel').forEach(x => x.classList.remove('sel')); setStat(); drawBar(); emptyMenu(e.clientX, e.clientY); }
    });
    sin.addEventListener('input', () => { q = sin.value.trim(); sel = null; drawContent(); });
    root.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      const ctrl = e.ctrlKey || e.metaKey, k = e.key;
      if (k === 'F5') { e.preventDefault(); return draw(); }
      if (k === 'Backspace') { e.preventDefault(); return action('back'); }
      if (e.altKey && k === 'Enter') { e.preventDefault(); return props(sel || undefined); }
      if (!isDir()) return;
      if (e.altKey && e.code === 'KeyN') { e.preventDefault(); const n = uniqName(FS.get(path), 'New folder'); FS.set(path, n, {}); return afterCreate(n); }
      if (ctrl && k.toLowerCase() === 'v') return action('paste');
      if (!sel) return;
      if (k === 'Delete') action('del'); if (k === 'F2') startRename(sel); if (k === 'Enter') open(path, sel);
      if (ctrl && k.toLowerCase() === 'c') action('copy'); if (ctrl && k.toLowerCase() === 'x') action('cut');
    });
    draw();
  }
  return { render, folderSvg, driveSvg, fileSvg, openItem };
})();

APPS.explorer = { name: 'File Explorer', icon: '📁', w: 900, h: 560, render: FX.render };

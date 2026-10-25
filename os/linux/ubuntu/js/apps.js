/* ===== Ubuntu (Virtual) — helpers, file system, terminal and apps =====
   App: { name, icon, w, h, fixed?, single?, render(body, win, arg) }
   win: { setTitle(t), close(), el, body, api:{ arg(a), sync(), close() } } */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WALLS = [{ id: 'u1', name: 'Jellyfish', img: 'assets/jellyfish.svg' }, { id: 'u2', name: 'Aubergine', img: 'assets/aubergine.svg' }, { id: 'u3', name: 'Facets', img: 'assets/facets.svg' }, { id: 'u4', name: 'Dusk', img: 'assets/dusk.svg' }, { id: 'u5', name: 'Dots', img: 'assets/dots.svg' }, { id: 'u6', name: 'Mesh', img: 'assets/mesh.svg' }];
const ACCENTS = [['orange', '#e95420'], ['bark', '#787859'], ['sage', '#657b69'], ['olive', '#4b8501'], ['viridian', '#03875b'], ['blue', '#0073e5'], ['purple', '#7764d8'], ['magenta', '#b34cb3'], ['red', '#da3450']];
const LOC = { desktop: 'Desktop', docs: 'Documents', downloads: 'Downloads', music: 'Music', pics: 'Pictures', videos: 'Videos', trash: 'Trash' };
const DIRNAME = { Desktop: 'desktop', Documents: 'docs', Downloads: 'downloads', Music: 'music', Pictures: 'pics', Videos: 'videos' };
const isImg = f => /^image/.test(f.type) || /\.(png|jpe?g|gif|bmp|webp|svg|avif)$/i.test(f.name);
const isAudio = f => /^audio/.test(f.type) || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name);
const isVideo = f => /^video/.test(f.type) || /\.(mp4|webm|mkv|mov)$/i.test(f.name);
const isText = f => /^text|json/.test(f.type) || /\.(txt|md|json|csv|log|js|py|sh|c|css|html?|xml|ini|conf|yml|yaml)$/i.test(f.name);
const isDoc = f => isText(f) || /pdf|word|office|document|\.(pdf|docx?|xlsx?|pptx?|odt)$/i.test(f.type + f.name);
const fsize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' kB' : (n / 1048576).toFixed(1) + ' MB';
const fileIcon = f => isImg(f) ? '🖼️' : isAudio(f) ? '🎵' : isVideo(f) ? '🎞️' : /pdf/.test(f.type + f.name) ? '📕' : isText(f) ? '📄' : /zip|rar|7z|tar|gz/.test(f.type + f.name) ? '🗜️' : '📎';
const pickFiles = (accept, cb) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (accept) i.accept = accept; i.onchange = () => { if (i.files.length) cb(i.files); }; i.click(); };
const download = f => { const u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 6e4); };

/* ---------- file system in the browser (IndexedDB) ---------- */
const FS = (() => {
  let db; const open = () => db || (db = new Promise((res, rej) => { const r = indexedDB.open('ubuntu_fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('f', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (m, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('f', m), r = fn(t.objectStore('f')); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => rej(t.error); }); };
  const self = {
    list: async f => ((await tx('readonly', s => s.getAll()).catch(() => [])) || []).filter(x => x.folder === f).sort((a, b) => a.name.localeCompare(b.name)),
    get: id => tx('readonly', s => s.get(id)), put: r => tx('readwrite', s => s.put(r)), del: id => tx('readwrite', s => s.delete(id)),
    async save(name, type, blob, folder, id) { const r = { id: id || 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name, type, size: blob.size, folder, added: Date.now(), blob }; await self.put(r); OS.sync(); return r; },
    /* upload: images → Pictures, audio → Music, video → Videos, documents → Documents, everything else → Downloads (or the folder given) */
    async import(files, folder) {
      const cnt = {}, ids = [];
      try { for (const f of [...files]) { const m = { name: f.name, type: f.type }, fo = folder || (isImg(m) ? 'pics' : isAudio(m) ? 'music' : isVideo(m) ? 'videos' : isDoc(m) ? 'docs' : 'downloads'); const r = await self.save(f.name, f.type, f, fo); cnt[fo] = (cnt[fo] || 0) + 1; ids.push(r.id); } }
      catch (e) { OS.notify('Copy failed', 'The browser storage is full or blocked.'); }
      const t = Object.entries(cnt).map(([k, n]) => `${n} → ${LOC[k]}`).join(', '); if (t) OS.notify('Files copied', t); return ids;
    }
  };
  return self;
})();
function openFile(f) {
  if (isImg(f)) OS.open('viewer', f.id); else if (isText(f)) OS.open('editor', f.id); else if (isAudio(f) || isVideo(f)) OS.open('media', f.id);
  else if (/pdf/.test(f.type + f.name)) { const u = URL.createObjectURL(f.blob); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 6e4); } else download(f);
}
const saveAsDlg = (name, cb) => OS.dialog({ title: 'Save As', html: 'Name:<br><input id="fn" class="in" style="width:280px;margin-top:6px" value="' + escH(name) + '">', buttons: [['Save', m => cb($('#fn', m).value.trim() || name)], ['Cancel']] });
const hdr = (l, r = '') => `<div class="hbar">${l}<span style="flex:1"></span>${r}</div>`;

/* ---------- Ubuntu Software catalog (install = simulated) ---------- */
const CATALOG = [['vlc', 'VLC media player', '🔶', 'Multimedia player'], ['gimp', 'GIMP', '🐶', 'Image editor'], ['code', 'Visual Studio Code', '🟦', 'Code editor'], ['libreoffice', 'LibreOffice', '📄', 'Office suite'], ['thunderbird', 'Thunderbird', '🐦', 'Email client'], ['spotify', 'Spotify', '🎧', 'Music streaming'], ['telegram', 'Telegram Desktop', '✈', 'Messaging'], ['steam', 'Steam', '🎮', 'Games'], ['blender', 'Blender', '🌀', '3D creation'], ['obs', 'OBS Studio', '🎥', 'Streaming and recording'], ['inkscape', 'Inkscape', '🖋', 'Vector graphics'], ['audacity', 'Audacity', '🎚', 'Audio editor']];
const installed = () => jget('ubuntu_installed', []);
function registerInstalled() { installed().forEach(id => { const c = CATALOG.find(x => x[0] === id); if (c && !APPS['x_' + id]) APPS['x_' + id] = { name: c[1], icon: c[2], w: 520, h: 320, extra: 1, render(b) { b.innerHTML = `<div style="height:100%;display:grid;place-items:center;text-align:center;padding:20px"><div><div style="font-size:60px">${c[2]}</div><h3>${c[1]}</h3><p style="color:var(--tx2);margin-top:8px">${c[3]}<br><br>This application was installed from Ubuntu Software, but only a placeholder window exists in this virtual machine.</p></div></div>`; } }; }); }

/* ---------- Terminal (bash-style, safe simulation) ---------- */
const BOOT0 = Date.now(), PORTS = [[22, 'ssh'], [53, 'domain'], [80, 'http'], [443, 'https']];
const SYSFILES = { '/etc/hostname': 'ubuntu\n', '/etc/hosts': '127.0.0.1\tlocalhost\n127.0.1.1\tubuntu\n', '/etc/os-release': 'PRETTY_NAME="Ubuntu 24.04 LTS"\nNAME="Ubuntu"\nVERSION_ID="24.04"\nVERSION="24.04 LTS (Noble Numbat)"\nVERSION_CODENAME=noble\nID=ubuntu\nID_LIKE=debian\nHOME_URL="https://www.ubuntu.com/"\n', '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nubuntu:x:1000:1000:Ubuntu:/home/ubuntu:/bin/bash\n' };
const SYSDIRS = { '/': 'bin boot dev etc home lib media mnt opt proc root run sbin snap srv sys tmp usr var', '/etc': 'hostname hosts os-release passwd', '/home': 'ubuntu', '/tmp': '', '/usr': 'bin lib share', '/opt': '', '/var': 'log lib', '/root': '' };
const APPS = {
  terminal: { name: 'Terminal', icon: '⌨️', w: 780, h: 460,
    render(b, w, arg) {
      let cwd = '/home/ubuntu', hist = [], hi = 0, busy = false; const HOME = '/home/ubuntu';
      b.innerHTML = '<div class="term"><div class="to"></div><div class="rw"><span class="pr"></span><input autocomplete="off" spellcheck="false"></div></div>';
      const term = $('.term', b), to = $('.to', b), inp = $('input', b), tilde = p => p === HOME ? '~' : p.startsWith(HOME + '/') ? '~' + p.slice(HOME.length) : p;
      const pr = () => `<b class="g">ubuntu@ubuntu</b>:<b class="bl2">${escH(tilde(cwd))}</b>$&nbsp;`, upd = () => { $('.pr', b).innerHTML = pr(); };
      const say = (t, c) => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = t; to.appendChild(d); term.scrollTop = 1e9; }, html = h => { const d = document.createElement('div'); d.innerHTML = h; to.appendChild(d); term.scrollTop = 1e9; };
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const norm = p => { if (!p) return cwd; p = p.replace(/^~/, HOME); const parts = (p.startsWith('/') ? p : cwd + '/' + p).split('/'), o = []; parts.forEach(x => { if (x === '..') o.pop(); else if (x && x !== '.') o.push(x); }); return '/' + o.join('/'); };
      const fsKey = p => { const a = p.split('/'); return a.length === 4 && a[1] === 'home' && a[2] === 'ubuntu' && DIRNAME[a[3]] ? DIRNAME[a[3]] : null; };
      const isDir = p => p === HOME || fsKey(p) || SYSDIRS[p] !== undefined, dirOf = p => fsKey(p.split('/').slice(0, -1).join('/'));
      const fileIn = async p => { const k = dirOf(p); if (!k) return null; const n = p.split('/').pop(); return (await FS.list(k)).find(f => f.name === n) || null; };
      const readF = async x => { const p = norm(x); if (SYSFILES[p]) return SYSFILES[p]; const f = await fileIn(p); return f && isText(f) ? await f.blob.text() : null; };
      const C = {
        help: () => say('GNU bash (simulated). Commands: ls cd pwd cat echo touch rm cp mv head tail wc grep tree clear whoami id hostname uname lsb_release date uptime ip ifconfig ping neofetch ps df free env history apt sudo cowsay open xdg-open man which curl wget exit\nApps: firefox nautilus gedit gnome-calculator eog gnome-system-monitor gnome-control-center'),
        pwd: () => say(cwd), whoami: () => say('ubuntu'), hostname: () => say('ubuntu'), id: () => say('uid=1000(ubuntu) gid=1000(ubuntu) groups=1000(ubuntu),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),122(lpadmin)'),
        clear: () => { to.textContent = ''; }, date: () => say(new Date().toString()), echo: a => say(a.join(' ')), history: () => say(hist.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n')),
        uname: a => say(a.includes('-a') ? 'Linux ubuntu 6.8.0-31-generic #31-Ubuntu SMP PREEMPT_DYNAMIC x86_64 x86_64 x86_64 GNU/Linux' : 'Linux'),
        lsb_release: () => say('Distributor ID:\tUbuntu\nDescription:\tUbuntu 24.04 LTS\nRelease:\t24.04\nCodename:\tnoble'),
        uptime: () => say(` ${new Date().toLocaleTimeString('en-GB')} up ${(Date.now() - BOOT0) / 6e4 | 0} min,  1 user,  load average: 0.12, 0.08, 0.02`),
        env: () => say('USER=ubuntu\nHOME=/home/ubuntu\nSHELL=/bin/bash\nLANG=en_US.UTF-8\nPWD=' + cwd + '\nXDG_CURRENT_DESKTOP=ubuntu:GNOME'),
        df: () => say('Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        50G   12G   36G  25% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm'),
        free: () => say('               total        used        free      shared  buff/cache   available\nMem:         4025884      912340     2210120       10240      903424     2956012\nSwap:        2097148           0     2097148'),
        ps: () => say('    PID TTY          TIME CMD\n   1021 pts/0    00:00:00 bash\n' + OS.wins.map((x, i) => `   ${1100 + i * 9} ?        00:00:0${i % 9} ${x.id}`).join('\n') + '\n   2201 pts/0    00:00:00 ps'),
        ifconfig: () => say('enp0s3: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.1.42  netmask 255.255.255.0  broadcast 192.168.1.255\n        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0'),
        ls: async a => { const fl = a.filter(x => x[0] !== '-'), long = a.some(x => /^-.*l/.test(x)), all = a.some(x => /^-.*a/.test(x)), p = norm(fl[0]); let names = [];
          if (p === HOME) names = [...Object.keys(DIRNAME), 'Public', 'Templates', 'snap'].sort().map(n => ({ n, d: 1 })); else if (fsKey(p)) names = (await FS.list(fsKey(p))).map(f => ({ n: f.name, d: 0, f })); else if (SYSDIRS[p] !== undefined) names = SYSDIRS[p].split(' ').filter(Boolean).map(n => ({ n, d: !/\./.test(n) && p !== '/etc' }));
          else { const f = await fileIn(p); if (f) return say(f.name); if (SYSFILES[p]) return say(p); return say(`ls: cannot access '${fl[0]}': No such file or directory`, 'er'); }
          if (all) names = [{ n: '.', d: 1 }, { n: '..', d: 1 }, ...names];
          if (long) html(names.map(x => `${x.d ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ubuntu ubuntu ${String(x.f ? x.f.size : 4096).padStart(8)} ${new Date(x.f ? x.f.added : BOOT0).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ${x.d ? `<b class="bl2">${escH(x.n)}</b>` : escH(x.n)}`).join('<br>'));
          else html(names.map(x => x.d ? `<b class="bl2">${escH(x.n)}</b>` : escH(x.n)).join('&nbsp;&nbsp;') || '&nbsp;'); },
        cd: a => { const p = norm(a[0] || '~'); if (isDir(p)) { cwd = p; upd(); } else say(`bash: cd: ${a[0]}: No such file or directory`, 'er'); },
        cat: async a => { for (const x of a) { const t = await readF(x); if (t !== null) say(t.replace(/\n$/, '')); else say(`cat: ${x}: No such file or directory`, 'er'); } },
        touch: async a => { for (const x of a) { const p = norm(x), k = dirOf(p); if (!k) { say(`touch: cannot touch '${x}': Permission denied`, 'er'); continue; } if (!(await fileIn(p))) await FS.save(p.split('/').pop(), 'text/plain', new Blob(['']), k); } },
        rm: async a => { for (const x of a.filter(y => y[0] !== '-')) { const f = await fileIn(norm(x)); if (!f) say(`rm: cannot remove '${x}': No such file or directory`, 'er'); else { await FS.del(f.id); OS.sync(); } } },
        mkdir: () => say('mkdir: this virtual file system only has the standard folders (Documents, Pictures …)', 'er'),
        tree: () => say('/home/ubuntu\n' + Object.keys(DIRNAME).map((n, i, l) => (i === l.length - 1 ? '└── ' : '├── ') + n).join('\n')),
        head: async a => { const n = a.includes('-n') ? +a[a.indexOf('-n') + 1] : 10, t = await readF(a[a.length - 1]); t === null ? say('head: cannot open file', 'er') : say(t.split('\n').slice(0, n).join('\n')); },
        tail: async a => { const n = a.includes('-n') ? +a[a.indexOf('-n') + 1] : 10, t = await readF(a[a.length - 1]); t === null ? say('tail: cannot open file', 'er') : say(t.replace(/\n$/, '').split('\n').slice(-n).join('\n')); },
        wc: async a => { const t = await readF(a[a.length - 1]); t === null ? say('wc: cannot open file', 'er') : say(`${(t.match(/\n/g) || []).length} ${t.split(/\s+/).filter(Boolean).length} ${t.length} ${a[a.length - 1]}`); },
        grep: async a => { const t = await readF(a[a.length - 1]); if (t === null) return say('grep: file not found', 'er'); let re; try { re = new RegExp(a[0].replace(/^["']|["']$/g, ''), 'i'); } catch (e) { return say('grep: bad pattern', 'er'); } say(t.split('\n').filter(l => re.test(l)).join('\n')); },
        cp: async a => { const f = await fileIn(norm(a[0] || '')), t = norm(a[1] || ''); if (!f) return say(`cp: cannot stat '${a[0]}'`, 'er'); const k = fsKey(t) || dirOf(t); if (!k) return say('cp: permission denied', 'er'); await FS.save(fsKey(t) ? f.name : t.split('/').pop(), f.type, f.blob, k); },
        mv: async a => { const f = await fileIn(norm(a[0] || '')), t = norm(a[1] || ''); if (!f) return say(`mv: cannot stat '${a[0]}'`, 'er'); const k = fsKey(t) || dirOf(t); if (!k) return say('mv: permission denied', 'er'); await FS.save(fsKey(t) ? f.name : t.split('/').pop(), f.type, f.blob, k); await FS.del(f.id); OS.sync(); },
        open: async a => { const f = await fileIn(norm(a[0] || '')); f ? openFile(f) : say(`open: ${a[0] || ''}: No such file`, 'er'); },
        man: a => say(`No manual entry for ${a[0] || ''} (virtual machine) — try: ${a[0] || 'cmd'} --help`), which: a => say(C[a[0]] || APPCMD[a[0]] ? '/usr/bin/' + a[0] : '', ''),
        curl: () => say('curl: network access is disabled in this virtual machine (no real traffic).', 'er'), wget: () => say('wget: network access is disabled in this virtual machine (no real traffic).', 'er'),
        cowsay: a => { const t = a.join(' ') || 'Moo'; say(` ${'_'.repeat(t.length + 2)}\n< ${t} >\n ${'-'.repeat(t.length + 2)}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`); },
        neofetch: () => html('<pre style="margin:0;line-height:1.25"><b class="or">       _,,ooOOOOoo,,_       </b> <b class="or">ubuntu</b>@<b class="or">ubuntu</b>\n<b class="or">    ,oOO\'   __   `OOo,    </b> ------------\n<b class="or">   oOO   ,-\'  `-.  OOo    </b> <b class="or">OS</b>: Ubuntu 24.04 LTS x86_64\n<b class="or">   OO\'  (   ()   )  `OO    </b> <b class="or">Host</b>: Virtual Browser PC\n<b class="or">   oOO   `-.__.-\'  OOo    </b> <b class="or">Kernel</b>: 6.8.0-31-generic\n<b class="or">    `oOO,_      _,OOo\'    </b> <b class="or">Uptime</b>: ' + ((Date.now() - BOOT0) / 6e4 | 0) + ' mins\n<b class="or">       `\'ooOOOOoo\'\'`       </b> <b class="or">Shell</b>: bash 5.2.21\n                              <b class="or">Resolution</b>: ' + innerWidth + 'x' + innerHeight + '\n                              <b class="or">DE</b>: GNOME 46\n                              <b class="or">Terminal</b>: gnome-terminal\n                              <b class="or">CPU</b>: ' + (navigator.hardwareConcurrency || 1) + ' threads\n                              <b class="or">Memory</b>: ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'n/a') + '</pre>'),
        ping: async a => { const h = a.find(x => x[0] !== '-') || 'localhost'; say(`PING ${h} (${h === 'localhost' ? '127.0.0.1' : '93.184.216.34'}) 56(84) bytes of data. [simulated]`); busy = true; for (let i = 1; i <= 4; i++) { await sleep(450); if (!busy) return; say(`64 bytes from ${h}: icmp_seq=${i} ttl=64 time=${(Math.random() * 20 + 4).toFixed(1)} ms`); } say(`\n--- ${h} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`); busy = false; },
        apt: async a => { const s = a[0], p = a[1]; if (s === 'update') { for (const l of ['Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease', 'Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]', 'Get:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]', 'Fetched 252 kB in 1s (252 kB/s)']) { say(l); await sleep(250); } say('Reading package lists... Done\nAll packages are up to date. (simulated)'); }
          else if (s === 'install' || s === 'remove') { const c = CATALOG.find(x => x[0] === p || x[1].toLowerCase() === (p || '').toLowerCase()); if (!c) return say(`E: Unable to locate package ${p || ''}`, 'er'); const l = installed(); say('Reading package lists... Done\nBuilding dependency tree... Done'); await sleep(500);
            if (s === 'install') { if (!l.includes(c[0])) jset('ubuntu_installed', [...l, c[0]]); say(`Setting up ${c[0]} ...\nProcessing triggers for desktop-file-utils ...`); } else { jset('ubuntu_installed', l.filter(x => x !== c[0])); delete APPS['x_' + c[0]]; say(`Removing ${c[0]} ...`); } registerInstalled(); OS.sync(); }
          else say('apt 2.7.14 (amd64) — simulated: update, install <app>, remove <app>. Try: sudo apt install vlc'); },
        sudo: a => a.length ? run(a.join(' ')) : say('usage: sudo command')
      }, APPCMD = { firefox: 'browser', nautilus: 'files', gedit: 'editor', 'gnome-text-editor': 'editor', 'gnome-calculator': 'calculator', eog: 'viewer', totem: 'media', 'gnome-system-monitor': 'sysmon', 'gnome-control-center': 'settings', 'gnome-terminal': 'terminal' };
      C.ip = a => a[0] === 'a' || a[0] === 'addr' ? C.ifconfig() : say('Usage: ip [ addr ]');
      const run = async line => { const [c, ...a] = line.trim().split(/\s+/); if (!c) return; const cm = c.toLowerCase();
        const red = line.match(/^echo\s+(.*?)\s*>\s*(\S+)\s*$/); if (red) { const p = norm(red[2]), k = dirOf(p); if (!k) return say(`bash: ${red[2]}: Permission denied`, 'er'); return void await FS.save(p.split('/').pop(), 'text/plain', new Blob([red[1].replace(/^["']|["']$/g, '') + '\n']), k); }
        if (C[cm]) return C[cm](a); if (APPCMD[cm]) { if (cm === 'gedit' && a[0]) { const f = await fileIn(norm(a[0])); return OS.open('editor', f ? f.id : undefined); } return OS.open(APPCMD[cm]); }
        if (cm === 'exit' || cm === 'logout') return w.close(); say(`${c}: command not found`, 'er'); };
      w.api.run = async cmd => { html(pr() + escH(cmd)); await run(cmd); };
      inp.onkeydown = async e => { if (e.key === 'Enter') { const v = inp.value; html(pr() + escH(v)); if (v.trim()) hist.push(v); hi = hist.length; inp.value = ''; await run(v); term.scrollTop = 1e9; }
        else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; } else if (e.ctrlKey && e.key === 'l') { e.preventDefault(); to.textContent = ''; } else if (e.ctrlKey && e.key === 'c') { busy = false; say('^C'); } };
      term.onclick = () => { if (!getSelection().toString()) inp.focus(); }; upd(); setTimeout(() => { inp.focus(); if (arg && arg.run) w.api.run(arg.run); }, 60); w.api.arg = a => a && a.run && w.api.run(a.run);
    } },
  files: { name: 'Files', icon: '📁', w: 800, h: 500,
    render(b, w, arg) {
      let loc = (arg && arg.loc) || 'home', sel = null, hist = [], urls = {}, items = []; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const PL = [['home', '🏠 Home'], ['desktop', '🖥 Desktop'], ['docs', '📄 Documents'], ['downloads', '⬇ Downloads'], ['music', '🎵 Music'], ['pics', '🖼 Pictures'], ['videos', '🎞 Videos'], ['trash', '🗑 Trash'], ['-', ''], ['sys', '💽 Other Locations']];
      const upload = () => pickFiles('', fs => FS.import(fs, ['home', 'sys', 'trash'].includes(loc) ? undefined : loc)), go = l => { hist.push(loc); loc = l; sel = null; draw(); };
      b.innerHTML = '<div class="fm"><div class="hbar"><button class="btn" data-a="back">◀</button><button class="btn" data-a="up">▲</button><div class="pth"></div><button class="btn pri" data-a="up2">⬆ Upload</button><button class="btn" data-a="new">＋ New File</button></div><div class="fb"><div class="fs"></div><div class="fr"></div></div><div class="fst"></div></div>'; const fm = $('.fm', b);
      const path = l => l === 'home' ? '/home/ubuntu' : l === 'sys' ? '/' : '/home/ubuntu/' + (l === 'trash' ? '.local/share/Trash/files' : LOC[l]);
      const draw = async () => { w.setTitle((l => l === 'home' ? 'Home' : l === 'sys' ? 'Other Locations' : LOC[l])(loc)); $('.pth', fm).textContent = path(loc);
        $('.fs', fm).innerHTML = PL.map(p => p[0] === '-' ? '<hr>' : `<div data-go="${p[0]}" class="${loc === p[0] ? 'on' : ''}">${p[1]}</div>`).join('');
        if (loc === 'home') items = [...Object.entries(DIRNAME).map(([n, k]) => ({ k: 'dir', loc: k, name: n, icon: '📁' })), { k: 'dir', loc: 'trash', name: 'Trash', icon: '🗑️' }];
        else if (loc === 'sys') items = 'bin boot dev etc home lib media mnt opt proc root run sbin snap srv sys tmp usr var'.split(' ').map(n => ({ k: 'static', name: n, icon: '📁' }));
        else items = (await FS.list(loc)).map(f => ({ k: 'file', f, name: f.name, icon: fileIcon(f) }));
        $('.fr', fm).innerHTML = items.map((x, i) => `<div class="it${sel === i ? ' sel' : ''}" data-i="${i}">${x.k === 'file' && isImg(x.f) ? `<i><img src="${U(x.f)}" alt=""></i>` : `<i>${x.icon}</i>`}<span>${escH(x.name)}</span></div>`).join('') || '<div style="color:var(--tx2);padding:30px">Folder is Empty — use Upload, or drag & drop files here.</div>'; stat(); };
      const stat = () => { const s = items[sel]; $('.fst', fm).textContent = s ? (s.k === 'file' ? `“${s.name}” selected (${fsize(s.f.size)}, ${s.f.type || 'unknown type'})` : `“${s.name}” selected (folder)`) : `${items.length} item(s)`; };
      const act = async a => { const s = items[sel], f = s && s.f;
        if (a === 'back') { hist.length && (loc = hist.pop(), sel = null, draw()); } else if (a === 'up') loc !== 'home' && go('home'); else if (a === 'up2') upload();
        else if (a === 'new' && !['home', 'sys', 'trash'].includes(loc)) OS.dialog({ title: 'New File', html: 'File name:<br><input id="fn" class="in" value="Untitled Document" style="width:260px;margin-top:6px">', buttons: [['Create', m => FS.save($('#fn', m).value.trim() || 'Untitled Document', 'text/plain', new Blob(['']), loc)], ['Cancel']] });
        else if (a === 'dl' && f) download(f); else if (a === 'del' && f) { if (loc === 'trash') await FS.del(f.id); else await FS.put({ ...f, from: f.folder, folder: 'trash' }); sel = null; OS.sync(); }
        else if (a === 'restore' && f) { await FS.put({ ...f, folder: f.from || 'docs' }); sel = null; OS.sync(); } else if (a === 'empty') { for (const x of items) await FS.del(x.f.id); sel = null; OS.sync(); } };
      const openIt = x => { if (x.k === 'dir') go(x.loc); else if (x.k === 'file') openFile(x.f); };
      fm.onclick = e => { const a = e.target.closest('[data-a]'), g = e.target.closest('[data-go]'), i = e.target.closest('[data-i]'); if (a) act(a.dataset.a); else if (g) go(g.dataset.go); else if (i) { sel = +i.dataset.i; $$('.it', fm).forEach(n => n.classList.toggle('sel', n === i)); stat(); } else if (e.target.closest('.fr')) { sel = null; $$('.it', fm).forEach(n => n.classList.remove('sel')); stat(); } };
      fm.ondblclick = e => { const i = e.target.closest('[data-i]'); if (i) openIt(items[+i.dataset.i]); };
      fm.oncontextmenu = e => { const i = e.target.closest('[data-i]'); e.preventDefault(); e.stopPropagation(); if (!i) return OS.menu(e.clientX, e.clientY, [['Upload files…', upload], ['New File', () => act('new')], ['Empty Trash', () => act('empty'), loc !== 'trash']]); sel = +i.dataset.i; const x = items[sel]; draw();
        OS.menu(e.clientX, e.clientY, [['Open', () => openIt(x)], ...(x.k === 'file' ? [loc === 'trash' ? ['Restore', () => act('restore')] : null, ['Download', () => act('dl')], '-', [loc === 'trash' ? 'Delete Permanently' : 'Move to Trash', () => act('del')]].filter(Boolean) : [])]); };
      b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); e.stopPropagation(); FS.import(e.dataTransfer.files, ['home', 'sys', 'trash'].includes(loc) ? undefined : loc); };
      b.tabIndex = 0; b.onkeydown = e => { if (e.key === 'Delete' && items[sel] && items[sel].k === 'file') act('del'); };
      w.api.sync = draw; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } },
  browser: { name: 'Firefox', icon: '🦊', w: 880, h: 540,
    render(b, w, arg) {
      const home = '<body style="margin:0;font:15px sans-serif;background:#f9f9fb;color:#15141a;text-align:center;padding-top:80px"><div style="font-size:54px">🦊</div><h1 style="font-weight:500">Firefox</h1><p>Type an address above and press Enter.</p><p style="color:#5b5b66;font-size:13px">Many sites block framing — use ↗ to open them in a real tab.</p><p><a style="color:#0060df" href="https://ubuntu.com">ubuntu.com</a> · <a style="color:#0060df" href="https://en.wikipedia.org">Wikipedia</a> · <a style="color:#0060df" href="https://www.openstreetmap.org">OpenStreetMap</a></p></body>';
      b.innerHTML = '<div class="br"><div class="hbar"><button class="btn" data-a="back">◀</button><button class="btn" data-a="fw">▶</button><button class="btn" data-a="rl">⟳</button><button class="btn" data-a="home">🏠</button><input class="in" id="u" placeholder="Search with DuckDuckGo or enter address"><button class="btn" data-a="ext" title="Open in a real tab">↗</button></div><iframe></iframe></div>';
      const f = $('iframe', b), u = $('#u', b); let H = [], i = -1;
      const nav = (v, push = true) => { v = (v || '').trim(); if (!v) return; if (!/^(https?:|about:)/.test(v)) v = /^[\w-]+(\.[\w-]+)+/.test(v) && !v.includes(' ') ? 'https://' + v : 'https://duckduckgo.com/?q=' + encodeURIComponent(v); if (push) { H = H.slice(0, i + 1); H.push(v); i++; } u.value = v === 'about:home' ? '' : v; if (v === 'about:home') { f.removeAttribute('src'); f.srcdoc = home; } else { f.removeAttribute('srcdoc'); f.src = v; } };
      b.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'home') nav('about:home'); else if (k === 'rl') nav(H[i], false); else if (k === 'back' && i > 0) nav(H[--i], false); else if (k === 'fw' && i < H.length - 1) nav(H[++i], false); else if (k === 'ext') window.open(u.value || 'https://ubuntu.com', '_blank'); };
      u.onkeydown = e => { if (e.key === 'Enter') nav(u.value); }; nav(arg && arg.url || 'about:home');
    } },
  editor: { name: 'Text Editor', icon: '📝', w: 640, h: 440,
    render(b, w, arg) {
      let id = null, name = 'Untitled Document', folder = 'docs'; b.style.display = 'flex'; b.style.flexDirection = 'column'; const ta = document.createElement('textarea'); ta.className = 'ed'; ta.spellcheck = false; const title = () => w.setTitle(name + ' — Text Editor');
      const load = async fid => { const f = fid && await FS.get(fid); if (f) { ta.value = await f.blob.text(); id = f.id; name = f.name; folder = f.folder; title(); } };
      const save = async n => { if (n) name = n; const r = await FS.save(name, 'text/plain', new Blob([ta.value], { type: 'text/plain' }), folder, id); id = r.id; title(); OS.notify('Text Editor', `Saved to ${LOC[folder]}`); };
      const bar = document.createElement('div'); bar.className = 'hbar'; bar.innerHTML = '<button class="btn" data-a="open">Open</button><span style="flex:1"></span><button class="btn pri" data-a="save">Save</button><button class="btn" data-a="as">Save As…</button><button class="btn" data-a="new">New</button>';
      bar.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'new') { ta.value = ''; id = null; name = 'Untitled Document'; title(); } else if (k === 'open') pickFiles('', async fs => { ta.value = await fs[0].text(); name = fs[0].name; id = null; title(); }); else if (k === 'save') id || name !== 'Untitled Document' ? save() : saveAsDlg('Untitled.txt', save); else saveAsDlg(name === 'Untitled Document' ? 'Untitled.txt' : name, n => { id = null; save(n); }); };
      b.appendChild(bar); b.appendChild(ta); ta.style.flex = '1'; title(); load(arg); w.api.arg = load;
    } },
  calculator: { name: 'Calculator', icon: '🧮', w: 300, h: 400, fixed: 1,
    render(b) {
      let x = ''; b.innerHTML = '<div class="calc"><div class="cd">0</div><div class="cg"></div></div>'; const K = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='], d = $('.cd', b);
      $('.cg', b).innerHTML = K.map(k => `<button class="${/[\/*\-+=]/.test(k) && k.length === 1 ? 'op' : ''}">${k}</button>`).join('');
      $('.cg', b).onclick = e => { const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return; if (x === 'Error') x = ''; if (k === 'C') x = ''; else if (k === '⌫') x = x.slice(0, -1); else if (k === '=') { try { if (!/^[\d+\-*/.() ]+$/.test(x)) throw 0; x = String(+Function('return ' + x)().toFixed(10)); } catch (er) { x = 'Error'; } } else x += k; d.textContent = x || '0'; };
    } },
  viewer: { name: 'Image Viewer', icon: '🖼️', w: 680, h: 500,
    render(b, w, arg) {
      let url = null, rec = null; b.style.display = 'flex'; b.style.flexDirection = 'column';
      const bar = document.createElement('div'); bar.className = 'hbar'; bar.innerHTML = '<span style="flex:1"></span><button class="btn pri" data-a="wall">Set as Background</button><button class="btn" data-a="dl">⬇ Download</button>'; bar.onclick = e => { const a = e.target.closest('[data-a]'); if (!a || !rec) return; if (a.dataset.a === 'wall') { OS.set({ wall: 'u:' + rec.id }); OS.notify('Background', 'Desktop background changed'); } else download(rec); };
      const v = document.createElement('div'); v.className = 'vw'; v.style.flex = '1'; b.appendChild(bar); b.appendChild(v);
      const load = async id => { rec = await FS.get(id); if (!rec) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(rec.blob); v.innerHTML = `<img src="${url}" alt="">`; w.setTitle(rec.name); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  media: { name: 'Videos & Music', icon: '🎬', w: 540, h: 380,
    render(b, w, arg) {
      let url = null; const load = async id => { const r = await FS.get(id); if (!r) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(r.blob);
        b.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#1b1b1b;color:#eee">${isVideo(r) ? `<video src="${url}" controls autoplay style="max-width:100%;max-height:82%"></video>` : `<div style="font-size:70px">🎵</div><audio src="${url}" controls autoplay style="width:80%"></audio>`}<b>${escH(r.name)}</b></div>`; w.setTitle(r.name); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  sysmon: { name: 'System Monitor', icon: '📊', w: 520, h: 460, single: 1,
    render(b, w) {
      let tab = 'proc', sel = null, cpu = Array(50).fill(6); b.style.display = 'flex'; b.style.flexDirection = 'column'; const list = () => OS.wins.filter(x => x.id !== 'sysmon');
      const draw = () => { const L = list(); cpu.push(Math.min(100, 4 + L.length * 5 + Math.random() * 14)); cpu.shift(); const c = cpu[cpu.length - 1] | 0; let h = '';
        if (tab === 'proc') h = `<div style="flex:1;overflow:auto"><table class="wsh"><thead><tr><th>Process Name</th><th>Status</th><th>% CPU</th><th>ID</th></tr></thead><tbody>${L.map((x, i) => `<tr data-w="${i}" class="${sel === x ? 'on' : ''}"><td>${x.app.icon} ${escH($('.tt', x.el).textContent)}</td><td>${x.min ? 'Sleeping' : 'Running'}</td><td>${(x.min ? 0 : 1 + (i * 3) % 7)}</td><td>${1100 + i * 9}</td></tr>`).join('') || '<tr><td colspan="4">No applications running</td></tr>'}</tbody></table></div><div class="hbar"><span style="flex:1"></span><button class="btn pri" data-a="kill">End Process</button></div>`;
        else if (tab === 'res') h = `<div style="padding:16px"><b>CPU ${c}%</b><canvas id="cg" width="470" height="110" style="background:var(--bg2);border:1px solid var(--bd);border-radius:8px;width:100%;margin:8px 0"></canvas><b>Memory</b><div style="margin:6px 0 14px">${performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB used (browser)' : 'n/a'}</div><b>Threads</b> ${navigator.hardwareConcurrency || 1}</div>`;
        else h = '<div style="padding:16px"><table class="wsh"><thead><tr><th>Device</th><th>Directory</th><th>Total</th><th>Used</th></tr></thead><tbody><tr><td>/dev/sda2</td><td>/</td><td>50 GB</td><td>12 GB</td></tr><tr><td>tmpfs</td><td>/dev/shm</td><td>2 GB</td><td>0 B</td></tr></tbody></table></div>';
        b.innerHTML = `<div class="hbar">${[['proc', 'Processes'], ['res', 'Resources'], ['fs', 'File Systems']].map(t => `<button class="btn ${tab === t[0] ? 'pri' : ''}" data-t="${t[0]}">${t[1]}</button>`).join('')}</div>${h}`;
        const g = $('#cg', b); if (g) { const x = g.getContext('2d'); x.strokeStyle = '#e95420'; x.lineWidth = 2; x.beginPath(); cpu.forEach((v, i) => x[i ? 'lineTo' : 'moveTo'](i * 9.6, 110 - v * 1.05)); x.stroke(); } };
      b.onclick = e => { const t = e.target.closest('[data-t]'), r = e.target.closest('[data-w]'), a = e.target.closest('[data-a]'); if (t) tab = t.dataset.t; else if (r) sel = list()[+r.dataset.w]; else if (a && sel) { OS.close(sel); sel = null; } draw(); };
      const iv = setInterval(() => b.isConnected ? draw() : clearInterval(iv), 1000); w.api.close = () => clearInterval(iv); draw();
    } },
  settings: { name: 'Settings', icon: '⚙️', w: 760, h: 520, single: 1,
    render(b, w, arg) {
      let tab = (arg && arg.tab) || 'bg', urls = {}; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const TABS = [['net', '🌐 Network'], ['bt', '🔵 Bluetooth'], ['bg', '🖼 Background'], ['look', '🎨 Appearance'], ['notif', '🔔 Notifications'], ['disp', '🖥 Displays'], ['snd', '🔊 Sound'], ['pwr', '🔋 Power'], ['dt', '🕒 Date & Time'], ['usr', '👤 Users'], ['about', 'ℹ About']];
      const tgl = (k, on) => `<div class="tg${on ? ' on' : ''}" data-tg="${k}"></div>`;
      const draw = async () => { const s = OS.settings; let h = '';
        if (tab === 'bg') { const pics = (await FS.list('pics')).filter(isImg); h = `<h3>Background</h3><div class="wg">${WALLS.map(x => `<div class="wt${s.wall === x.id ? ' on' : ''}" data-w="${x.id}" style="background-image:url('${x.img}')"><small>${x.name}</small></div>`).join('')}${pics.map(f => `<div class="wt${s.wall === 'u:' + f.id ? ' on' : ''}" data-w="u:${f.id}" style="background-image:url('${U(f)}')"><small>${escH(f.name)}</small></div>`).join('')}</div><button class="btn pri" data-up>⬆ Add Picture…</button> &nbsp; Style: <select id="fit">${['zoom', 'center', 'tile', 'stretch'].map(p => `<option${s.fit === p ? ' selected' : ''}>${p}</option>`).join('')}</select>`; }
        else if (tab === 'look') h = `<h3>Appearance</h3><div class="grp"><div class="row">Style<span><select id="th"><option value="light"${!s.dark ? ' selected' : ''}>Light</option><option value="dark"${s.dark ? ' selected' : ''}>Dark</option></select></span></div></div><b>Accent colour</b><br><br>${ACCENTS.map(c => `<span class="sw${s.accent === c[0] ? ' on' : ''}" data-ac="${c[0]}" style="background:${c[1]}" title="${c[0]}"></span>`).join('')}`;
        else if (tab === 'net') h = `<h3>Network</h3><div class="grp"><div class="row"><span>Wired<br><small>Connected — 1000 Mb/s</small></span>${tgl('net', s.net)}</div><div class="row"><span>Airplane Mode</span>${tgl('plane', s.plane)}</div></div><small>IP 192.168.1.42 (simulated network)</small>`;
        else if (tab === 'bt') h = `<h3>Bluetooth</h3><div class="grp"><div class="row">Bluetooth${tgl('bt', s.bt)}</div></div>`;
        else if (tab === 'notif') h = `<h3>Notifications</h3><div class="grp"><div class="row">Do Not Disturb${tgl('dnd', s.dnd)}</div></div>`;
        else if (tab === 'disp') h = `<h3>Displays</h3><div class="grp"><div class="row">Brightness<input type="range" id="br" min="30" max="100" value="${s.brightness}"></div><div class="row">Night Light${tgl('night', s.night)}</div><div class="row">Resolution<small>${innerWidth} × ${innerHeight}</small></div></div>`;
        else if (tab === 'snd') h = `<h3>Sound</h3><div class="grp"><div class="row">Output Volume<input type="range" id="vl" min="0" max="100" value="${s.vol}"></div></div>`;
        else if (tab === 'pwr') h = `<h3>Power</h3><div class="grp"><div class="row">Battery<small id="pb">${OS.battery}</small></div></div>`;
        else if (tab === 'dt') h = `<h3>Date & Time</h3><div class="grp"><div class="row">Date & Time<small>${new Date().toLocaleString()}</small></div><div class="row">Time Zone<small>${Intl.DateTimeFormat().resolvedOptions().timeZone}</small></div></div>`;
        else if (tab === 'usr') h = '<h3>Users</h3><div class="grp"><div class="row"><span>Ubuntu<br><small>Administrator</small></span><div style="width:44px;height:44px;border-radius:50%;background:var(--ac);color:#fff;display:grid;place-items:center;font-size:20px">U</div></div></div>';
        else h = `<h3>About</h3><div style="font-size:54px;margin-bottom:8px">🟠</div><div class="grp"><div class="row">Device Name<small>ubuntu</small></div><div class="row">OS Name<small>Ubuntu 24.04 LTS</small></div><div class="row">GNOME Version<small>46</small></div><div class="row">Processor<small>${navigator.hardwareConcurrency || 1} threads</small></div><div class="row">Memory<small>${navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'n/a'}</small></div></div><small>Virtual replica — not affiliated with Canonical.</small>`;
        b.innerHTML = `<div class="sx"><div class="sxl">${TABS.map(t => `<div data-t="${t[0]}" class="${tab === t[0] ? 'on' : ''}">${t[1]}</div>`).join('')}</div><div class="sxr">${h}</div></div>`; };
      b.onclick = e => { const t = e.target.closest('[data-t]'), x = e.target.closest('[data-w]'), a = e.target.closest('[data-ac]'), g = e.target.closest('[data-tg]'); if (t) { tab = t.dataset.t; draw(); } else if (x) OS.set({ wall: x.dataset.w }); else if (a) OS.set({ accent: a.dataset.ac }); else if (g) OS.set({ [g.dataset.tg]: !OS.settings[g.dataset.tg] });
        else if (e.target.closest('[data-up]')) pickFiles('image/*', async fs => { const ids = await FS.import(fs); if (ids[0]) OS.set({ wall: 'u:' + ids[0] }); }); };
      b.onchange = e => { if (e.target.id === 'fit') OS.set({ fit: e.target.value }); else if (e.target.id === 'th') OS.set({ dark: e.target.value === 'dark' }); }; b.oninput = e => { if (e.target.id === 'br') OS.set({ brightness: +e.target.value }); else if (e.target.id === 'vl') OS.set({ vol: +e.target.value }); };
      w.api.sync = () => { const a = document.activeElement; if (!(a && a.type === 'range' && b.contains(a)) && !$('select:focus', b)) draw(); }; w.api.arg = a2 => { if (a2 && a2.tab) { tab = a2.tab; draw(); } }; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } },
  software: { name: 'Ubuntu Software', icon: '🛍️', w: 760, h: 500, single: 1,
    render(b, w) {
      const draw = () => { const ins = installed(); b.innerHTML = `<div class="hbar"><b>Explore</b><span style="flex:1"></span><small style="color:var(--tx2)">Installs are simulated — apps open as placeholders.</small></div><div class="sc">${CATALOG.map(c => `<div class="sci"><i>${c[2]}</i><div><b>${c[1]}</b><small>${c[3]}</small></div><button class="btn ${ins.includes(c[0]) ? '' : 'pri'}" data-i="${c[0]}">${ins.includes(c[0]) ? 'Remove' : 'Install'}</button></div>`).join('')}</div>`; };
      b.onclick = async e => { const i = e.target.closest('[data-i]'); if (!i) return; const id = i.dataset.i, l = installed(); i.textContent = '…'; await new Promise(r => setTimeout(r, 700)); if (l.includes(id)) { jset('ubuntu_installed', l.filter(x => x !== id)); delete APPS['x_' + id]; OS.notify('Ubuntu Software', 'Removed ' + CATALOG.find(c => c[0] === id)[1]); } else { jset('ubuntu_installed', [...l, id]); registerInstalled(); OS.notify('Ubuntu Software', 'Installed ' + CATALOG.find(c => c[0] === id)[1]); } draw(); OS.sync(); };
      w.api.sync = draw; draw();
    } },
  calendar: { name: 'Calendar', icon: '📅', w: 380, h: 420,
    render(b) { let y = new Date().getFullYear(), m = new Date().getMonth(); const T = new Date();
      const draw = () => { const f = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(); let h = DAYS.map(d => `<b>${d}</b>`).join('') + '<i></i>'.repeat(f); for (let i = 1; i <= n; i++) h += `<span class="${i === T.getDate() && m === T.getMonth() && y === T.getFullYear() ? 't' : ''}">${i}</span>`;
        b.innerHTML = `<div class="hbar"><button class="btn" data-p="-1">‹</button><b style="flex:1;text-align:center">${MONTHS[m]} ${y}</b><button class="btn" data-p="1">›</button></div><div style="padding:16px"><div class="cal">${h}</div></div>`; };
      b.onclick = e => { const p = e.target.closest('[data-p]'); if (p) { m += +p.dataset.p; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } draw(); } }; draw(); } },
  clocks: { name: 'Clocks', icon: '🕒', w: 420, h: 440,
    render(b, w) {
      const Z = [['Local'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Kolkata', 'Asia/Kolkata'], ['Tokyo', 'Asia/Tokyo']]; let t0 = 0, run = 0, acc = 0;
      b.innerHTML = '<div class="sc" style="display:block"><div class="grp" id="wc"></div><div style="text-align:center"><div id="swt" style="font-size:44px;font-weight:300;margin:6px">00:00.0</div><button class="btn pri" id="sb">Start</button> <button class="btn" id="sr">Reset</button></div></div>';
      const f = z => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z });
      const tick = () => { $('#wc', b).innerHTML = Z.map(([n, z]) => `<div class="row"><span>${n}</span><b style="font-weight:500">${f(z)}</b></div>`).join(''); if (run) acc = Date.now() - t0; const s = acc / 1e3 | 0; $('#swt', b).textContent = String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + '.' + (acc / 100 % 10 | 0); };
      const iv = setInterval(tick, 100); tick(); w.api.close = () => clearInterval(iv);
      $('#sb', b).onclick = function () { run = !run; if (run) t0 = Date.now() - acc; this.textContent = run ? 'Stop' : 'Start'; }; $('#sr', b).onclick = () => { acc = 0; if (run) t0 = Date.now(); };
    } }
};
registerInstalled();

/* ===== Kali Linux (Virtual) — helpers, file system, terminal and apps =====
   App: { name, icon, w, h, fixed?, single?, cat?, render(body, win, arg) }
   win: { setTitle(t), close(), el, body, api:{ arg(a), sync(), close() } } */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const escH = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WALLS = [{ id: 'k1', name: 'Kali Dark', img: 'assets/kali-dark.svg' }, { id: 'k2', name: 'Kali Blue', img: 'assets/kali-blue.svg' }, { id: 'k3', name: 'Kali Purple', img: 'assets/kali-purple.svg' }, { id: 'k4', name: 'Kali Red', img: 'assets/kali-red.svg' }, { id: 'k5', name: 'Kali Circuit', img: 'assets/kali-circuit.svg' }, { id: 'k6', name: 'Kali Ring', img: 'assets/kali-ring.svg' }];
const LOC = { desktop: 'Desktop', docs: 'Documents', downloads: 'Downloads', music: 'Music', pics: 'Pictures', videos: 'Videos', trash: 'Trash' };
const DIRNAME = { Desktop: 'desktop', Documents: 'docs', Downloads: 'downloads', Music: 'music', Pictures: 'pics', Videos: 'videos' };
const isImg = f => /^image/.test(f.type) || /\.(png|jpe?g|gif|bmp|webp|svg|avif)$/i.test(f.name);
const isAudio = f => /^audio/.test(f.type) || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name);
const isVideo = f => /^video/.test(f.type) || /\.(mp4|webm|mkv|mov)$/i.test(f.name);
const isText = f => /^text|json/.test(f.type) || /\.(txt|md|json|csv|log|js|py|sh|c|css|html?|xml|ini|conf|yml|yaml)$/i.test(f.name);
const isDoc = f => isText(f) || /pdf|word|office|document|\.(pdf|docx?|xlsx?|pptx?|odt)$/i.test(f.type + f.name);
const fsize = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KiB' : (n / 1048576).toFixed(1) + ' MiB';
const fileIcon = f => isImg(f) ? '🖼️' : isAudio(f) ? '🎵' : isVideo(f) ? '🎞️' : /pdf/.test(f.type + f.name) ? '📕' : isText(f) ? '📄' : /zip|rar|7z|tar|gz/.test(f.type + f.name) ? '🗜️' : '📎';
const pickFiles = (accept, cb) => { const i = document.createElement('input'); i.type = 'file'; i.multiple = true; if (accept) i.accept = accept; i.onchange = () => { if (i.files.length) cb(i.files); }; i.click(); };
const download = f => { const u = URL.createObjectURL(f.blob), a = document.createElement('a'); a.href = u; a.download = f.name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 6e4); };

/* ---------- file system in the browser (IndexedDB) ---------- */
const FS = (() => {
  let db; const open = () => db || (db = new Promise((res, rej) => { const r = indexedDB.open('kali_fs', 1); r.onupgradeneeded = () => r.result.createObjectStore('f', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const tx = async (m, fn) => { const d = await open(); return new Promise((res, rej) => { const t = d.transaction('f', m), r = fn(t.objectStore('f')); t.oncomplete = () => res(r && r.result); t.onerror = t.onabort = () => rej(t.error); }); };
  const self = {
    list: async f => ((await tx('readonly', s => s.getAll()).catch(() => [])) || []).filter(x => x.folder === f).sort((a, b) => a.name.localeCompare(b.name)),
    get: id => tx('readonly', s => s.get(id)), put: r => tx('readwrite', s => s.put(r)), del: id => tx('readwrite', s => s.delete(id)),
    async save(name, type, blob, folder, id) { const r = { id: id || 'f' + Date.now() + Math.random().toString(36).slice(2, 6), name, type, size: blob.size, folder, added: Date.now(), blob }; await self.put(r); OS.sync(); return r; },
    /* upload: images → Pictures, audio → Music, video → Videos, documents → Documents, everything else → Downloads (or the folder given) */
    async import(files, folder) {
      const cnt = {}, ids = [];
      try { for (const f of [...files]) { const m = { name: f.name, type: f.type }, fo = folder || (isImg(m) ? 'pics' : isAudio(m) ? 'music' : isVideo(m) ? 'videos' : isDoc(m) ? 'docs' : 'downloads'); const r = await self.save(f.name, f.type, f, fo); cnt[fo] = (cnt[fo] || 0) + 1; ids.push(r.id); } }
      catch (e) { OS.notify('File copy failed', 'The browser storage is full or blocked.'); }
      const t = Object.entries(cnt).map(([k, n]) => `${n} → ${LOC[k]}`).join(', '); if (t) OS.notify('Files copied', t); return ids;
    }
  };
  return self;
})();
function openFile(f) {
  if (isImg(f)) OS.open('viewer', f.id); else if (isText(f)) OS.open('editor', f.id); else if (isAudio(f) || isVideo(f)) OS.open('media', f.id);
  else if (/pdf/.test(f.type + f.name)) { const u = URL.createObjectURL(f.blob); window.open(u, '_blank'); setTimeout(() => URL.revokeObjectURL(u), 6e4); } else download(f);
}
const mbar = spec => {
  const m = document.createElement('div'); m.className = 'mbar'; m.innerHTML = Object.keys(spec).map(k => `<span data-m="${k}">${k}</span>`).join('');
  m.onclick = e => { const s = e.target.closest('[data-m]'), o = $('.mdd', m); o && o.remove(); if (!s) return; const items = spec[s.dataset.m], r = document.createElement('div'); r.className = 'mdd'; r.style.left = s.offsetLeft + 'px';
    r.innerHTML = items.map((x, i) => x === '-' ? '<hr>' : `<div data-i="${i}">${x[0]}</div>`).join(''); m.appendChild(r);
    r.onclick = ev => { const it = ev.target.closest('[data-i]'); if (it) { r.remove(); const f = items[it.dataset.i][1]; f && f(); } };
    const off = ev => { if (!m.contains(ev.target)) { r.remove(); removeEventListener('pointerdown', off, true); } }; addEventListener('pointerdown', off, true); };
  return m;
};
const saveAsDlg = (name, cb) => OS.dialog({ title: 'Save As', html: 'Name:<br><input id="fn" class="in" style="width:260px" value="' + escH(name) + '">', buttons: [['Save', m => cb($('#fn', m).value.trim() || name)], ['Cancel']] });

/* ---------- Kali menu: categories + (simulated) tools ---------- */
const CATS = [['fav', 'Favorites', '⭐'], ['recent', 'Recently Used', '🕘'], ['usual', 'Usual Applications', '🧰'], ['01', '01 - Information Gathering', '🔎'], ['02', '02 - Vulnerability Analysis', '🩺'], ['03', '03 - Web Application Analysis', '🕸'], ['04', '04 - Database Assessment', '🗄'], ['05', '05 - Password Attacks', '🔑'], ['06', '06 - Wireless Attacks', '📡'], ['07', '07 - Reverse Engineering', '🧬'], ['08', '08 - Exploitation Tools', '💥'], ['09', '09 - Sniffing & Spoofing', '👃'], ['10', '10 - Post Exploitation', '🧗'], ['11', '11 - Forensics', '🔬'], ['12', '12 - Reporting Tools', '📝'], ['13', '13 - Social Engineering Tools', '🎭'], ['42', '42 - Kali & OffSec Links', '🔗']];
const FAVS = ['terminal', 'files', 'browser', 'editor', 'settings'];
const USUAL = [['Accessories', ['calculator', 'editor', 'notes', 'appfinder', 'files']], ['Graphics', ['viewer']], ['Internet', ['browser']], ['Multimedia', ['media']], ['System', ['terminal', 'taskmgr', 'files', 'settings']]];
/* tool entry: [command, label, kind?, url?] — kind 'app' opens a built-in app, 'url' opens a link, otherwise the command runs in a terminal (simulated) */
const T = (...l) => l.map(x => typeof x === 'string' ? [x, x] : x);
const TOOLS = {
  '01': T('nmap', ['zenmap', 'Zenmap', 'app'], 'dmitry', 'dnsenum', 'dnsmap', 'dnsrecon', 'fierce', 'ike-scan', ['maltego', 'Maltego'], 'netdiscover', 'nbtscan', 'recon-ng', 'smbmap', 'spiderfoot', ['theharvester', 'theHarvester'], 'wafw00f', 'whois'),
  '02': T(['legion', 'Legion'], 'lynis', 'nikto', 'nmap', 'unix-privesc-check', ['openvas', 'OpenVAS (GVM)']),
  '03': T(['burpsuite', 'Burp Suite', 'app'], 'commix', 'dirb', ['dirbuster', 'DirBuster'], 'ffuf', 'nikto', 'skipfish', 'sqlmap', 'wapiti', 'wfuzz', 'whatweb', 'wpscan', ['zaproxy', 'OWASP ZAP']),
  '04': T('sqlmap', ['sqlitebrowser', 'DB Browser for SQLite'], 'sqlninja', ['jsql', 'jSQL Injection']),
  '05': T('cewl', 'crunch', 'hashcat', 'hash-identifier', 'hydra', ['john', 'John the Ripper'], 'medusa', 'ncrack', 'ophcrack', 'wordlists'),
  '06': T('aircrack-ng', ['fern-wifi-cracker', 'Fern Wifi Cracker'], 'kismet', 'mdk4', 'pixiewps', 'reaver', 'wifite'),
  '07': T('apktool', ['edb-debugger', 'EDB Debugger'], ['ghidra', 'Ghidra'], 'gdb', 'jadx', 'radare2'),
  '08': T('msfconsole', 'msfvenom', 'searchsploit', ['beef-xss', 'BeEF XSS Framework'], 'crackmapexec', ['setoolkit', 'Social Engineering Toolkit']),
  '09': T(['wireshark', 'Wireshark', 'app'], 'bettercap', 'ettercap', 'macchanger', 'mitmproxy', 'netsniff-ng', 'responder', 'tcpdump'),
  '10': T('evil-winrm', 'mimikatz', 'proxychains', ['powershell-empire', 'PowerShell Empire'], 'weevely', 'chisel'),
  '11': T(['autopsy', 'Autopsy'], 'binwalk', 'bulk_extractor', 'exiftool', 'foremost', 'volatility3'),
  '12': T('cutycapt', 'dradis', 'faraday', 'pipal', 'recordmydesktop'),
  '13': T(['setoolkit', 'Social Engineering Toolkit'], ['beef-xss', 'BeEF XSS Framework'], 'gophish'),
  '42': [['kali', 'Kali Linux Site', 'url', 'https://www.kali.org'], ['tools', 'Kali Tools', 'url', 'https://www.kali.org/tools/'], ['docs', 'Kali Docs', 'url', 'https://www.kali.org/docs/'], ['forums', 'Kali Forums', 'url', 'https://forums.kali.org'], ['nethunter', 'Kali NetHunter', 'url', 'https://www.kali.org/get-kali/#kali-nethunter'], ['exploitdb', 'Exploit-DB', 'url', 'https://www.exploit-db.com'], ['ghdb', 'Google Hacking DB', 'url', 'https://www.exploit-db.com/google-hacking-database'], ['offsec', 'OffSec', 'url', 'https://www.offsec.com'], ['bugs', 'Kali Bug Tracker', 'url', 'https://bugs.kali.org']]
};
const toolItem = t => ({ k: t[2] || 'tool', id: t[0], n: t[1], url: t[3], i: t[2] === 'app' ? APPS[t[0]].icon : t[2] === 'url' ? '🌐' : '🛠' });
const appItem = id => ({ k: 'app', id, n: APPS[id].name, i: APPS[id].icon });
const allItems = () => { const o = [], seen = new Set(); [...Object.keys(APPS).map(appItem), ...Object.values(TOOLS).flat().map(toolItem)].forEach(x => { const k = x.k + x.id; if (!seen.has(k) && !(x.k === 'tool' && seen.has('app' + x.id))) { seen.add(k); o.push(x); } }); return o; };
const launch = x => x.k === 'app' ? OS.open(x.id) : x.k === 'url' ? OS.open('browser', { url: x.url }) : OS.open('terminal', { run: x.id });
const MSFMODS = [['auxiliary/scanner/portscan/tcp', 'TCP Port Scanner', 80], ['auxiliary/scanner/http/http_version', 'HTTP Version Detection', 80], ['auxiliary/scanner/ssh/ssh_version', 'SSH Version Scanner', 22], ['auxiliary/scanner/discovery/udp_sweep', 'UDP Service Sweeper', 161]];

/* ---------- Terminal (zsh-style, safe simulation) ---------- */
const BOOT0 = Date.now();
const SYSFILES = { '/etc/hostname': 'kali\n', '/etc/hosts': '127.0.0.1\tlocalhost\n127.0.1.1\tkali\n::1\tlocalhost ip6-localhost ip6-loopback\n', '/etc/os-release': 'PRETTY_NAME="Kali GNU/Linux Rolling"\nNAME="Kali GNU/Linux"\nVERSION_ID="2024.1"\nVERSION="2024.1"\nID=kali\nID_LIKE=debian\nHOME_URL="https://www.kali.org/"\n', '/etc/passwd': 'root:x:0:0:root:/root:/usr/bin/zsh\nkali:x:1000:1000:Kali,,,:/home/kali:/usr/bin/zsh\n' };
const SYSDIRS = { '/': 'bin boot dev etc home lib media mnt opt proc root run sbin srv sys tmp usr var', '/etc': 'hostname hosts os-release passwd', '/home': 'kali', '/tmp': '', '/usr': 'bin lib share', '/opt': '', '/var': 'log lib', '/root': '' };
const PORTS = [[21, 'ftp'], [22, 'ssh'], [25, 'smtp'], [53, 'domain'], [80, 'http'], [110, 'pop3'], [139, 'netbios-ssn'], [443, 'https'], [445, 'microsoft-ds'], [3306, 'mysql'], [8080, 'http-proxy']];
const hashS = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

const APPS = {
  terminal: { name: 'Terminal', icon: '⌨', w: 780, h: 470, cat: 'usual', fav: 1,
    render(b, w, arg) {
      let cwd = '/home/kali', hist = [], hi = 0, busy = false, mode = null, mod = null, opts = {}; const HOME = '/home/kali';
      b.style.display = 'flex'; b.style.flexDirection = 'column'; b.innerHTML = '<div class="term"><div class="to"></div><div class="tl"><div class="p1"></div><div class="rw"><span class="p1"><b>└─</b><span class="u">$</span> </span><input autocomplete="off" spellcheck="false"></div></div></div>';
      const term = $('.term', b), to = $('.to', b), inp = $('input', b), tilde = p => p === HOME ? '~' : p.startsWith(HOME + '/') ? '~' + p.slice(HOME.length) : p;
      const pr1 = () => `<span class="p1">┌──(<b class="u">kali㉿kali</b>)-[<b class="w">${escH(tilde(cwd))}</b>]</span>`, upd = () => { $('.tl .p1', b).innerHTML = mode ? '' : pr1(); $('.rw .p1', b).innerHTML = mode ? '<u>msf6</u>' + (mod ? ' <span class="er">' + escH(mod.split('/').slice(1).join('/')) + '</span>' : '') + ' &gt; ' : '<b>└─</b><span class="u">$</span> '; }, echo = v => html(mode ? `<span class="p1"><u>msf6</u>${mod ? ' <span class="er">' + escH(mod.split('/').slice(1).join('/')) + '</span>' : ''} &gt; </span>${escH(v)}` : `${pr1()}<br><span class="p1"><b>└─</b><span class="u">$</span> </span>${escH(v)}`);
      const say = (t, c) => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = t; to.appendChild(d); term.scrollTop = 1e9; }, html = h => { const d = document.createElement('div'); d.innerHTML = h; to.appendChild(d); term.scrollTop = 1e9; };
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const norm = p => { if (!p) return cwd; p = p.replace(/^~/, HOME); const parts = (p.startsWith('/') ? p : cwd + '/' + p).split('/'), o = []; parts.forEach(x => { if (x === '..') o.pop(); else if (x && x !== '.') o.push(x); }); return '/' + o.join('/'); };
      const fsKey = p => { const a = p.split('/'); return a.length === 4 && a[1] === 'home' && a[2] === 'kali' && DIRNAME[a[3]] ? DIRNAME[a[3]] : null; };
      const isDir = p => p === HOME || fsKey(p) || SYSDIRS[p] !== undefined, fileIn = async p => { const k = fsKey(p.split('/').slice(0, -1).join('/')); if (!k) return null; const n = p.split('/').pop(); return (await FS.list(k)).find(f => f.name === n) || null; };
      const dirOf = p => { const parts = p.split('/'); return fsKey(parts.slice(0, -1).join('/')); };
      b.insertBefore(mbar({ File: [['New Terminal', () => OS.open('terminal')], '-', ['Close', () => w.close()]], Edit: [['Clear', () => { to.textContent = ''; }], ['Select All', () => { const r = document.createRange(); r.selectNodeContents(to); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }]], Help: [['About', () => OS.dialog({ title: 'About', html: 'QTerminal (virtual) — all commands are simulated in the browser.' })]] }), b.firstChild);
      const C = {
        help: () => say('Commands: ls cd pwd cat echo touch rm cp mv head tail wc grep tree clear msfconsole whoami id hostname uname date uptime ifconfig ping nmap neofetch ps df free env history apt sudo open mousepad firefox thunar galculator wireshark exit\nTools in the Kali menu run as simulations — no real network traffic is sent.'),
        pwd: () => say(cwd), whoami: () => say('kali'), hostname: () => say('kali'), id: () => say('uid=1000(kali) gid=1000(kali) groups=1000(kali),4(adm),20(dialout),24(cdrom),27(sudo),44(video)'),
        clear: () => { to.textContent = ''; }, date: () => say(new Date().toString()), echo: a => say(a.join(' ')), history: () => say(hist.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`).join('\n')),
        uname: a => say(a.includes('-a') ? 'Linux kali 6.6.9-amd64 #1 SMP PREEMPT_DYNAMIC Kali 6.6.9-1kali1 (2024-01-08) x86_64 GNU/Linux' : 'Linux'),
        uptime: () => { const m = (Date.now() - BOOT0) / 6e4 | 0; say(` ${new Date().toLocaleTimeString('en-GB')} up ${m} min,  1 user,  load average: 0.08, 0.04, 0.01`); },
        env: () => say('USER=kali\nHOME=/home/kali\nSHELL=/usr/bin/zsh\nLANG=en_US.UTF-8\nPWD=' + cwd + '\nTERM=xterm-256color\nDESKTOP_SESSION=xfce'),
        df: () => say('Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        79G   14G   62G  19% /\ntmpfs           2.0G     0  2.0G   0% /dev/shm'),
        free: () => say('               total        used        free      shared  buff/cache   available\nMem:         4025884      912340     2210120       10240      903424     2956012\nSwap:        1000444           0     1000444'),
        ps: () => say('    PID TTY          TIME CMD\n    812 pts/0    00:00:00 zsh\n' + OS.wins.map((x, i) => `   ${900 + i * 7} ?        00:00:0${i % 9} ${x.id}`).join('\n') + '\n   1337 pts/0    00:00:00 ps'),
        ifconfig: () => say('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500\n        inet 192.168.56.101  netmask 255.255.255.0  broadcast 192.168.56.255\n        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>\n        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)\n\nlo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536\n        inet 127.0.0.1  netmask 255.0.0.0\n        loop  txqueuelen 1000  (Local Loopback)'),
        ls: async a => { const fl = a.filter(x => x[0] !== '-'), long = a.some(x => /^-.*l/.test(x)), all = a.some(x => /^-.*a/.test(x)), p = norm(fl[0]); let names = [];
          if (p === HOME) names = [...Object.keys(DIRNAME), 'Public', 'Templates'].sort().map(n => ({ n, d: 1 })); else if (fsKey(p)) names = (await FS.list(fsKey(p))).map(f => ({ n: f.name, d: 0, f })); else if (SYSDIRS[p] !== undefined) names = SYSDIRS[p].split(' ').filter(Boolean).map(n => ({ n, d: !/\./.test(n) && p !== '/etc' }));
          else { const f = await fileIn(p); if (f) return say(f.name); if (SYSFILES[p]) return say(p); return say(`ls: cannot access '${fl[0]}': No such file or directory`, 'er'); }
          if (all) names = [{ n: '.', d: 1 }, { n: '..', d: 1 }, ...names];
          if (long) html(names.map(x => `${x.d ? 'drwxr-xr-x' : '-rw-r--r--'} 1 kali kali ${String(x.f ? x.f.size : 4096).padStart(8)} ${new Date(x.f ? x.f.added : BOOT0).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ${x.d ? `<span class="dr">${escH(x.n)}</span>` : escH(x.n)}`).join('<br>'));
          else html(names.map(x => x.d ? `<span class="dr">${escH(x.n)}</span>` : escH(x.n)).join('&nbsp;&nbsp;') || '&nbsp;'); },
        cd: a => { const p = norm(a[0] || '~'); if (isDir(p)) { cwd = p; upd(); } else say(`cd: no such file or directory: ${a[0]}`, 'er'); },
        cat: async a => { for (const x of a) { const p = norm(x); if (SYSFILES[p]) { say(SYSFILES[p].replace(/\n$/, '')); continue; } const f = await fileIn(p); if (!f) { say(`cat: ${x}: No such file or directory`, 'er'); continue; } say(isText(f) ? (await f.blob.text()).replace(/\n$/, '') : `cat: ${x}: binary file`); } },
        touch: async a => { for (const x of a) { const p = norm(x), k = dirOf(p); if (!k) { say(`touch: cannot touch '${x}': Permission denied`, 'er'); continue; } if (!(await fileIn(p))) await FS.save(p.split('/').pop(), 'text/plain', new Blob(['']), k); } },
        rm: async a => { for (const x of a.filter(y => y[0] !== '-')) { const p = norm(x), f = await fileIn(p); if (!f) say(`rm: cannot remove '${x}': No such file or directory`, 'er'); else { await FS.del(f.id); OS.sync(); } } },
        mkdir: () => say('mkdir: this virtual file system only has the standard folders (Documents, Pictures …)', 'er'),
        open: async a => { const f = await fileIn(norm(a[0] || '')); f ? openFile(f) : say(`open: ${a[0] || ''}: No such file`, 'er'); },
        neofetch: () => html('<pre style="margin:0;line-height:1.25"><span class="u">  _,met$$$$$gg.        </span><b class="u">kali</b>@<b class="u">kali</b>\n<span class="u"> ,g$$$$$$$$$$$$$$$P.     </span>-----------\n<span class="u">,g$$P"     """Y$$.".   </span><b class="u">OS</b>: Kali GNU/Linux Rolling x86_64\n<span class="u">,$$P\'              `$$$.  </span><b class="u">Host</b>: Virtual Browser PC\n<span class="u">\',$$P       ,ggs.     `$$b: </span><b class="u">Kernel</b>: 6.6.9-amd64\n<span class="u">`d$$\'     ,$P"\'   .    $$$ </span><b class="u">Uptime</b>: ' + ((Date.now() - BOOT0) / 6e4 | 0) + ' mins\n<span class="u"> $$P      d$\'     ,    $$P </span><b class="u">Shell</b>: zsh 5.9\n<span class="u"> $$:      $$.   -    ,d$$\'  </span><b class="u">Resolution</b>: ' + innerWidth + 'x' + innerHeight + '\n<span class="u"> $$;      Y$b._   _,d$P\'    </span><b class="u">DE</b>: Xfce 4.18\n<span class="u"> Y$$.    `.`"Y$$$$P"\'       </span><b class="u">WM</b>: Xfwm4\n<span class="u"> `$$b      "-.__            </span><b class="u">Terminal</b>: qterminal\n<span class="u">  `Y$$b                    </span><b class="u">CPU</b>: ' + (navigator.hardwareConcurrency || 1) + ' threads\n<span class="u">   `Y$$.                  </span><b class="u">Memory</b>: ' + (navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'n/a') + '</pre>'),
        apt: a => { const s = a[0]; if (s === 'update') say('Hit:1 http://http.kali.org/kali kali-rolling InRelease\nReading package lists... Done\nAll packages are up to date. (simulated)'); else if (s === 'install') say(`Reading package lists... Done\nE: Unable to locate package ${a[1] || ''} — package installs are disabled in this virtual machine.`, 'er'); else say('apt 2.7.6 (amd64) — only `apt update` is simulated.'); },
        sudo: a => a.length ? run(a.join(' '), true) : say('usage: sudo command'),
        ping: async a => { const h = a.find(x => x[0] !== '-') || 'localhost'; if (/^-/.test(h)) return; say(`PING ${h} (${h === 'localhost' ? '127.0.0.1' : '93.184.216.' + (hashS(h) % 200 + 10)}) 56(84) bytes of data. [simulated]`); busy = true; for (let i = 1; i <= 4; i++) { await sleep(450); if (!busy) return; say(`64 bytes from ${h}: icmp_seq=${i} ttl=64 time=${(Math.random() * 20 + 4).toFixed(1)} ms`); } say(`\n--- ${h} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`); busy = false; },
        nmap: async a => { const t = a.find(x => x[0] !== '-'); if (!t) return say('Nmap 7.94 ( https://nmap.org )\nUsage: nmap [Scan Type(s)] [Options] {target specification}'); const h = hashS(t), ports = PORTS.filter((_, i) => (h >> i) & 1).slice(0, 4); if (!ports.length) ports.push(PORTS[1], PORTS[4]);
          say(`Starting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}\n[virtual lab — SIMULATED output, no packets are sent]`); await sleep(700); say(`Nmap scan report for ${t}\nHost is up (0.00${h % 90 + 10}s latency).\nNot shown: ${1000 - ports.length} closed tcp ports (conn-refused)\nPORT      STATE SERVICE\n${ports.map(p => `${(p[0] + '/tcp').padEnd(9)} open  ${p[1]}`).join('\n')}\n\nNmap done: 1 IP address (1 host up) scanned in 0.${h % 80 + 20} seconds`); }
      };
      const readF = async x => { const p = norm(x); if (SYSFILES[p]) return SYSFILES[p]; const f = await fileIn(p); return f && isText(f) ? await f.blob.text() : null; };
      Object.assign(C, {
        tree: () => say('/home/kali\n' + Object.keys(DIRNAME).map((n, i, l) => (i === l.length - 1 ? '└── ' : '├── ') + n).join('\n')),
        man: a => say(`No manual entry for ${a[0] || ''} (virtual machine) — try: ${a[0] || 'cmd'} --help`), which: a => say(C[a[0]] || APPCMD[a[0]] ? '/usr/bin/' + a[0] : `${a[0]} not found`, C[a[0]] || APPCMD[a[0]] ? '' : 'er'),
        curl: () => say('curl: network access is disabled in this virtual machine (no real traffic).', 'er'), wget: () => say('wget: network access is disabled in this virtual machine (no real traffic).', 'er'), sleep: async a => { await sleep((+a[0] || 0) * 1000); },
        head: async a => { const n = a.includes('-n') ? +a[a.indexOf('-n') + 1] : 10, t = await readF(a[a.length - 1]); t === null ? say('head: cannot open file', 'er') : say(t.split('\n').slice(0, n).join('\n')); },
        tail: async a => { const n = a.includes('-n') ? +a[a.indexOf('-n') + 1] : 10, t = await readF(a[a.length - 1]); t === null ? say('tail: cannot open file', 'er') : say(t.replace(/\n$/, '').split('\n').slice(-n).join('\n')); },
        wc: async a => { const t = await readF(a[a.length - 1]); t === null ? say('wc: cannot open file', 'er') : say(`${(t.match(/\n/g) || []).length} ${t.split(/\s+/).filter(Boolean).length} ${t.length} ${a[a.length - 1]}`); },
        grep: async a => { const t = await readF(a[a.length - 1]); if (t === null) return say('grep: file not found', 'er'); let re; try { re = new RegExp(a[0].replace(/^["']|["']$/g, ''), 'i'); } catch (e) { return say('grep: bad pattern', 'er'); } say(t.split('\n').filter(l => re.test(l)).join('\n')); },
        cp: async a => { const f = await fileIn(norm(a[0] || '')), t = norm(a[1] || ''); if (!f) return say(`cp: cannot stat '${a[0]}'`, 'er'); const k = fsKey(t) || dirOf(t); if (!k) return say('cp: permission denied', 'er'); await FS.save(fsKey(t) ? f.name : t.split('/').pop(), f.type, f.blob, k); },
        mv: async a => { const f = await fileIn(norm(a[0] || '')), t = norm(a[1] || ''); if (!f) return say(`mv: cannot stat '${a[0]}'`, 'er'); const k = fsKey(t) || dirOf(t); if (!k) return say('mv: permission denied', 'er'); await FS.save(fsKey(t) ? f.name : t.split('/').pop(), f.type, f.blob, k); await FS.del(f.id); OS.sync(); },
        searchsploit: () => say('searchsploit: the Exploit-DB archive is not installed in this virtual machine.', 'yl'),
        msfconsole: () => { html('<pre style="margin:0;color:#ff6b6b">                                                  \n  Metasploit Framework (virtual console)\n</pre>'); say('       =[ metasploit v6.3.44-dev (simulated)              ]\n+ -- --=[ 4 auxiliary scanner modules loaded              ]\n+ -- --=[ no exploit modules are included in this VM       ]\n\nType "help" for commands, "exit" to leave.'); mode = 'msf'; mod = null; upd(); }
      });
      const msfRun = async line => { const [c, ...a] = line.trim().split(/\s+/), cm = (c || '').toLowerCase(); if (!cm) return;
        if (cm === 'exit' || cm === 'quit') { mode = null; mod = null; upd(); return; }
        if (cm === 'help' || cm === '?') return say('Core Commands\n=============\n  help      Help menu\n  search    Search module names\n  use       Select a module\n  show      show options\n  set       Set a variable (e.g. set RHOSTS 192.168.56.1)\n  run       Run the module (simulated)\n  back      Leave the module\n  version   Framework version\n  exit      Exit the console');
        if (cm === 'version') return say('Framework: 6.3.44-dev (simulated)'); if (cm === 'back') { mod = null; upd(); return; }
        if (cm === 'search') { const l = MSFMODS.filter(m => !a[0] || (m[0] + m[1]).toLowerCase().includes(a[0].toLowerCase())); return say(l.length ? 'Matching Modules\n================\n\n  #  Name                                  Description\n  -  ----                                  -----------\n' + l.map((m, i) => `  ${i}  ${m[0].padEnd(37)} ${m[1]}`).join('\n') : '[-] No results from search', l.length ? '' : 'er'); }
        if (cm === 'use') { const m = MSFMODS.find((x, i) => x[0] === a[0] || String(i) === a[0]); if (!m) return say('[-] No results from search', 'er'); mod = m[0]; opts = { RHOSTS: '', RPORT: String(m[2]) }; upd(); return; }
        if (!mod) return say(`[-] Unknown command: ${c}. Run the "help" command for more details.`, 'er');
        if (cm === 'show') return say('Module options (' + mod + '):\n\n   Name     Current Setting  Required\n   ----     ---------------  --------\n' + Object.entries(opts).map(([k, v]) => `   ${k.padEnd(8)} ${(v || '').padEnd(16)} yes`).join('\n'));
        if (cm === 'set') { opts[(a[0] || '').toUpperCase()] = a[1] || ''; return say(`${(a[0] || '').toUpperCase()} => ${a[1] || ''}`); }
        if (cm === 'run' || cm === 'exploit') { if (!opts.RHOSTS) return say('[-] The following options failed to validate: RHOSTS', 'er'); say('[*] (simulated — no packets are sent)'); await sleep(500); const h = hashS(opts.RHOSTS), p = PORTS.filter((_, i) => (h >> i) & 1).slice(0, 3); say(mod.includes('portscan') ? p.map(x => `[+] ${opts.RHOSTS}:           - ${opts.RHOSTS}:${x[0]} - TCP OPEN`).join('\n') : `[+] ${opts.RHOSTS}:${opts.RPORT} - banner: ${mod.includes('ssh') ? 'SSH-2.0-OpenSSH_9.6' : 'Apache/2.4.58 (Debian)'}`, 'gn'); say(`[*] Scanned 1 of 1 hosts (100% complete)\n[*] Auxiliary module execution completed`); return; }
        say(`[-] Unknown command: ${c}.`, 'er'); };
      const APPCMD = { firefox: 'browser', thunar: 'files', mousepad: 'editor', galculator: 'calculator', wireshark: 'wireshark', ristretto: 'viewer', 'xfce4-taskmanager': 'taskmgr', 'xfce4-settings-manager': 'settings', nano: 'editor', vim: 'editor', gedit: 'editor' };
      const run = async (line, sudo) => { if (mode === 'msf') return msfRun(line); const [c, ...a] = line.trim().split(/\s+/); if (!c) return; const cm = c.toLowerCase();
        const red = line.match(/^echo\s+(.*?)\s*>\s*(\S+)\s*$/); if (red) { const p = norm(red[2]), k = dirOf(p); if (!k) return say(`zsh: permission denied: ${red[2]}`, 'er'); return void await FS.save(p.split('/').pop(), 'text/plain', new Blob([red[1].replace(/^["']|["']$/g, '') + '\n']), k); }
        if (C[cm]) return C[cm](a); if (APPCMD[cm]) { if (['nano', 'vim', 'gedit', 'mousepad'].includes(cm) && a[0]) { const f = await fileIn(norm(a[0])); return OS.open('editor', f ? f.id : undefined); } return OS.open(APPCMD[cm]); }
        if (cm === 'exit' || cm === 'logout') return w.close();
        if (Object.values(TOOLS).flat().some(x => x[0] === cm)) return say(`${cm}: this Kali tool is a placeholder in the virtual machine (no real tool is installed).\nTry: nmap, ping, ifconfig, neofetch.`, 'yl');
        say(`zsh: command not found: ${c}`, 'er'); };
      w.api.run = async cmd => { echo(cmd); await run(cmd); };
      inp.onkeydown = async e => { if (e.key === 'Enter') { const v = inp.value; echo(v); if (v.trim()) { hist.push(v); } hi = hist.length; inp.value = ''; await run(v); term.scrollTop = 1e9; }
        else if (e.key === 'ArrowUp') { hi = Math.max(0, hi - 1); inp.value = hist[hi] || ''; e.preventDefault(); } else if (e.key === 'ArrowDown') { hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; } else if (e.ctrlKey && e.key === 'l') { e.preventDefault(); to.textContent = ''; } else if (e.ctrlKey && e.key === 'c') { busy = false; say('^C'); } };
      term.onclick = () => { if (!getSelection().toString()) inp.focus(); }; upd(); setTimeout(() => { inp.focus(); if (arg && arg.run) w.api.run(arg.run); }, 60); w.api.arg = a => a && a.run && w.api.run(a.run); w.api.sync = () => {};
    } },
  files: { name: 'Thunar File Manager', icon: '📁', w: 760, h: 480, cat: 'usual', fav: 1,
    render(b, w, arg) {
      let loc = (arg && arg.loc) || 'docs', sel = null, hist = [], urls = {}, items = []; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const PL = [['home', '🏠 Home'], ['desktop', '🖥 Desktop'], ['docs', '📄 Documents'], ['downloads', '⬇ Downloads'], ['music', '🎵 Music'], ['pics', '🖼 Pictures'], ['videos', '🎞 Videos'], ['trash', '🗑 Trash'], ['sys', '💽 File System']];
      const upload = () => pickFiles('', fs => FS.import(fs, ['home', 'sys', 'trash'].includes(loc) ? undefined : loc)), go = l => { hist.push(loc); loc = l; sel = null; draw(); };
      b.innerHTML = '<div class="fm"></div>'; const fm = $('.fm', b);
      fm.appendChild(mbar({ File: [['Upload files…', upload], ['New file', () => act('new')], '-', ['Close', () => w.close()]], Go: [['Back', () => act('back')], ['Up', () => act('up')], ['Home', () => go('home')]] }));
      fm.insertAdjacentHTML('beforeend', '<div class="ftb"><button class="btn" data-a="back">◀</button><button class="btn" data-a="up">▲</button><div class="addr"></div><button class="btn pri" data-a="up2">⬆ Upload</button><button class="btn" data-a="new">＋ New file</button></div><div class="fb"><div class="fs"></div><div class="fr"></div></div><div class="fst"></div>');
      const path = l => l === 'home' ? '/home/kali' : l === 'sys' ? '/' : '/home/kali/' + (l === 'trash' ? '.local/share/Trash' : LOC[l]);
      const draw = async () => { w.setTitle((l => l === 'home' ? 'kali' : l === 'sys' ? 'File System' : LOC[l])(loc) + ' - File Manager'); $('.addr', fm).textContent = path(loc);
        $('.fs', fm).innerHTML = PL.map(p => `<div data-go="${p[0]}" class="${loc === p[0] ? 'on' : ''}">${p[1]}</div>`).join('');
        if (loc === 'home') items = [...Object.entries(DIRNAME).map(([n, k]) => ({ k: 'dir', loc: k, name: n, icon: '📁' })), { k: 'dir', loc: 'trash', name: 'Trash', icon: '🗑️' }];
        else if (loc === 'sys') items = 'bin boot dev etc home lib media mnt opt proc root run sbin srv sys tmp usr var'.split(' ').map(n => ({ k: 'static', name: n, icon: '📁' }));
        else items = (await FS.list(loc)).map(f => ({ k: 'file', f, name: f.name, icon: fileIcon(f) }));
        $('.fr', fm).innerHTML = items.map((x, i) => `<div class="it${sel === i ? ' sel' : ''}" data-i="${i}">${x.k === 'file' && isImg(x.f) ? `<i><img src="${U(x.f)}" alt=""></i>` : `<i>${x.icon}</i>`}<span>${escH(x.name)}</span></div>`).join('') || '<div style="color:var(--tx2);padding:30px">Folder is empty — use Upload, or drag & drop files here.</div>'; stat(); };
      const stat = () => { const s = items[sel]; $('.fst', fm).textContent = s ? (s.k === 'file' ? `"${s.name}" — ${fsize(s.f.size)} — ${s.f.type || 'unknown type'}` : `"${s.name}" — folder`) : `${items.length} item(s)`; };
      const act = async a => { const s = items[sel], f = s && s.f;
        if (a === 'back') { hist.length && (loc = hist.pop(), sel = null, draw()); } else if (a === 'up') loc !== 'home' && go('home'); else if (a === 'up2') upload();
        else if (a === 'new' && !['home', 'sys', 'trash'].includes(loc)) OS.dialog({ title: 'New File', html: 'Name:<br><input id="fn" class="in" value="untitled.txt" style="width:240px">', buttons: [['Create', m => FS.save($('#fn', m).value.trim() || 'untitled.txt', 'text/plain', new Blob(['']), loc)], ['Cancel']] });
        else if (a === 'dl' && f) download(f); else if (a === 'del' && f) { if (loc === 'trash') await FS.del(f.id); else await FS.put({ ...f, from: f.folder, folder: 'trash' }); sel = null; OS.sync(); }
        else if (a === 'restore' && f) { await FS.put({ ...f, folder: f.from || 'docs' }); sel = null; OS.sync(); } else if (a === 'empty') { for (const x of items) await FS.del(x.f.id); sel = null; OS.sync(); } };
      const openIt = x => { if (x.k === 'dir') go(x.loc); else if (x.k === 'file') openFile(x.f); };
      fm.onclick = e => { const a = e.target.closest('[data-a]'), g = e.target.closest('[data-go]'), i = e.target.closest('[data-i]'); if (a) act(a.dataset.a); else if (g) go(g.dataset.go); else if (i) { sel = +i.dataset.i; $$('.it', fm).forEach(n => n.classList.toggle('sel', n === i)); stat(); } else if (e.target.closest('.fr')) { sel = null; $$('.it', fm).forEach(n => n.classList.remove('sel')); stat(); } };
      fm.ondblclick = e => { const i = e.target.closest('[data-i]'); if (i) openIt(items[+i.dataset.i]); };
      fm.oncontextmenu = e => { const i = e.target.closest('[data-i]'); e.preventDefault(); e.stopPropagation(); if (!i) return OS.menu(e.clientX, e.clientY, [['Upload files…', upload], ['New file', () => act('new')], ['Empty Trash', () => act('empty'), loc !== 'trash']]); sel = +i.dataset.i; const x = items[sel]; draw();
        OS.menu(e.clientX, e.clientY, [['Open', () => openIt(x)], ...(x.k === 'file' ? [loc === 'trash' ? ['Restore', () => act('restore')] : null, ['Download', () => act('dl')], '-', [loc === 'trash' ? 'Delete permanently' : 'Move to Trash', () => act('del')]].filter(Boolean) : [])]); };
      b.ondragover = e => e.preventDefault(); b.ondrop = e => { e.preventDefault(); e.stopPropagation(); FS.import(e.dataTransfer.files, ['home', 'sys', 'trash'].includes(loc) ? undefined : loc); };
      b.tabIndex = 0; b.onkeydown = e => { if (e.key === 'Delete' && items[sel] && items[sel].k === 'file') act('del'); };
      w.api.sync = draw; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } },
  editor: { name: 'Mousepad', icon: '📝', w: 600, h: 420, cat: 'usual', fav: 1,
    render(b, w, arg) {
      let id = null, name = 'Untitled', folder = 'docs'; b.style.display = 'flex'; b.style.flexDirection = 'column'; const ta = document.createElement('textarea'); ta.className = 'ed'; ta.spellcheck = false; const title = () => w.setTitle(name + ' - Mousepad');
      const load = async fid => { const f = fid && await FS.get(fid); if (f) { ta.value = await f.blob.text(); id = f.id; name = f.name; folder = f.folder; title(); } };
      const save = async n => { if (n) name = n; const r = await FS.save(name, 'text/plain', new Blob([ta.value], { type: 'text/plain' }), folder, id); id = r.id; title(); OS.notify('Mousepad', `Saved to ${LOC[folder]}`); };
      b.appendChild(mbar({ File: [['New', () => { ta.value = ''; id = null; name = 'Untitled'; title(); }], ['Open…', () => pickFiles('', async fs => { ta.value = await fs[0].text(); name = fs[0].name; id = null; title(); })], ['Save', () => id || name !== 'Untitled' ? save() : saveAsDlg('untitled.txt', save)], ['Save As…', () => saveAsDlg(name === 'Untitled' ? 'untitled.txt' : name, n => { id = null; save(n); })], '-', ['Quit', () => w.close()]], Edit: [['Select All', () => ta.select()], ['Insert Date/Time', () => ta.setRangeText(new Date().toLocaleString(), ta.selectionStart, ta.selectionEnd, 'end')]], View: [['Word Wrap', () => { ta.style.whiteSpace = ta.style.whiteSpace === 'pre' ? '' : 'pre'; ta.wrap = ta.wrap === 'off' ? 'soft' : 'off'; }]] }));
      b.appendChild(ta); ta.style.flex = '1'; title(); load(arg); w.api.arg = load;
    } },
  browser: { name: 'Firefox ESR', icon: '🦊', w: 860, h: 540, cat: 'usual', fav: 1,
    render(b, w, arg) {
      const home = '<body style="margin:0;font:15px sans-serif;background:#1c1b22;color:#fbfbfe;text-align:center;padding-top:70px"><div style="font-size:54px">🐉</div><h1 style="font-weight:500">Kali Linux</h1><p>Type an address above and press Enter.</p><p style="color:#9aa0a8;font-size:13px">Many sites block framing — use ↗ to open them in a real tab.</p><p><a style="color:#80b4ff" href="https://www.kali.org/docs/">Kali Docs</a> · <a style="color:#80b4ff" href="https://en.wikipedia.org">Wikipedia</a> · <a style="color:#80b4ff" href="https://www.openstreetmap.org">OpenStreetMap</a></p></body>';
      b.innerHTML = '<div class="br"><div class="bar"><button class="btn" data-a="back">◀</button><button class="btn" data-a="fw">▶</button><button class="btn" data-a="rl">⟳</button><button class="btn" data-a="home">🏠</button><input class="in" id="u" placeholder="Search or enter address"><button class="btn" data-a="ext" title="Open in a real tab">↗</button></div><iframe></iframe></div>';
      const f = $('iframe', b), u = $('#u', b); let H = [], i = -1;
      const nav = (v, push = true) => { v = (v || '').trim(); if (!v) return; if (!/^(https?:|about:)/.test(v)) v = /^[\w-]+(\.[\w-]+)+/.test(v) && !v.includes(' ') ? 'https://' + v : 'https://duckduckgo.com/?q=' + encodeURIComponent(v); if (push) { H = H.slice(0, i + 1); H.push(v); i++; } u.value = v === 'about:home' ? '' : v; if (v === 'about:home') { f.removeAttribute('src'); f.srcdoc = home; } else { f.removeAttribute('srcdoc'); f.src = v; } };
      b.onclick = e => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'home') nav('about:home'); else if (k === 'rl') nav(H[i], false); else if (k === 'back' && i > 0) nav(H[--i], false); else if (k === 'fw' && i < H.length - 1) nav(H[++i], false); else if (k === 'ext') window.open(u.value || 'https://www.kali.org', '_blank'); };
      u.onkeydown = e => { if (e.key === 'Enter') nav(u.value); }; nav(arg && arg.url || 'about:home');
    } },
  calculator: { name: 'Galculator', icon: '🧮', w: 280, h: 360, fixed: 1, cat: 'usual',
    render(b) {
      let x = ''; b.innerHTML = '<div class="calc"><div class="cd">0</div><div class="cg"></div></div>'; const K = ['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '⌫', '='], d = $('.cd', b);
      $('.cg', b).innerHTML = K.map(k => `<button class="${/[\/*\-+=]/.test(k) && k.length === 1 ? 'op' : ''}">${k}</button>`).join('');
      $('.cg', b).onclick = e => { const k = e.target.textContent; if (e.target.tagName !== 'BUTTON') return; if (x === 'Error') x = ''; if (k === 'C') x = ''; else if (k === '⌫') x = x.slice(0, -1); else if (k === '=') { try { if (!/^[\d+\-*/.() ]+$/.test(x)) throw 0; x = String(+Function('return ' + x)().toFixed(10)); } catch (er) { x = 'Error'; } } else x += k; d.textContent = x || '0'; };
    } },
  viewer: { name: 'Ristretto Image Viewer', icon: '🖼️', w: 640, h: 480,
    render(b, w, arg) {
      let url = null, rec = null; b.style.display = 'flex'; b.style.flexDirection = 'column';
      b.appendChild(mbar({ File: [['Edit in Mousepad (as text)', () => rec && OS.open('editor', rec.id)], ['Set as Desktop Background', () => rec && OS.set({ wall: 'u:' + rec.id })], ['Download', () => rec && download(rec)], '-', ['Close', () => w.close()]] })); const v = document.createElement('div'); v.className = 'vw'; v.style.flex = '1'; b.appendChild(v);
      const load = async id => { rec = await FS.get(id); if (!rec) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(rec.blob); v.innerHTML = `<img src="${url}" alt="">`; w.setTitle(rec.name + ' - Ristretto'); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  media: { name: 'Parole Media Player', icon: '▶️', w: 520, h: 360,
    render(b, w, arg) {
      let url = null; const load = async id => { const r = await FS.get(id); if (!r) return; url && URL.revokeObjectURL(url); url = URL.createObjectURL(r.blob);
        b.innerHTML = `<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:var(--bg2)">${isVideo(r) ? `<video src="${url}" controls autoplay style="max-width:100%;max-height:82%"></video>` : `<div style="font-size:70px">🎵</div><audio src="${url}" controls autoplay style="width:80%"></audio>`}<b>${escH(r.name)}</b></div>`; w.setTitle(r.name + ' - Parole'); }; load(arg); w.api.arg = load; w.api.close = () => url && URL.revokeObjectURL(url);
    } },
  wireshark: { name: 'Wireshark (simulated)', icon: '🦈', w: 760, h: 440, cat: '09',
    render(b, w) {
      let n = 0, on = true; const P = [['TCP', 'Info', '[ACK] Seq=1 Ack=1 Win=64240'], ['DNS', 'Info', 'Standard query A example.org'], ['HTTP', 'Info', 'GET / HTTP/1.1'], ['ARP', 'Info', 'Who has 192.168.56.1? Tell 192.168.56.101'], ['UDP', 'Info', 'Len=48'], ['TLSv1.3', 'Info', 'Application Data']];
      b.innerHTML = '<div style="display:flex;flex-direction:column;height:100%"><div class="ftb"><button class="btn pri" id="st">⏹ Stop</button><span style="color:var(--tx2)">Simulated capture on eth0 — no real traffic.</span></div><div style="flex:1;overflow:auto"><table class="wsh"><thead><tr><th>No.</th><th>Time</th><th>Source</th><th>Destination</th><th>Protocol</th><th>Info</th></tr></thead><tbody></tbody></table></div></div>';
      const tb = $('tbody', b), box = tb.parentNode.parentNode, t0 = Date.now(), ips = ['192.168.56.101', '93.184.216.34', '151.101.1.69', '192.168.56.1', '8.8.8.8'];
      const iv = setInterval(() => { if (!on) return; if (!b.isConnected) return clearInterval(iv); const p = P[Math.random() * P.length | 0], a = ips[Math.random() * ips.length | 0], c = ips[Math.random() * ips.length | 0]; n++; const tr = document.createElement('tr'); tr.innerHTML = `<td>${n}</td><td>${((Date.now() - t0) / 1e3).toFixed(6)}</td><td>${a}</td><td>${c}</td><td>${p[0]}</td><td>${p[2]}</td>`; tb.appendChild(tr); if (tb.rows.length > 200) tb.deleteRow(0); box.scrollTop = 1e9; }, 350);
      $('#st', b).onclick = function () { on = !on; this.textContent = on ? '⏹ Stop' : '▶ Start'; }; w.api.close = () => clearInterval(iv);
    } },
  taskmgr: { name: 'Task Manager', icon: '📊', w: 440, h: 440, single: 1, cat: 'usual',
    render(b, w) {
      let sel = null, cpu = Array(50).fill(6); b.style.display = 'flex'; b.style.flexDirection = 'column'; const list = () => OS.wins.filter(x => x.id !== 'taskmgr');
      const draw = () => { const L = list(); cpu.push(Math.min(100, 4 + L.length * 5 + Math.random() * 14)); cpu.shift(); const c = cpu[cpu.length - 1] | 0;
        b.innerHTML = `<div style="padding:8px 10px;flex:1;overflow:auto">${L.map((x, i) => `<div class="tmr${sel === x ? ' on' : ''}" data-w="${i}"><span>${x.app.icon} ${escH($('.tt', x.el).textContent)}</span><span>${x.min ? 'minimized' : 'running'}</span></div>`).join('') || '<div class="tmr">No applications running</div>'}</div><canvas id="cg" width="420" height="80" style="background:#000;margin:0 10px;border-radius:4px;width:calc(100% - 20px)"></canvas><div style="padding:6px 10px;display:flex;justify-content:space-between;align-items:center"><span>CPU ${c}% — ${L.length} windows</span><span><button class="btn" data-a="sw">Switch To</button> <button class="btn pri" data-a="kill">Kill</button></span></div>`;
        const x = $('#cg', b).getContext('2d'); x.strokeStyle = '#3ddc84'; x.beginPath(); cpu.forEach((v, i) => x[i ? 'lineTo' : 'moveTo'](i * 8.5, 80 - v * .75)); x.stroke(); };
      b.onclick = e => { const r = e.target.closest('[data-w]'), a = e.target.closest('[data-a]'); if (r) sel = list()[+r.dataset.w]; else if (a && sel) { if (a.dataset.a === 'kill') { OS.close(sel); sel = null; } else { OS.restore(sel); OS.focus(sel); } } draw(); };
      const iv = setInterval(() => b.isConnected ? draw() : clearInterval(iv), 1000); w.api.close = () => clearInterval(iv); draw();
    } },
  settings: { name: 'Settings', icon: '⚙️', w: 640, h: 470, single: 1, cat: 'usual', fav: 1,
    render(b, w, arg) {
      let tab = (arg && arg.tab) || 'wall', urls = {}; const U = f => urls[f.id] || (urls[f.id] = URL.createObjectURL(f.blob));
      const draw = async () => { const s = OS.settings; let h = '';
        if (tab === 'wall') { const pics = (await FS.list('pics')).filter(isImg); h = `<h3>Desktop Background</h3><div class="wg">${WALLS.map(x => `<div class="wt${s.wall === x.id ? ' on' : ''}" data-w="${x.id}" style="background-image:url('${x.img}')"><small>${x.name}</small></div>`).join('')}${pics.map(f => `<div class="wt${s.wall === 'u:' + f.id ? ' on' : ''}" data-w="u:${f.id}" style="background-image:url('${U(f)}')"><small>${escH(f.name)}</small></div>`).join('')}</div><button class="btn pri" data-up>⬆ Add your own image…</button> &nbsp; Style: <select id="fit">${['zoom', 'center', 'tile', 'stretch'].map(p => `<option${s.fit === p ? ' selected' : ''}>${p}</option>`).join('')}</select>`; }
        else if (tab === 'look') h = `<h3>Appearance</h3>Style: <select id="th"><option value="dark"${s.theme === 'dark' ? ' selected' : ''}>Kali-Dark</option><option value="light"${s.theme === 'light' ? ' selected' : ''}>Kali-Light</option></select><br><br>Accent colour:<br><br>${[['blue', '#2f7bf0'], ['purple', '#8b5cf6'], ['red', '#e5484d'], ['green', '#2fb36a']].map(c => `<span data-ac="${c[0]}" style="display:inline-block;width:30px;height:30px;border-radius:50%;margin-right:8px;cursor:pointer;background:${c[1]};border:3px solid ${s.accent === c[0] ? 'var(--tx)' : 'transparent'}"></span>`).join('')}`;
        else if (tab === 'disp') h = `<h3>Display</h3>Brightness<br><input type="range" id="br" min="30" max="100" value="${s.brightness}" style="width:80%"><br><br>Resolution: ${innerWidth} × ${innerHeight}`;
        else h = `<h3>About this system</h3><div style="font-size:50px">🐉</div><p style="line-height:1.8">Kali GNU/Linux Rolling (virtual replica)<br>Desktop: Xfce 4.18 style<br>Kernel: 6.6.9-amd64 (simulated)<br>CPU threads: ${navigator.hardwareConcurrency || 1}<br>Memory: ${navigator.deviceMemory ? navigator.deviceMemory + ' GiB' : 'n/a'}<br>User: kali</p><p style="color:var(--tx2)">Not affiliated with OffSec. All security tools are simulations.</p>`;
        b.innerHTML = `<div class="sx"><div class="sxl">${[['wall', '🖼 Desktop'], ['look', '🎨 Appearance'], ['disp', '🖥 Display'], ['about', 'ℹ About']].map(t => `<div data-t="${t[0]}" class="${tab === t[0] ? 'on' : ''}">${t[1]}</div>`).join('')}</div><div class="sxr">${h}</div></div>`; };
      b.onclick = e => { const t = e.target.closest('[data-t]'), x = e.target.closest('[data-w]'), a = e.target.closest('[data-ac]'); if (t) { tab = t.dataset.t; draw(); } else if (x) OS.set({ wall: x.dataset.w }); else if (a) OS.set({ accent: a.dataset.ac });
        else if (e.target.closest('[data-up]')) pickFiles('image/*', async fs => { const ids = await FS.import(fs); if (ids[0]) OS.set({ wall: 'u:' + ids[0] }); }); };
      b.onchange = e => { if (e.target.id === 'fit') OS.set({ fit: e.target.value }); else if (e.target.id === 'th') OS.set({ theme: e.target.value }); }; b.oninput = e => { if (e.target.id === 'br') OS.set({ brightness: +e.target.value }); };
      w.api.sync = () => { const a = document.activeElement; if (!(a && a.type === 'range' && b.contains(a)) && !$('select:focus', b)) draw(); }; w.api.arg = a2 => { if (a2 && a2.tab) { tab = a2.tab; draw(); } }; w.api.close = () => Object.values(urls).forEach(URL.revokeObjectURL); draw();
    } }
};

/* ---------- more apps: Zenmap (sim), Burp Suite (sim + working Decoder), Application Finder, Notes ---------- */
Object.assign(APPS, {
  zenmap: { name: 'Zenmap', icon: '🛰', w: 780, h: 470,
    render(b) {
      const PR = { 'Intense scan': '-T4 -A -v', 'Intense scan plus UDP': '-sS -sU -T4 -A -v', 'Quick scan': '-T4 -F', 'Ping scan': '-sn', 'Regular scan': '' };
      b.innerHTML = `<div style="display:flex;flex-direction:column;height:100%"><div class="ftb" style="flex-wrap:wrap">Target: <input class="in" id="tg" value="192.168.56.1" style="width:170px"> Profile: <select id="pf">${Object.keys(PR).map(k => `<option>${k}</option>`).join('')}</select><button class="btn pri" id="sc">Scan</button><button class="btn" id="cn">Cancel</button></div><div class="ftb">Command: <input class="in" id="cm" readonly style="flex:1"></div><pre class="term" id="zo" style="margin:0;flex:1;white-space:pre-wrap">Zenmap is simulated: no packets are ever sent.</pre></div>`;
      const cmd = () => { $('#cm', b).value = `nmap ${PR[$('#pf', b).value]} ${$('#tg', b).value}`.replace(/\s+/g, ' '); }; cmd(); b.oninput = cmd; b.onchange = cmd; let tk = 0;
      $('#sc', b).onclick = async () => { const t = $('#tg', b).value.trim(), my = ++tk; if (!t) return; const h = hashS(t), ports = PORTS.filter((_, i) => (h >> i) & 1).slice(0, 4); if (!ports.length) ports.push(PORTS[1], PORTS[4]); const o = $('#zo', b);
        o.textContent = `${$('#cm', b).value}\n\nStarting Nmap 7.94 ( https://nmap.org ) at ${new Date().toLocaleString()}\n[SIMULATED]\n`; await new Promise(r => setTimeout(r, 900)); if (my !== tk) return;
        o.textContent += `Nmap scan report for ${t}\nHost is up (0.00${h % 90 + 10}s latency).\nPORT      STATE SERVICE\n${ports.map(p => `${(p[0] + '/tcp').padEnd(9)} open  ${p[1]}`).join('\n')}\n\nNmap done: 1 IP address (1 host up) scanned in 0.${h % 80 + 20} seconds`; };
      $('#cn', b).onclick = () => { tk++; $('#zo', b).textContent += '\nScan cancelled.'; };
    } },
  burpsuite: { name: 'Burp Suite Community Edition', icon: '🧿', w: 820, h: 500,
    render(b) {
      let tab = 'proxy', on = false; const H = [['GET', '/', '200', '1542'], ['GET', '/login', '200', '2310'], ['POST', '/login', '302', '312'], ['GET', '/static/app.js', '200', '18344'], ['GET', '/api/items', '200', '964'], ['GET', '/favicon.ico', '404', '287']];
      const draw = () => { const T = [['dash', 'Dashboard'], ['proxy', 'Proxy'], ['rep', 'Repeater'], ['dec', 'Decoder']]; let h = '';
        if (tab === 'dash') h = '<h3>Dashboard</h3><p>Burp Suite is simulated in this virtual machine. No proxying or scanning takes place.</p><p>Use <b>Decoder</b> for real Base64 / URL / Hex conversions.</p>';
        else if (tab === 'proxy') h = `<div style="margin-bottom:8px"><button class="btn ${on ? 'pri' : ''}" data-i>Intercept is ${on ? 'on' : 'off'}</button> <span style="color:var(--tx2)">HTTP history (sample data)</span></div><table class="wsh"><thead><tr><th>#</th><th>Host</th><th>Method</th><th>URL</th><th>Status</th><th>Length</th></tr></thead><tbody>${H.map((r, i) => `<tr><td>${i + 1}</td><td>http://192.168.56.1</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>`;
        else if (tab === 'rep') h = '<div style="display:flex;gap:10px;height:300px"><div style="flex:1;display:flex;flex-direction:column"><div style="margin-bottom:4px"><button class="btn pri" data-send>Send</button> Request</div><textarea class="ed" id="rq" style="flex:1;border:1px solid var(--bd)">GET / HTTP/1.1\nHost: 192.168.56.1\nUser-Agent: Mozilla/5.0\nAccept: */*\n</textarea></div><div style="flex:1;display:flex;flex-direction:column"><div style="margin-bottom:4px">Response</div><textarea class="ed" id="rs" readonly style="flex:1;border:1px solid var(--bd)"></textarea></div></div>';
        else h = '<textarea class="ed" id="di" placeholder="Enter text to encode or decode" style="height:100px;border:1px solid var(--bd)"></textarea><div style="margin:8px 0"><button class="btn" data-d="b64e">Base64 encode</button> <button class="btn" data-d="b64d">Base64 decode</button> <button class="btn" data-d="ue">URL encode</button> <button class="btn" data-d="ud">URL decode</button> <button class="btn" data-d="he">Hex encode</button></div><textarea class="ed" id="do" readonly style="height:100px;border:1px solid var(--bd)"></textarea>';
        b.innerHTML = `<div class="tabs" style="display:flex;gap:2px;padding:6px 8px 0;background:var(--bg2)">${T.map(t => `<span data-t="${t[0]}" style="padding:6px 14px;border-radius:5px 5px 0 0;cursor:default;background:${tab === t[0] ? 'var(--bg)' : 'transparent'};${tab === t[0] ? 'color:#ff8a3d;font-weight:700' : ''}">${t[1]}</span>`).join('')}</div><div style="padding:12px">${h}</div>`; };
      b.onclick = e => { const t = e.target.closest('[data-t]'), d = e.target.closest('[data-d]');
        if (t) { tab = t.dataset.t; draw(); } else if (e.target.closest('[data-i]')) { on = !on; draw(); } else if (e.target.closest('[data-send]')) $('#rs', b).value = 'HTTP/1.1 200 OK\nServer: Apache/2.4.58 (Debian)\nContent-Type: text/html\n\n<html>(simulated response — no request was sent)</html>';
        else if (d) { const v = $('#di', b).value, k = d.dataset.d; let o = ''; try { o = k === 'b64e' ? btoa(unescape(encodeURIComponent(v))) : k === 'b64d' ? decodeURIComponent(escape(atob(v.trim()))) : k === 'ue' ? encodeURIComponent(v) : k === 'ud' ? decodeURIComponent(v) : [...new TextEncoder().encode(v)].map(x => x.toString(16).padStart(2, '0')).join(''); } catch (er) { o = 'Error: invalid input'; } $('#do', b).value = o; } }; draw();
    } },
  appfinder: { name: 'Application Finder', icon: '🔎', w: 440, h: 440, single: 1,
    render(b, w) {
      b.innerHTML = '<div style="padding:10px;display:flex;flex-direction:column;height:100%;gap:8px"><input class="in" id="q" placeholder="Search applications…"><div id="l" style="flex:1;overflow:auto"></div></div>'; let L = [], sel = 0;
      const draw = () => { const q = $('#q', b).value.toLowerCase(); L = allItems().filter(x => x.n.toLowerCase().includes(q)); sel = Math.min(sel, Math.max(0, L.length - 1)); $('#l', b).innerHTML = L.map((x, i) => `<div class="kai${i === sel ? ' on' : ''}" data-i="${i}" style="${i === sel ? 'background:var(--ac);color:#fff' : ''}"><i>${x.i}</i>${escH(x.n)}</div>`).join(''); };
      $('#q', b).oninput = () => { sel = 0; draw(); }; $('#q', b).onkeydown = e => { if (e.key === 'ArrowDown') { sel = Math.min(L.length - 1, sel + 1); draw(); } else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); } else if (e.key === 'Enter' && L[sel]) { launch(L[sel]); w.close(); } };
      $('#l', b).ondblclick = e => { const i = e.target.closest('[data-i]'); if (i) { launch(L[+i.dataset.i]); w.close(); } }; $('#l', b).onclick = e => { const i = e.target.closest('[data-i]'); if (i) { sel = +i.dataset.i; draw(); } }; draw(); setTimeout(() => $('#q', b).focus(), 50);
    } },
  notes: { name: 'Notes', icon: '🗒', w: 300, h: 300,
    render(b) { b.innerHTML = '<textarea class="ed" style="background:#fff3a8;color:#3b3300;font-family:inherit;font-size:14px" placeholder="Write a note…"></textarea>'; const t = $('textarea', b); t.value = jget('kali_notes', ''); t.oninput = () => jset('kali_notes', t.value); }
  }
});

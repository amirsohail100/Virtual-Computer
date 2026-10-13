/* ===== Virtual Computer — home page =====
   Naya OS add karna ho: os/<naam>/ folder banao (index.html ke saath),
   phir SYSTEMS me uski entry me ready:true aur path likh do. */
const SYSTEMS = [
  { id: 'windows', name: 'Windows 11', ready: true, path: 'os/windows/index.html',
    desc: 'Desktop with Start menu, taskbar, File Explorer, Settings, Notepad, Paint and more.',
    preview: '<div class="mon win-p"><div class="wnd"></div><div class="tbar"><i></i><i></i><i></i><i></i></div></div>' },
  { id: 'winxp', name: 'Windows XP', ready: false,
    desc: 'The classic Bliss desktop with the green Start button, taskbar and old-school windows.',
    preview: '<div class="mon xp-p"><div class="xwin"></div><div class="xbar"></div><div class="xstart"></div></div>' },
  { id: 'mac', name: 'macOS', ready: true, path: 'os/mac/index.html',
    desc: 'Menu bar, Dock with magnification, Finder, Launchpad, Spotlight, Control Center and apps.',
    preview: '<div class="mon mac-p"><div class="mbar"></div><div class="dock"><i></i><i></i><i></i><i></i><i></i></div></div>' },
  { id: 'ubuntu', name: 'Ubuntu Linux', ready: false,
    desc: 'GNOME-style desktop with a side dock, Activities, Files, Terminal and Software.',
    preview: '<div class="mon ub-p"><div class="utop"></div><div class="udock"><i></i><i></i><i></i><i></i></div><div class="uwin"></div></div>' },
  { id: 'kali', name: 'Kali Linux', ready: false,
    desc: 'Dark desktop with a powerful terminal and a menu of tools for learning.',
    preview: '<div class="mon kl-p"><div class="kbar"></div><div class="kterm"><i>┌──(kali@kali)-[~]</i><i>└─$ ▌</i></div></div>' },
  { id: 'android', name: 'Android', ready: false,
    desc: 'Phone home screen, app drawer, notification shade and quick settings.',
    preview: '<div class="ph and-p"><div class="grid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="pill"></div></div>' },
  { id: 'iphone', name: 'iPhone', ready: false,
    desc: 'Home screen, App Library, Control Center and lock screen.',
    preview: '<div class="ph ios-p"><div class="island"></div><div class="grid"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="home"></div></div>' }
];

const cards = document.getElementById('cards'), toast = document.getElementById('toast'), veil = document.getElementById('veil');
cards.innerHTML = SYSTEMS.map(s => `<button class="card ${s.ready ? 'ready' : 'soon'}" data-id="${s.id}" aria-label="${s.name}${s.ready ? '' : ' (coming soon)'}">
  <div class="prev">${s.preview}</div>
  <div class="info"><h2>${s.name}<span class="badge">${s.ready ? 'Available' : 'Coming soon'}</span></h2><p>${s.desc}</p>
  <div class="go">${s.ready ? 'Launch ▶' : 'Coming soon'}</div></div></button>`).join('');

/* footer counter + toast helper */
const readyNames = () => SYSTEMS.filter(x => x.ready).map(x => x.name).join(' and ');
document.getElementById('ver').textContent = SYSTEMS.filter(x => x.ready).length + ' ready · ' + SYSTEMS.filter(x => !x.ready).length + ' coming soon';

let tt;
function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200); }

cards.addEventListener('click', e => {
  const c = e.target.closest('.card'); if (!c) return;
  const s = SYSTEMS.find(x => x.id === c.dataset.id);
  if (!s.ready) return say(s.name + ' is coming soon. ' + readyNames() + ' ' + (SYSTEMS.filter(x => x.ready).length > 1 ? 'are' : 'is') + ' ready to try!');
  document.body.classList.add('leaving'); veil.classList.add('on');
  setTimeout(() => { location.href = s.path; }, 420);
});
/* back button se wapas aao to veil hata do */
window.addEventListener('pageshow', () => { document.body.classList.remove('leaving'); veil.classList.remove('on'); });
